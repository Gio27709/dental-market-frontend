/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import PropTypes from "prop-types";
import api, { getProducts } from "../services/api";
import { BCV_RATE_KEY } from "../utils/constants";
import { useLocationContext } from "../hooks/useLocationContext";

const ProductContext = createContext();
const CACHE_KEY = "dental_market_products_cache";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { buyerState } = useLocationContext();
  const [bcvRate, setBcvRate] = useState(() => {
    return localStorage.getItem(BCV_RATE_KEY) || 1;
  });

  const fetchProductsAndSettings = async (forceRefresh = false) => {
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
              if (cachedData.bcvRate) {
                setBcvRate(cachedData.bcvRate);
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
      const [productsRes, settingsRes] = await Promise.all([
        getProducts(buyerState),
        api.get("/admin/settings").catch(() => ({ data: { data: {} } })), // Fallback if settings fail
      ]);

      const rawData = productsRes.data.data || productsRes.data;

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
  };

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
      const res = await api.get(`/products/${id}/compare`);
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

  useEffect(() => {
    fetchProductsAndSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buyerState]);

  return (
    <ProductContext.Provider
      value={{
        products: filteredProducts, // Always return the filtered view
        allProducts: products, // Access to raw products if needed
        loading,
        error,
        bcvRate,
        fetchProducts: fetchProductsAndSettings,
        fetchProductById,
        fetchSimilarProducts,
        applyFilters,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

ProductProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useProducts = () => useContext(ProductContext);
