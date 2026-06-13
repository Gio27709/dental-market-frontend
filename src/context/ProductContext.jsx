/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from "react";
import PropTypes from "prop-types";
import api, { getProducts, getTrendingAPI } from "../services/api";
import { BCV_RATE_KEY } from "../utils/constants";
import { useLocationContext } from "../hooks/useLocationContext";

const ProductContext = createContext();
const CACHE_KEY = "dental_market_products_cache";
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes
const MAX_CACHED_STATES = 2; // Keep at most 2 state-specific caches

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { buyerState } = useLocationContext();
  const [bcvRate, setBcvRate] = useState(() => {
    return localStorage.getItem(BCV_RATE_KEY) || 1;
  });
  const [trendingProductIds, setTrendingProductIds] = useState(new Set());

  const fetchProductsAndSettings = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const buyerState = localStorage.getItem("buyer_state") || "";

      // --- Cache Check ---
      if (!forceRefresh) {
        const cachedStr = localStorage.getItem(CACHE_KEY + "_" + buyerState);
        if (cachedStr) {
          try {
            const cachedData = JSON.parse(cachedStr);
            if (Date.now() - cachedData.timestamp < CACHE_TTL) {
              setProducts(cachedData.products);
              setFilteredProducts(cachedData.products);
              setTrendingProductIds(new Set(cachedData.trendingProductIds || []));
              if (cachedData.bcvRate) {
                // Prefer the global localStorage rate if available (e.g. admin just updated it),
                // otherwise fallback to what was stored directly in cache.
                const validRate = localStorage.getItem(BCV_RATE_KEY) || cachedData.bcvRate;
                setBcvRate(validRate);
              }
              setLoading(false);
              return; // Serve from cache
            }
          } catch (e) {
            console.error("Error parsing cache:", e);
          }
        }
      }
      // -------------------

      // Fetch concurrently for performance
      // Phase 3: Pass buyer_state to trending API for geo-boosted trending
      const [productsRes, settingsRes, trendingRes] = await Promise.all([
        getProducts({ buyer_state: buyerState, limit: 20 }),
        api.get("/admin/settings").catch(() => ({ data: { data: {} } })), // Fallback if settings fail
        getTrendingAPI({ prod_limit: 8, buyer_state: buyerState }).catch(() => ({ data: { data: { trending_products: [] } } }))
      ]);

      const rawData = productsRes.data.data || productsRes.data;
      
      // SOLO verdaderos más vendidos: deben tener ventas (total_sold > 0) y máximo los top 5
      const trendingIds = (trendingRes.data?.data?.trending_products || [])
        .filter(p => p.total_sold > 0)
        .slice(0, 5)
        .map(p => p.id);
        
      setTrendingProductIds(new Set(trendingIds));

      // Map product_variations from Supabase to variations field expected by UI
      const productData = rawData.map((p) => ({
        ...p,
        variations: p.product_variations || [],
        store: p.store_profiles || p.store || null,
        brand: p.brands || null,
      }));

      setProducts(productData);
      setFilteredProducts(productData);

      // Handle BCV Rate
      let currentBcvRate = bcvRate;
      const settingsData = settingsRes.data?.data || {};
      if (settingsData.bcv_rate?.rate) {
        currentBcvRate = settingsData.bcv_rate.rate;
        setBcvRate(currentBcvRate);
        localStorage.setItem(BCV_RATE_KEY, currentBcvRate);
      }

      // --- Save to Cache ---
      try {
        localStorage.setItem(
          CACHE_KEY + "_" + buyerState,
          JSON.stringify({
            timestamp: Date.now(),
            products: productData,
            bcvRate: currentBcvRate,
            trendingProductIds: trendingIds,
          })
        );
      } catch (e) {
        console.error("Error saving cache:", e);
      }
      // -------------------
    } catch (err) {
      setError(err.message || "Failed to load catalog data");
    } finally {
      setLoading(false);
    }
  }, [bcvRate]);

  const fetchProductById = useCallback(async (id) => {
    // NOTE: Removed global setLoading() here to prevent infinite React render loops
    // since this function is a dependency in ProductDetail's useEffect.
    const res = await api.get(`/products/${id}`);
    const rawData = res.data.data || res.data;

    // Map product_variations to expected UI variations field
    return {
      ...rawData,
      variations: rawData.product_variations || [],
      store: rawData.store_profiles || rawData.store || null,
      brand: rawData.brands || null,
    };
  }, []);

  const fetchSimilarProducts = useCallback(async (id) => {
    try {
      // Phase 3: Pass buyer_state for geo-sorted comparisons
      const currentBuyerState = localStorage.getItem("buyer_state") || "";
      const queryParam = currentBuyerState ? `?buyer_state=${encodeURIComponent(currentBuyerState)}` : "";
      const res = await api.get(`/products/${id}/compare${queryParam}`);
      const rawData = res.data.data || [];
      return rawData.map(p => ({
        ...p,
        variations: p.product_variations || [],
        store: p.store_profiles || p.store || null,
        brand: p.brands || null,
      }));
    } catch (err) {
      console.error("Failed to fetch similar products:", err);
      return [];
    }
  }, []);

  const applyFilters = useCallback(
    ({ search = "", category = "", maxPrice = null }) => {
      let filtered = [...products];

      if (search) {
        const lowerSearch = search.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(lowerSearch) ||
            (p.description &&
              p.description.toLowerCase().includes(lowerSearch)),
        );
      }

      if (category) {
        filtered = filtered.filter((p) => p.category_id === category);
      }

      if (maxPrice !== null) {
        filtered = filtered.filter((p) => p.price <= maxPrice);
      }

      setFilteredProducts(filtered);
    },
    [products],
  );

  // Phase 5.1: Purge stale caches when buyerState changes
  // Keeps only the current state's cache + 1 most recent other cache
  useEffect(() => {
    try {
      const prefix = CACHE_KEY + "_";
      const cacheEntries = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const stateSuffix = key.slice(prefix.length);
          // Skip the current state's cache
          if (stateSuffix === (buyerState || "")) continue;

          try {
            const cached = JSON.parse(localStorage.getItem(key));
            cacheEntries.push({ key, timestamp: cached?.timestamp || 0 });
          } catch {
            // Corrupted cache entry — remove it
            localStorage.removeItem(key);
          }
        }
      }

      // Keep only the most recent (MAX_CACHED_STATES - 1) entries, remove the rest
      if (cacheEntries.length > MAX_CACHED_STATES - 1) {
        cacheEntries.sort((a, b) => b.timestamp - a.timestamp);
        const toRemove = cacheEntries.slice(MAX_CACHED_STATES - 1);
        toRemove.forEach(entry => localStorage.removeItem(entry.key));
      }
    } catch (e) {
      console.error("[Geo-Cache] Cleanup error:", e);
    }
  }, [buyerState]);

  useEffect(() => {
    fetchProductsAndSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buyerState]);

  const refreshProducts = useCallback(() => {
    fetchProductsAndSettings(true);
  }, [fetchProductsAndSettings]);

  const contextValue = useMemo(() => ({
    products: filteredProducts, // Always return the filtered view
    allProducts: products, // Access to raw products if needed
    loading,
    error,
    bcvRate,
    trendingProductIds,
    fetchProducts: fetchProductsAndSettings,
    refreshProducts,
    fetchProductById,
    fetchSimilarProducts,
    applyFilters,
  }), [filteredProducts, products, loading, error, bcvRate, trendingProductIds, fetchProductsAndSettings, refreshProducts, fetchProductById, fetchSimilarProducts, applyFilters]);

  return (
    <ProductContext.Provider value={contextValue}>
      {children}
    </ProductContext.Provider>
  );
};

ProductProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useProducts = () => useContext(ProductContext);
