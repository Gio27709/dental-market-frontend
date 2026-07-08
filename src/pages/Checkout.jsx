import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useOrder } from "../context/OrderContext";
import CheckoutForm from "../components/orders/CheckoutForm";
import CheckoutSummary from "../components/orders/CheckoutSummary";
import PaymentProofUploader from "../components/orders/PaymentProofUploader";
import api from "../services/api";
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
  const [createdOrders, setCreatedOrders] = useState([]);
  const [orderGroupId, setOrderGroupId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Bug 5: double-click guard
  const [deliveryType, setDeliveryType] = useState("shipping");
  const [buyerFeePercentage, setBuyerFeePercentage] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");

  // Bug 2: Immediate ref flag to prevent redirect after cart is cleared post-order
  const orderCreatedRef = useRef(false);

  // Fetch buyer_fee from platform settings
  useEffect(() => {
    api.get("/admin/settings")
      .then((res) => {
        const fee = res.data?.data?.buyer_fee?.percentage;
        if (fee !== undefined) setBuyerFeePercentage(Number(fee));
      })
      .catch(() => console.error("Error loading buyer fee"));
  }, []);

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

    // ESCROW SAFETY CHECK: Block creation of orders from suspended stores
    const hasSuspended = items.some((item) => item.store_is_suspended);
    if (hasSuspended) {
      toast.error("No puedes realizar el pedido: tienes productos de una tienda suspendida. Regresa al carrito y retíralos.");
      setIsSubmitting(false);
      return;
    }

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
      delivery_type: formData.delivery_type,
      receiver_name: formData.receiver_name,
      receiver_cedula: formData.receiver_cedula,
      receiver_email: formData.receiver_email,
      preferred_shipping_carrier: formData.preferred_shipping_carrier || null,
      // Multi-store: per-store delivery types map
      ...(formData.delivery_types && { delivery_types: formData.delivery_types }),
      destination_state: formData.destination_state || null,
      destination_city: formData.destination_city || null,
      ...(formData.delivery_type === "local_delivery" && {
        delivery_address: formData.address,
        delivery_reference: formData.delivery_reference || null,
        delivery_lat: formData.delivery_lat || null,
        delivery_lng: formData.delivery_lng || null,
      }),
      // Multi-store mixed: if any store uses local_delivery, pass coords
      ...(formData.delivery_types && Object.values(formData.delivery_types).some(t => t === "local_delivery") && {
        delivery_address: formData.address,
        delivery_reference: formData.delivery_reference || null,
        delivery_lat: formData.delivery_lat || null,
        delivery_lng: formData.delivery_lng || null,
      }),
      coupon_code: appliedCouponCode || null
    };

    const result = await createOrder(orderPayload);

    if (result.success) {
      // Bug 2: Set the ref BEFORE clearing cart to prevent useEffect redirect
      orderCreatedRef.current = true;

      // Multi-store: store all created order info
      const allOrders = result.orders || [result.order];
      setCreatedOrders(allOrders);
      setCreatedOrderId(result.order.id);
      setOrderGroupId(result.order_group_id || result.order.id);
      setSelectedPaymentMethod(formData.payment_method || "");

      // Bug 4: Clear checkout form data from sessionStorage
      sessionStorage.removeItem("checkout_form_data");

      // Clear the cart context immediately to avoid resubmissions
      if (clearCart) {
        clearCart();
      }

      const orderCount = allOrders.length;
      toast.success(
        orderCount > 1
          ? `¡Se crearon ${orderCount} órdenes exitosamente! (una por tienda)`
          : `¡Orden ${result.order.id.split("-")[0]} creada exitosamente!`,
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
    navigate(`/order-success/${orderGroupId}`);
  };

  const handleSkipProof = () => {
    navigate(`/order-success/${orderGroupId}`);
  };

  if (cartLoading && step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Cargando tu carrito...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Premium Stepper */}
      <div className="mb-6 bg-white rounded-2xl border border-slate-100/80 shadow-xs p-4 md:p-5">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-between w-full max-w-3xl mx-auto">
            {/* Step 1 */}
            <li className="flex items-center flex-1 relative last:flex-initial">
              <div className="flex items-center gap-3 z-10">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                  step === 1
                    ? "bg-[#6b1e96] text-white shadow-md shadow-purple-500/20 ring-4 ring-purple-100"
                    : step > 1
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/10"
                    : "bg-slate-100 text-slate-400 border border-slate-200"
                }`}>
                  {step > 1 ? (
                    <span className="material-symbols-outlined text-sm font-bold">check</span>
                  ) : "1"}
                </span>
                <span className={`text-sm font-bold transition-colors hidden sm:inline ${
                  step === 1 ? "text-[#6b1e96]" : step > 1 ? "text-slate-700" : "text-slate-400"
                }`}>
                  Información y Pago
                </span>
              </div>
              <div className="flex-1 h-0.5 mx-4 bg-slate-100 hidden sm:block">
                <div className={`h-full transition-all duration-500 ${
                  step > 1 ? "bg-emerald-500 w-full" : "bg-slate-100 w-0"
                }`} />
              </div>
            </li>

            {/* Step 2 */}
            <li className="flex items-center flex-1 relative last:flex-initial">
              <div className="flex items-center gap-3 z-10">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                  step === 2
                    ? "bg-[#6b1e96] text-white shadow-md shadow-purple-500/20 ring-4 ring-purple-100"
                    : step > 2
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/10"
                    : "bg-slate-100 text-slate-400 border border-slate-200"
                }`}>
                  {step > 2 ? (
                    <span className="material-symbols-outlined text-sm font-bold">check</span>
                  ) : "2"}
                </span>
                <span className={`text-sm font-bold transition-colors hidden sm:inline ${
                  step === 2 ? "text-[#6b1e96]" : step > 2 ? "text-slate-700" : "text-slate-400"
                }`}>
                  Comprobante
                </span>
              </div>
              <div className="flex-1 h-0.5 mx-4 bg-slate-100 hidden sm:block">
                <div className={`h-full transition-all duration-500 ${
                  step > 2 ? "bg-emerald-500 w-full" : "bg-slate-100 w-0"
                }`} />
              </div>
            </li>

            {/* Step 3 */}
            <li className="flex items-center z-10">
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                  step === 3
                    ? "bg-[#6b1e96] text-white shadow-md shadow-purple-500/20 ring-4 ring-purple-100"
                    : "bg-slate-100 text-slate-400 border border-slate-200"
                }`}>
                  3
                </span>
                <span className={`text-sm font-bold transition-colors hidden sm:inline ${
                  step === 3 ? "text-[#6b1e96]" : "text-slate-400"
                }`}>
                  Confirmación
                </span>
              </div>
            </li>
          </ol>

          {/* Label under icon for mobile */}
          <div className="mt-4 text-center sm:hidden">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Paso {step} de 3</span>
            <p className="text-sm font-black text-[#6b1e96] mt-0.5">
              {step === 1 ? "Información y Pago" : step === 2 ? "Subir Comprobante" : "Confirmación"}
            </p>
          </div>
        </nav>
      </div>

      {step === 1 && items && items.some(item => item.store_is_suspended) && (
        <div className="mb-8 p-5 bg-gradient-to-r from-red-50 to-rose-50/50 border border-red-100 rounded-2xl flex items-start gap-4 text-red-800 shadow-xs animate-pulse">
          <span className="material-symbols-outlined text-red-500 text-[26px] mt-0.5">warning</span>
          <div className="text-sm flex-1">
            <p className="font-black text-red-950 text-base">Carrito con Tienda Suspendida</p>
            <p className="mt-1 font-medium text-red-800 leading-relaxed">
              No puedes completar el checkout porque uno o más artículos pertenecen a una tienda que se encuentra suspendida por demoras críticas en despachos. Regresa al carrito y retíralos para poder continuar de forma segura.
            </p>
            <button 
              onClick={() => navigate("/cart")}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-md shadow-red-600/10 hover:shadow-lg hover:shadow-red-600/20 active:scale-98"
            >
              Regresar al Carrito
            </button>
          </div>
        </div>
      )}

      {step === 1 && items && items.length > 0 && (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Columna Izquierda (Formulario) */}
          <div className="w-full lg:w-[60%] xl:w-[65%] flex-shrink-0">
            <CheckoutForm
              cartItems={items}
              onSubmit={handleCreateOrder}
              loading={orderLoading || isSubmitting}
              onDeliveryTypeChange={setDeliveryType}
            />
          </div>

          {/* Columna Derecha (Resumen Sticky) */}
          <div className="w-full lg:w-[40%] xl:w-[35%] flex-shrink-0 relative">
            <CheckoutSummary
              cartItems={items}
              total_usd={total_usd}
              total_ves={total_ves}
              deliveryType={deliveryType}
              buyerFeePercentage={buyerFeePercentage}
              onCouponApply={(code) => setAppliedCouponCode(code)}
            />
          </div>
        </div>
      )}

      {step === 2 && createdOrderId && (
        <div className="animate-fade-in-up">
          <div className="text-center mb-4.5">
            <h2 className="text-2xl font-black text-gray-900">
              ¡Casi listo! 🎉
            </h2>
            {createdOrders.length > 1 ? (
              <div className="mt-2.5">
                <p className="text-base text-gray-500 mb-1.5">
                  Tu pedido incluye productos de <span className="font-bold text-[#6b1e96]">{createdOrders.length} tiendas</span> distintas.
                </p>
                <p className="text-sm text-gray-400">
                  Cada tienda preparará su envío por separado, pero solo necesitas <strong className="text-gray-600">un comprobante de pago</strong> que cubre el total.
                </p>
              </div>
            ) : (
              <p className="mt-2.5 text-base text-gray-500">
                Tu orden ha sido reservada bajo el código{" "}
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[#6b1e96] font-bold">
                  {createdOrderId.split("-")[0]}
                </span>
                .
              </p>
            )}
          </div>

          <PaymentProofUploader
            orderId={createdOrderId}
            paymentMethod={selectedPaymentMethod}
            onUploadComplete={handleProofUploaded}
          />

          <div className="text-center mt-4">
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
