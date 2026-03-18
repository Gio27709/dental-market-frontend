import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useOrder } from "../context/OrderContext";
import CheckoutForm from "../components/orders/CheckoutForm";
import PaymentProofUploader from "../components/orders/PaymentProofUploader";
import toast from "react-hot-toast";

export default function Checkout() {
  const {
    items,
    total_usd,
    total_ves,
    loading: cartLoading,
    clearCart,
  } = useCart();
  const { createOrder, loading: orderLoading } = useOrder();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [createdOrderId, setCreatedOrderId] = useState(null);

  // If cart is empty, redirect back
  useEffect(() => {
    if (!cartLoading && (!items || items.length === 0) && step === 1) {
      toast.error("Tu carrito está vacío. Agrega productos para continuar.");
      navigate("/");
    }
  }, [items, cartLoading, navigate, step]);

  const handleCreateOrder = async (formData) => {
    // Validate variation_id integrity before sending to backend
    for (const item of items) {
      // If item has variation data (meaning the product has variations),
      // the variation_id must be set — not null or "default"
      if (item.variation && !item.variation_id) {
        toast.error(
          `"${item.name}" requiere seleccionar una variación. Vuelve al carrito y corrige.`,
        );
        return;
      }
      // Catch the "default" string that CartContext uses as fallback
      if (item.variation_id === "default") {
        toast.error(
          `"${item.name}" tiene una variación no válida. Elimínalo del carrito y agrégalo de nuevo.`,
        );
        return;
      }
    }

    // Inject the cart footprint
    const orderPayload = {
      items: items.map((item) => ({
        product_id: item.product_id,
        variation_id: item.variation_id || null,
        store_id: item.store_id,
        quantity: item.quantity,
        unit_price: item.price_usd,
      })),
      amount: total_usd,
      shipping_address: formData.address,
      contact_phone: formData.phone,
      payment_method: formData.payment_method,
      notes: formData.notes,
    };

    const result = await createOrder(orderPayload);

    if (result.success) {
      setCreatedOrderId(result.order.id);

      // Clear the cart context immediately to avoid resubmissions
      if (clearCart) {
        clearCart();
      }

      toast.success(
        `¡Orden ${result.order.id.split("-")[0]} creada exitosamente!`,
      );
      // Move to step 2 (Upload Proof)
      setStep(2);
    }
  };

  const handleProofUploaded = () => {
    toast.success("¡Hemos recibido tu comprobante!");
    navigate(`/order-success/${createdOrderId}`);
  };

  const handleSkipProof = () => {
    navigate(`/order-success/${createdOrderId}`);
  };

  if (cartLoading && step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Cargando tu carrito...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Progress Tracker UX */}
      <div className="mb-8">
        <div className="flex items-center">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${step === 1 ? "bg-primary-600 text-white" : "bg-green-500 text-white"}`}
          >
            {step === 1 ? "1" : "✓"}
          </div>
          <div
            className={`flex-1 h-1 mx-2 ${step === 2 ? "bg-green-500" : "bg-gray-200"}`}
          ></div>
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${step === 2 ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-500"}`}
          >
            2
          </div>
        </div>
        <div className="flex justify-between mt-2 text-sm font-medium text-gray-500">
          <span className={step === 1 ? "text-primary-600" : "text-green-600"}>
            Facturación y Pago
          </span>
          <span className={step === 2 ? "text-primary-600" : ""}>
            Comprobante
          </span>
        </div>
      </div>

      {step === 1 && items && items.length > 0 && (
        <CheckoutForm
          cartItems={items}
          total_usd={total_usd}
          total_ves={total_ves}
          onSubmit={handleCreateOrder}
          loading={orderLoading}
        />
      )}

      {step === 2 && createdOrderId && (
        <div className="animate-fade-in-up">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              ¡Casi listo! 🎉
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Tu orden ha sido reservada bajo el código{" "}
              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-primary-600">
                {createdOrderId.split("-")[0]}
              </span>
              .
            </p>
          </div>

          <PaymentProofUploader
            orderId={createdOrderId}
            onUploadComplete={handleProofUploaded}
          />

          <div className="text-center mt-6">
            <button
              onClick={handleSkipProof}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Subir mi comprobante más tarde
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
