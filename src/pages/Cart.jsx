import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import CartItem from "../components/cart/CartItem";
import CartSummary from "../components/cart/CartSummary";

export default function Cart() {
  const { items, total_usd, total_ves, updateQuantity, removeFromCart } =
    useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!user) {
      // If not logged in, go to login then redirect back
      return navigate("/login?redirect=/checkout");
    }

    // Phase 1.3 Target
    navigate("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Tu carrito está vacío
        </h2>
        <Link
          to="/"
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          Volver al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
        Carrito de Compras
      </h1>

      <div className="lg:grid lg:grid-cols-12 lg:gap-8 border-t border-gray-200 pt-8 mt-4">
        {/* Items List */}
        <div className="lg:col-span-8">
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
            {items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
              />
            ))}
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="lg:col-span-4 mt-8 lg:mt-0">
          <CartSummary
            totalUsd={total_usd}
            totalVes={total_ves}
            onCheckout={handleCheckout}
            showShipping={false}
          />

          {!user && (
            <p className="mt-4 text-sm text-center text-gray-500 bg-amber-50 rounded-lg p-3 border border-amber-100">
              <span className="font-semibold text-amber-700">Nota:</span> Se te
              pedirá iniciar sesión para completar la compra.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
