import { useCallback } from "react";

const STORAGE_KEY = "dental_market_recently_viewed";
const MAX_ITEMS = 10;

/**
 * useRecentlyViewed — Tracks products the user has visited during their session.
 * Uses sessionStorage (clears when browser tab closes).
 * 
 * Returns:
 *  - addViewed(productId): registers a product visit
 *  - getViewedProducts(allProducts, excludeIds): returns full product objects, most recent first
 */
export default function useRecentlyViewed() {
  const getViewedIds = useCallback(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  const addViewed = useCallback((productId) => {
    if (!productId) return;
    const ids = getViewedIds();
    // Remove if already exists (will re-add at front)
    const filtered = ids.filter((id) => id !== productId);
    // Add to front (most recent first)
    filtered.unshift(productId);
    // Cap at MAX_ITEMS
    const capped = filtered.slice(0, MAX_ITEMS);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(capped));
  }, [getViewedIds]);

  /**
   * Returns full product objects for recently viewed products.
   * @param {Array} allProducts - Full product catalog
   * @param {Set|Array} excludeIds - Product IDs to exclude (e.g., products in cart)
   * @param {number} limit - Max products to return
   */
  const getViewedProducts = useCallback((allProducts, excludeIds = new Set(), limit = 3) => {
    const ids = getViewedIds();
    const excludeSet = excludeIds instanceof Set ? excludeIds : new Set(excludeIds);

    const products = [];
    for (const id of ids) {
      if (excludeSet.has(id)) continue;
      const product = allProducts.find((p) => p.id === id);
      if (product) products.push(product);
      if (products.length >= limit) break;
    }
    return products;
  }, [getViewedIds]);

  return { addViewed, getViewedProducts, getViewedIds };
}
