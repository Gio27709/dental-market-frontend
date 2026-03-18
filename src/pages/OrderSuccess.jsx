import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useOrder } from "../context/OrderContext";
import PaymentProofUploader from "../components/orders/PaymentProofUploader";
import { formatCurrencyVES, formatCurrencyUSD } from "../utils/formatters";

export default function OrderSuccess() {
  const { id } = useParams();
  const { fetchOrderById } = useOrder();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getOrderDetails = async () => {
      setLoading(true);
      const result = await fetchOrderById(id);
      if (result.success) {
        setOrder(result.order);
      } else {
        setError(result.error || "No pudimos cargar los detalles de tu orden.");
      }
      setLoading(false);
    };

    if (id) {
      getOrderDetails();
    }
  }, [id, fetchOrderById]);

  const handleProofUploaded = () => {
    // Refresh order details to show the uploaded state
    fetchOrderById(id).then((res) => {
      if (res.success) setOrder(res.order);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{error || "Orden no encontrada"}</p>
          <Link to="/account" className="mt-4 text-primary-600 hover:underline">
            Ir a mi cuenta
          </Link>
        </div>
      </div>
    );
  }

  const isPendingProof = !order.payment_proof_url;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white rounded-lg shadow-sm border p-6 md:p-8 mb-8 text-center text-gray-900 line-height-relaxed">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          Resumen de Orden
        </h1>
        <p className="text-lg text-gray-500 mb-6 font-mono bg-gray-100 px-3 py-1 rounded inline-block text-primary-600">
          {order.id.split("-")[0]}
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
          <div className="bg-blue-50 text-blue-800 px-4 py-3 rounded-md font-medium text-sm flex items-center gap-2 border border-blue-100">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Estado del Pago:{" "}
            {order.payment_status === "pending_approval"
              ? "Esperando aprobación"
              : "Pendiente de comprobante"}
          </div>
          <div className="bg-green-50 text-green-800 px-4 py-3 rounded-md font-medium text-sm border border-green-100">
            Estado Envío: {order.order_status}
          </div>
        </div>

        <div className="text-left bg-gray-50 p-6 rounded-lg mb-8 border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">
            Detalles de Compra
          </h3>
          <div className="space-y-3 mb-6">
            {order.order_items?.map((item) => (
              <div
                key={item.id}
                className="flex justify-between text-sm sm:text-base border-b border-gray-100 pb-2"
              >
                <span className="text-gray-600">
                  <span className="font-semibold">{item.quantity}x</span>{" "}
                  {item.products?.name}
                </span>
                <span className="font-medium text-gray-900">
                  {formatCurrencyUSD(item.unit_price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between font-bold text-lg border-t pt-4">
            <span>Total Pagado:</span>
            <div className="text-right">
              <span className="block text-primary-600">
                {formatCurrencyUSD(order.total_usd)}
              </span>
              <span className="block text-sm text-gray-500 font-normal">
                Eq. {formatCurrencyVES(order.total_ves)}
              </span>
            </div>
          </div>
        </div>

        {isPendingProof ? (
          <div className="bg-white text-left animate-fade-in-up border-t pt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Paso 2: Confirma tu pago
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Para acelerar el envío de tu paquete bajo el esquema Escrow, por
              favor adjunta tu recibo de transferencia, Pago Móvil o Zelle.
            </p>
            <PaymentProofUploader
              orderId={order.id}
              onUploadComplete={handleProofUploaded}
            />
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-lg mb-8 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <h3 className="font-bold text-lg">¡Comprobante enviado!</h3>
            </div>
            <p className="text-sm">
              Hemos recibido tu comprobante de pago exitosamente. Un
              administrador lo validará pronto y tu pedido pasará al área de
              despacho.
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          to="/account"
          className="inline-flex justify-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition"
        >
          Ver mis órdenes
        </Link>
        <Link
          to="/"
          className="inline-flex justify-center px-6 py-3 border border-transparent shadow-md text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition"
        >
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}
