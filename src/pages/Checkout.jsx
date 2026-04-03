import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useOrder } from "../context/OrderContext";
import CheckoutForm from "../components/orders/CheckoutForm";
import CheckoutSummary from "../components/orders/CheckoutSummary";
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
  const [isSubmitting, setIsSubmitting] = useState(false); // Bug 5: double-click guard

  // Bug 2: Immediate ref flag to prevent redirect after cart is cleared post-order
  const orderCreatedRef = useRef(false);

  // If cart is empty and we haven't just created an order, redirect back
  useEffect(() => {
    if (orderCreatedRef.current) return; // Order was created — cart is legitimately empty
    if (!cartLoading && (!items || items.length === 0) && step === 1) {
      toast.error("Tu carrito está vacío. Agrega productos para continuar.");
      navigate("/");
    }
  }, [items, cartLoading, navigate, step]);

  const handleCreateOrder = async (formData) => {
    // Bug 5: Prevent duplicate submissions from rapid clicks
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Validate variation_id integrity before sending to backend
    for (const item of items) {
      // If item has variation data (meaning the product has variations),
      // the variation_id must be set — not null or "default"
      if (item.variation && !item.variation_id) {
        toast.error(
          `"${item.name}" requiere seleccionar una variación. Vuelve al carrito y corrige.`,
        );
        setIsSubmitting(false);
        return;
      }
      // Catch the "default" string that CartContext uses as fallback
      if (item.variation_id === "default") {
        toast.error(
          `"${item.name}" tiene una variación no válida. Elimínalo del carrito y agrégalo de nuevo.`,
        );
        setIsSubmitting(false);
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
      // Bug 2: Set the ref BEFORE clearing cart to prevent useEffect redirect
      orderCreatedRef.current = true;

      setCreatedOrderId(result.order.id);

      // Bug 4: Clear checkout form data from sessionStorage
      sessionStorage.removeItem("checkout_form_data");

      // Clear the cart context immediately to avoid resubmissions
      if (clearCart) {
        clearCart();
      }

      toast.success(
        `¡Orden ${result.order.id.split("-")[0]} creada exitosamente!`,
      );
      // Move to step 2 (Upload Proof)
      setStep(2);
    } else {
      toast.error(result.error || "Ocurrió un error inesperado al crear la orden.");
      setIsSubmitting(false); // Only reset on failure so user can retry
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Premium Breadcrumb Stepper */}
      <div className="mb-8 overflow-x-auto pb-2 custom-scrollbar">
        <nav aria-label="Progress" className="hidden sm:flex items-center text-sm font-medium whitespace-nowrap">
          <ol className="flex items-center space-x-2 md:space-x-4">
            <li className="flex items-center">
              <span className={step === 1 ? "text-[#6b1e96] font-bold" : "text-gray-400 font-medium transition-colors"}>
                Información y Pago
              </span>
              <span className="material-symbols-outlined mx-2 md:mx-4 text-gray-300 text-sm">chevron_right</span>
            </li>
            <li className="flex items-center">
              <span className={step === 2 ? "text-[#6b1e96] font-bold" : "text-gray-400 font-medium transition-colors"}>
                Comprobante
              </span>
              <span className="material-symbols-outlined mx-2 md:mx-4 text-gray-300 text-sm">chevron_right</span>
            </li>
            <li className="flex items-center">
              <span className="text-gray-400 font-medium transition-colors">
                Confirmación
              </span>
            </li>
          </ol>
        </nav>
        {/* Mobile Stepper */}
        <div className="sm:hidden flex items-center gap-2 text-sm font-bold text-[#6b1e96]">
          <span className="bg-[#6b1e96] text-[#c3ff00] w-6 h-6 flex items-center justify-center rounded-full text-xs">
            {step}
          </span>
          <span>{step === 1 ? "Información y Pago" : step === 2 ? "Subir Comprobante" : "Confirmación"}</span>
        </div>
      </div>

      {step === 1 && items && items.length > 0 && (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Columna Izquierda (Formulario) */}
          <div className="w-full lg:w-[60%] xl:w-[65%] flex-shrink-0">
            <CheckoutForm
              cartItems={items}
              onSubmit={handleCreateOrder}
              loading={orderLoading || isSubmitting}
            />
          </div>

          {/* Columna Derecha (Resumen Sticky) */}
          <div className="w-full lg:w-[40%] xl:w-[35%] flex-shrink-0 relative">
            <CheckoutSummary
              cartItems={items}
              total_usd={total_usd}
              total_ves={total_ves}
            />
          </div>
        </div>
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
