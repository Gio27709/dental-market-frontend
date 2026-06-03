import { useState } from "react";
import { useFavorites } from "../../context/FavoriteContext";
import { Link } from "react-router-dom";
import { useProducts } from "../../context/ProductContext";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function Favorites() {
  const { favorites, loading, toggleFavorite } = useFavorites();
  const { allProducts } = useProducts();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [addingIds, setAddingIds] = useState(new Set());

  if (loading) {
    return (
      <div style={{ background: "#ffffff", borderRadius: "1.5rem", padding: "4rem", textAlign: "center", minHeight: "400px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "2.5rem", height: "2.5rem", border: "3px solid #6b1e96", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
      </div>
    );
  }

  // Enriched product data from allProducts
  const enrichedFavorites = favorites.map(fav => {
    const product = fav.products;
    if (!product) return null;
    const fullProduct = allProducts.find(p => p.id === product.id) || product;
    return { ...fav, product: fullProduct };
  }).filter(Boolean);

  const handleAddToCart = async (product) => {
    if (user?.id === product.store_id) {
      toast.error("No puedes agregar tu propio producto al carrito.");
      return;
    }
    if (addingIds.has(product.id)) return;
    setAddingIds(prev => new Set(prev).add(product.id));
    try {
      const success = await addToCart(product, product.variations?.[0] || null, 1);
      if (success) toast.success("Agregado a la bolsa");
    } finally {
      setAddingIds(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── Header Section ── */}
      <div style={{
        background: "#ffffff",
        borderRadius: "1.5rem",
        padding: "2.5rem 3rem",
        marginBottom: "2rem",
        boxShadow: "0px 20px 40px rgba(25, 28, 32, 0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h1 style={{
            fontFamily: "'Manrope', 'Inter', sans-serif",
            fontSize: "1.75rem",
            fontWeight: "800",
            color: "#191c20",
            letterSpacing: "-0.02em",
            margin: 0,
          }}>
            Mis Favoritos
          </h1>
        </div>
        <p style={{ fontSize: "0.875rem", color: "#7f7382", margin: 0, paddingLeft: "2.75rem" }}>
          {enrichedFavorites.length} {enrichedFavorites.length === 1 ? "producto guardado" : "productos guardados"}
        </p>
      </div>

      {/* ── Content ── */}
      {enrichedFavorites.length === 0 ? (
        /* ── Empty State ── */
        <div style={{
          background: "#ffffff",
          borderRadius: "1.5rem",
          padding: "5rem 3rem",
          textAlign: "center",
          boxShadow: "0px 20px 40px rgba(25, 28, 32, 0.04)",
        }}>
          {/* Heart Illustration */}
          <div style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #f5d9ff 0%, #ffdad7 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 2rem",
          }}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#6b1e96" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>

          <h3 style={{
            fontFamily: "'Manrope', 'Inter', sans-serif",
            fontSize: "1.5rem",
            fontWeight: "700",
            color: "#191c20",
            marginBottom: "0.75rem",
          }}>
            Aún no tienes favoritos
          </h3>
          <p style={{
            fontSize: "0.9375rem",
            color: "#7f7382",
            maxWidth: "360px",
            margin: "0 auto 2rem",
            lineHeight: "1.6",
          }}>
            Explora nuestro catálogo y guarda los productos que más te gusten dándole clic al corazón.
          </p>
          <Link
            to="/store-catalog"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              padding: "0.875rem 2rem",
              borderRadius: "0.75rem",
              background: "linear-gradient(135deg, #6b1e96 0%, #4f0077 100%)",
              color: "#ffffff",
              fontWeight: "700",
              fontSize: "0.9375rem",
              textDecoration: "none",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 12px rgba(107, 30, 150, 0.3)",
            }}
          >
            Explorar Catálogo
          </Link>
        </div>
      ) : (
        /* ── Product Grid ── */
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "1.5rem",
        }}>
          {enrichedFavorites.map(({ id, product }) => {
            const storeName = product.store?.business_name || product.store_profiles?.business_name || "Tienda";
            const hasImage = product.images && product.images.length > 0;
            const price = product.price || 0;

            return (
              <div
                key={id}
                style={{
                  background: "#ffffff",
                  borderRadius: "1rem",
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                  boxShadow: "0px 4px 16px rgba(25, 28, 32, 0.04)",
                  display: "flex",
                  flexDirection: "column",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0px 20px 40px rgba(25, 28, 32, 0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0px 4px 16px rgba(25, 28, 32, 0.04)";
                }}
              >
                {/* Image Section */}
                <div style={{ position: "relative", background: "#f3f3f9", padding: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center", height: "220px" }}>
                  <Link to={`/product/${product.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
                    {hasImage ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        loading="lazy"
                        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", mixBlendMode: "multiply" }}
                      />
                    ) : (
                      <span style={{ color: "#d0c2d3", fontSize: "0.875rem", fontStyle: "italic" }}>Sin Imagen</span>
                    )}
                  </Link>

                  {/* Heart Button (Filled) */}
                  <button
                    onClick={() => toggleFavorite(product.id)}
                    style={{
                      position: "absolute",
                      top: "1rem",
                      right: "1rem",
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      border: "none",
                      background: "rgba(255,255,255,0.9)",
                      backdropFilter: "blur(8px)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                    title="Quitar de favoritos"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>

                {/* Card Body */}
                <div style={{ padding: "1.25rem 1.5rem", flex: 1, display: "flex", flexDirection: "column" }}>
                  {/* Store Name */}
                  <span style={{
                    fontSize: "0.6875rem",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#6b1e96",
                    marginBottom: "0.375rem",
                  }}>
                    {storeName}
                  </span>

                  {/* Product Name */}
                  <Link
                    to={`/product/${product.id}`}
                    style={{
                      fontSize: "0.9375rem",
                      fontWeight: "600",
                      color: "#191c20",
                      textDecoration: "none",
                      lineHeight: "1.4",
                      marginBottom: "0.75rem",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {product.name}
                  </Link>

                  {/* Price */}
                  <p style={{
                    fontFamily: "'Manrope', 'Inter', sans-serif",
                    fontSize: "1.25rem",
                    fontWeight: "800",
                    color: "#191c20",
                    margin: "0 0 1rem 0",
                    marginTop: "auto",
                  }}>
                    ${price.toFixed(2)}
                  </p>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={addingIds.has(product.id)}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "0.75rem",
                      border: "none",
                      background: addingIds.has(product.id)
                        ? "linear-gradient(135deg, #531575 0%, #3a0055 100%)"
                        : "linear-gradient(135deg, #6b1e96 0%, #4f0077 100%)",
                      color: "#ffffff",
                      fontWeight: "700",
                      fontSize: "0.8125rem",
                      cursor: addingIds.has(product.id) ? "wait" : "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      boxShadow: "0 2px 8px rgba(107, 30, 150, 0.2)",
                      marginBottom: "0.5rem",
                      opacity: addingIds.has(product.id) ? 0.85 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!addingIds.has(product.id)) {
                        e.currentTarget.style.boxShadow = "0 4px 16px rgba(107, 30, 150, 0.35)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(107, 30, 150, 0.2)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    {addingIds.has(product.id) ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"></circle>
                          <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Agregando...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                        Añadir a la bolsa
                      </>
                    )}
                  </button>

                  {/* Remove Link */}
                  <button
                    onClick={() => toggleFavorite(product.id)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "0.75rem",
                      color: "#7f7382",
                      cursor: "pointer",
                      padding: "0.25rem",
                      textAlign: "center",
                      transition: "color 0.2s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#7f7382"; }}
                  >
                    Eliminar de favoritos
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
