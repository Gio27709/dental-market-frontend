import { useState, useEffect, useCallback } from "react";
import { getHomeSectionsAPI } from "../services/api";

const CACHE_KEY = "dental_market_home_sections_cache";
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

export default function useHomeSections() {
  const [sections, setSections] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSections = useCallback(async (force = false) => {
    try {
      setLoading(true);
      setError(null);

      if (!force) {
        const cachedStr = localStorage.getItem(CACHE_KEY);
        if (cachedStr) {
          const cachedNode = JSON.parse(cachedStr);
          if (Date.now() - cachedNode.timestamp < CACHE_TTL) {
            setSections(cachedNode.data);
            setLoading(false);
            return;
          }
        }
      }

      const { data } = await getHomeSectionsAPI();
      
      if (data && data.success && data.data) {
        // Build map section_key -> content
        const sectionsMap = {};
        data.data.forEach((section) => {
          sectionsMap[section.section_key] = section.content;
        });

        setSections(sectionsMap);
        
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            timestamp: Date.now(),
            data: sectionsMap,
          })
        );
      }
    } catch (err) {
      console.error("Error fetching home sections:", err);
      setError(err);
      
      // Fallback to stale cache if API fails
      const cachedStr = localStorage.getItem(CACHE_KEY);
      if (cachedStr) {
         setSections(JSON.parse(cachedStr).data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSections();

    const handleUpdate = () => fetchSections(true);
    window.addEventListener("home_sections_updated", handleUpdate);
    
    return () => {
      window.removeEventListener("home_sections_updated", handleUpdate);
    };
  }, [fetchSections]);

  const getSectionContent = useCallback((sectionKey) => {
    return sections[sectionKey] || null;
  }, [sections]);

  const refetch = () => fetchSections(true);

  return { sections, loading, error, refetch, getSectionContent };
}
