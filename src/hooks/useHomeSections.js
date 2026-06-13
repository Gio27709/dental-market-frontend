import { useState, useEffect, useCallback } from "react";
import { getHomeSectionsAPI } from "../services/api";

const CACHE_KEY = "dental_market_home_sections_cache";
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

// Shared module-level state (Observable Store)
let globalSections = null;
let globalLoading = false;
let globalError = null;
let lastFetchedTimestamp = 0;
const listeners = new Set();

// Load initial value from localStorage cache synchronously on module load
try {
  const cachedStr = localStorage.getItem(CACHE_KEY);
  if (cachedStr) {
    const cachedNode = JSON.parse(cachedStr);
    if (Date.now() - cachedNode.timestamp < CACHE_TTL) {
      globalSections = cachedNode.data;
      lastFetchedTimestamp = cachedNode.timestamp;
    }
  }
} catch (e) {
  console.error("[useHomeSections] Error parsing initial cache:", e);
}

const notifyListeners = () => {
  const currentState = {
    sections: globalSections || {},
    loading: globalLoading,
    error: globalError,
  };
  listeners.forEach((listener) => {
    listener(currentState);
  });
};

const fetchSectionsAPI = async (force = false) => {
  if (globalLoading) return;

  // Check TTL if not forced
  if (!force && globalSections && Date.now() - lastFetchedTimestamp < CACHE_TTL) {
    return;
  }

  globalLoading = true;
  globalError = null;
  notifyListeners();

  try {
    const { data } = await getHomeSectionsAPI();
    if (data && data.success && data.data) {
      const sectionsMap = {};
      data.data.forEach((section) => {
        sectionsMap[section.section_key] = section.content;
      });

      globalSections = sectionsMap;
      lastFetchedTimestamp = Date.now();

      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            timestamp: lastFetchedTimestamp,
            data: sectionsMap,
          })
        );
      } catch (e) {
        console.error("[useHomeSections] Error saving cache:", e);
      }
    }
  } catch (err) {
    console.error("[useHomeSections] Error fetching home sections:", err);
    globalError = err;

    // Fallback to stale cache if API fails
    if (!globalSections) {
      try {
        const cachedStr = localStorage.getItem(CACHE_KEY);
        if (cachedStr) {
          globalSections = JSON.parse(cachedStr).data;
        }
      } catch {
        /* ignore */
      }
    }
  } finally {
    globalLoading = false;
    notifyListeners();
  }
};

// Listen to custom event for updating
if (typeof window !== "undefined") {
  window.addEventListener("home_sections_updated", () => {
    fetchSectionsAPI(true);
  });
}

export default function useHomeSections() {
  const [state, setState] = useState(() => ({
    sections: globalSections || {},
    loading: globalSections ? false : globalLoading,
    error: globalError,
  }));

  useEffect(() => {
    // Subscribe
    listeners.add(setState);

    // If we don't have sections, or it's expired, and we aren't loading, trigger fetch
    const hasCache = globalSections !== null;
    const isExpired = Date.now() - lastFetchedTimestamp >= CACHE_TTL;
    if ((!hasCache || isExpired) && !globalLoading) {
      fetchSectionsAPI();
    } else {
      // Sync local state with current global state on mount
      setState({
        sections: globalSections || {},
        loading: globalLoading,
        error: globalError,
      });
    }

    return () => {
      // Unsubscribe
      listeners.delete(setState);
    };
  }, []);

  const getSectionContent = useCallback(
    (sectionKey) => {
      return state.sections[sectionKey] || null;
    },
    [state.sections]
  );

  const refetch = useCallback(() => {
    fetchSectionsAPI(true);
  }, []);

  return {
    sections: state.sections,
    loading: state.loading,
    error: state.error,
    refetch,
    getSectionContent,
  };
}
export { fetchSectionsAPI };
