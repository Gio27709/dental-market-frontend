import { useState, useEffect } from "react";
import { useProducts } from "../context/ProductContext";
import useDebounce from "../hooks/useDebounce";
import HeroBanner from "../components/home/HeroBanner";
import LoadingSkeleton from "../components/LoadingSkeleton";
import FeaturesBar from "../components/home/FeaturesBar";
import TopCategoriesRow from "../components/home/TopCategoriesRow";
import TrendingProducts from "../components/home/TrendingProducts";
import PromoBanners from "../components/home/PromoBanners";
import FeaturedDealsGrid from "../components/home/FeaturedDealsGrid";
import BrandsTicker from "../components/home/BrandsTicker";
import DealOfTheDay from "../components/home/DealOfTheDay";
import TopSelling from "../components/home/TopSelling";
import DualBanners from "../components/home/DualBanners";
import CatalogSection from "../components/home/CatalogSection";
import BlogSection from "../components/home/BlogSection";

export default function Home() {
  const { products, loading, error, applyFilters } = useProducts();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  // eslint-disable-next-line no-unused-vars
  const [maxPrice, setMaxPrice] = useState(1000);

  // Apply filters using debounced search term
  useEffect(() => {
    applyFilters({ search: debouncedSearchTerm, maxPrice });
  }, [debouncedSearchTerm, maxPrice, applyFilters]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSkeleton variant="title" />
        <LoadingSkeleton variant="text" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <LoadingSkeleton variant="product-card" count={4} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center flex-col gap-4">
        <p className="text-xl text-red-500 font-semibold">Error de conexión</p>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Banner Integrado */}
      <HeroBanner />

      {/* --- SECCIÓN: FEATURES, MARCAS Y TENDENCIAS --- */}
      <FeaturesBar />
      <BrandsTicker />
      <TopCategoriesRow />
      <TrendingProducts products={products} />
      <PromoBanners />
      <FeaturedDealsGrid products={products} />
      <DealOfTheDay products={products} />
      <TopSelling products={products} />
      <DualBanners />
      <CatalogSection
        products={products}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
      <BlogSection />
      {/* -------------------------------------- */}
    </div>
  );
}
