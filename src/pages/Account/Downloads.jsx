import { useEffect, useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { useOrder } from "../../context/OrderContext";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import OrderReceiptTemplate from "../../components/orders/OrderReceiptTemplate";
import { formatOrderNumber, formatOrderDate, formatCurrencyUSD } from "../../utils/formatters";

export default function Downloads() {
  const { orders, loading, fetchOrders } = useOrder();
  const [selectedTab, setSelectedTab] = useState("receipts");
  const [generatingId, setGeneratingId] = useState(null);
  const receiptRef = useRef(null);
  const [renderOrder, setRenderOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTab]);

  // Filter orders that have downloadable receipts (approved/delivered payments)
  const downloadableOrders = useMemo(() => {
    return orders.filter((order) => {
      const hasApprovedPayment = ["approved", "delivered", "processing"].includes(order.payment_status);
      const allDelivered =
        order.order_items?.length > 0 &&
        order.order_items.every((i) => i.delivery_status === "delivered");
      return hasApprovedPayment || allDelivered;
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [orders]);

  const totalPages = Math.max(1, Math.ceil(downloadableOrders.length / itemsPerPage));

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return downloadableOrders.slice(start, start + itemsPerPage);
  }, [downloadableOrders, currentPage]);

  // Tab definitions — extensible for future digital products
  const tabs = [
    {
      id: "receipts",
      label: "Recibos & Facturas",
      icon: "receipt_long",
      count: downloadableOrders.length,
    },
    {
      id: "digital",
      label: "Productos Digitales",
      icon: "school",
      count: 0,
      comingSoon: true,
    },
  ];

  const handleDownloadPDF = async (order) => {
    setGeneratingId(order.id);
    setRenderOrder(order);

    // Wait 2 frames for React to mount the component and the browser to paint it
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const input = receiptRef.current;
    if (!input) {
      setGeneratingId(null);
      setRenderOrder(null);
      return;
    }

    try {
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL("image/jpeg", 1.0);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate scaled height of canvas relative to A4 page width
      const imgScaledHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgScaledHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgScaledHeight);
      heightLeft -= pdfHeight;

      // Add more pages dynamically if the template height overflows the A4 height
      while (heightLeft > 0) {
        position = heightLeft - imgScaledHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgScaledHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`Recibo_${formatOrderNumber(order.id)}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
    } finally {
      setGeneratingId(null);
      setRenderOrder(null);
    }
  };

  const getOrderStatusInfo = (order) => {
    const allDelivered =
      order.order_items?.length > 0 &&
      order.order_items.every((i) => i.delivery_status === "delivered");
    
    if (allDelivered) return { label: "Entregado", color: "text-emerald-700 bg-emerald-50 border-emerald-100", icon: "check_circle" };
    if (order.payment_status === "approved") return { label: "Pago Aprobado", color: "text-[#6b1e96] bg-purple-50 border-purple-100", icon: "verified" };
    return { label: "En Proceso", color: "text-amber-700 bg-amber-50 border-amber-100", icon: "schedule" };
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xs border border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-50 text-[#6b1e96]">
            <span className="material-symbols-outlined text-[28px]">download</span>
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800">
              Mis Descargas
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Descarga recibos de tus pedidos y accede a tu contenido digital de aprendizaje.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap pb-1">
        {tabs.map((tab) => {
          const isActive = selectedTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => !tab.comingSoon && setSelectedTab(tab.id)}
              disabled={tab.comingSoon}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                isActive
                  ? "text-white shadow-sm hover:shadow-md border-[#6b1e96] cursor-pointer"
                  : tab.comingSoon
                    ? "bg-slate-50 text-slate-350 border-slate-100 cursor-not-allowed opacity-60"
                    : "bg-white text-slate-500 border-gray-100 hover:bg-slate-50 cursor-pointer"
              }`}
              style={{ background: isActive ? "#6b1e96" : undefined }}
            >
              <span className="material-symbols-outlined text-[16px]">
                {tab.icon}
              </span>
              {tab.label}
              {tab.comingSoon ? (
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-400">
                  Pronto
                </span>
              ) : (
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content: Receipts Tab */}
      {selectedTab === "receipts" && (
        <>
          {loading ? (
            <div className="bg-white rounded-2xl p-12 text-center flex items-center justify-center min-h-[300px] border border-gray-100 animate-pulse">
              <div className="w-10 h-10 border-4 border-[#6b1e96] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : downloadableOrders.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 flex flex-col items-center justify-center max-w-lg mx-auto mt-6 animate-fade-in">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-purple-50 text-[#6b1e96]">
                <span className="material-symbols-outlined text-[32px]">download</span>
              </div>
              <h3 className="text-lg font-bold mb-2 text-slate-800">No tienes descargas disponibles</h3>
              <p className="text-sm mb-6 max-w-sm text-slate-400 leading-relaxed">
                Cuando realices un pedido y el pago sea aprobado, podrás descargar tu comprobante de pago digital desde esta sección.
              </p>
              <Link
                to="/store-catalog"
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-sm hover:shadow-md cursor-pointer"
                style={{ background: "#6b1e96" }}
              >
                Explorar Catálogo
              </Link>
            </div>
          ) : (
            /* Downloads List */
            <>
              <div className="flex flex-col gap-3">
                {paginatedOrders.map((order) => {
                  const statusInfo = getOrderStatusInfo(order);
                  const itemCount = order.order_items?.length || 0;
                  const totalUSD = order.total_usd || order.amount || 0;
                  const isGenerating = generatingId === order.id;

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl p-4 md:p-5 border border-gray-100 flex flex-wrap md:flex-nowrap items-center justify-between gap-4 transition-all duration-200 hover:shadow-sm"
                    >
                      {/* Document Icon & Info */}
                      <div className="flex items-center gap-4 min-w-[200px] flex-1">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-50 text-[#6b1e96] flex-shrink-0">
                          <span className="material-symbols-outlined text-[24px]">description</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm md:text-base text-slate-800">
                              {formatOrderNumber(order.id)}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
                              <span className="material-symbols-outlined text-[12px]">{statusInfo.icon}</span>
                              {statusInfo.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {formatOrderDate(order.created_at)} · {itemCount} {itemCount === 1 ? "producto" : "productos"} · {formatCurrencyUSD(totalUSD)}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0 w-full md:w-auto justify-end">
                        <Link
                          to={`/account/orders/${order.id}`}
                          className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold text-[#6b1e96] bg-purple-50 hover:bg-purple-100 border border-purple-100 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                          Ver Detalles
                        </Link>
                        <button
                          onClick={() => handleDownloadPDF(order)}
                          disabled={isGenerating}
                          className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-black text-white transition-all shadow-sm hover:shadow-md disabled:opacity-75 disabled:cursor-wait cursor-pointer"
                          style={{ background: isGenerating ? "#9ca3af" : "#6b1e96" }}
                        >
                          {isGenerating ? (
                            <>
                              <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                              Generando...
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[14px]">download</span>
                              Recibo PDF
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 pt-5 mt-4 flex-wrap gap-4 animate-fade-in">
                  <div className="text-xs text-slate-400 font-bold">
                    Mostrando <span className="font-extrabold text-slate-700">{Math.min((currentPage - 1) * itemsPerPage + 1, downloadableOrders.length)}–{Math.min(currentPage * itemsPerPage, downloadableOrders.length)}</span> de <span className="font-extrabold text-slate-700">{downloadableOrders.length}</span> recibos
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className={`w-9 h-9 rounded-xl border border-gray-150 flex items-center justify-center transition-all duration-150 ${
                        currentPage === 1
                          ? "bg-slate-50 text-slate-300 cursor-not-allowed border-slate-100"
                          : "bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 cursor-pointer"
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">chevron_left</span>
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .reduce((acc, p, i, arr) => {
                        if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) =>
                        p === "..." ? (
                          <span key={`dots-${i}`} className="text-xs text-slate-300 px-1 select-none font-bold">⋯</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setCurrentPage(p)}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-150 cursor-pointer ${
                              p === currentPage
                                ? "text-white shadow-sm shadow-[#6b1e96]/10"
                                : "bg-white border border-gray-150 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                            }`}
                            style={{
                              background: p === currentPage ? "#6b1e96" : undefined,
                              borderColor: p === currentPage ? "#6b1e96" : undefined
                            }}
                          >
                            {p}
                          </button>
                        ),
                      )}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className={`w-9 h-9 rounded-xl border border-gray-150 flex items-center justify-center transition-all duration-150 ${
                        currentPage === totalPages
                          ? "bg-slate-50 text-slate-300 cursor-not-allowed border-slate-100"
                          : "bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 cursor-pointer"
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">chevron_right</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Content: Digital Products Tab (Coming Soon) */}
      {selectedTab === "digital" && (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 flex flex-col items-center justify-center max-w-lg mx-auto mt-6 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mb-4 text-[#6b1e96]">
            <span className="material-symbols-outlined text-[32px]">school</span>
          </div>
          <h3 className="text-lg font-bold mb-2 text-slate-800">Productos Digitales</h3>
          <p className="text-sm mb-6 max-w-sm text-slate-400 leading-relaxed">
            Próximamente podrás acceder directamente desde aquí a tus cursos comprados, eBooks, guías clínicas y material digital de aprendizaje.
          </p>
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-purple-50 text-[#6b1e96] text-xs font-extrabold border border-purple-100 animate-pulse">
            <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
            Módulo en desarrollo
          </span>
        </div>
      )}

      {/* Hidden Receipt Template for PDF Generation */}
      {renderOrder && (
        <div className="fixed -left-[9999px] top-0 w-[800px] z-[-1] opacity-0 pointer-events-none">
          <div ref={receiptRef}>
            <OrderReceiptTemplate order={renderOrder} />
          </div>
        </div>
      )}
    </div>
  );
}
