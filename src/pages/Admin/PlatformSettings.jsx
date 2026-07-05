import { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

export default function PlatformSettings() {
  const [allowOpenReviews, setAllowOpenReviews] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- BCV Rate State ---
  const [bcvRate, setBcvRate] = useState("");
  const [bcvInput, setBcvInput] = useState("");
  const [bcvLastUpdated, setBcvLastUpdated] = useState(null);
  const [bcvLastChecked, setBcvLastChecked] = useState(null);
  const [savingBcv, setSavingBcv] = useState(false);
  const [fetchingBcv, setFetchingBcv] = useState(false);

  // --- Fee State ---
  const [storeFee, setStoreFee] = useState("");
  const [storeFeeInput, setStoreFeeInput] = useState("");
  const [storeFeeUpdated, setStoreFeeUpdated] = useState(null);
  const [savingStoreFee, setSavingStoreFee] = useState(false);

  const [buyerFee, setBuyerFee] = useState("");
  const [buyerFeeInput, setBuyerFeeInput] = useState("");
  const [buyerFeeUpdated, setBuyerFeeUpdated] = useState(null);
  const [savingBuyerFee, setSavingBuyerFee] = useState(false);

  // --- SLA / Penalties State ---
  const [shippingSla, setShippingSla] = useState("");
  const [shippingSlaInput, setShippingSlaInput] = useState("");
  const [shippingSlaUpdated, setShippingSlaUpdated] = useState(null);
  const [savingShippingSla, setSavingShippingSla] = useState(false);

  const [shippingFine, setShippingFine] = useState("");
  const [shippingFineInput, setShippingFineInput] = useState("");
  const [shippingFineUpdated, setShippingFineUpdated] = useState(null);
  const [savingShippingFine, setSavingShippingFine] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/settings");
      // The settings endpoint returns a hashmap from key to value
      const communityValue = data.data?.allow_open_reviews;
      if (communityValue !== undefined) {
        setAllowOpenReviews(communityValue.enabled !== false); // true por defecto
      }

      // BCV Rate
      const bcvValue = data.data?.bcv_rate;
      if (bcvValue?.rate) {
        setBcvRate(String(bcvValue.rate));
        setBcvInput(String(bcvValue.rate));
        setBcvLastUpdated(bcvValue.updated_at || null);
        setBcvLastChecked(bcvValue.last_checked_at || bcvValue.updated_at || null);
      }

      // Store Fee
      const storeFeeValue = data.data?.store_fee;
      if (storeFeeValue?.percentage !== undefined) {
        setStoreFee(String(storeFeeValue.percentage));
        setStoreFeeInput(String(storeFeeValue.percentage));
        setStoreFeeUpdated(storeFeeValue.updated_at || null);
      }

      // Buyer Fee
      const buyerFeeValue = data.data?.buyer_fee;
      if (buyerFeeValue?.percentage !== undefined) {
        setBuyerFee(String(buyerFeeValue.percentage));
        setBuyerFeeInput(String(buyerFeeValue.percentage));
        setBuyerFeeUpdated(buyerFeeValue.updated_at || null);
      }

      // Shipping SLA
      const slaValue = data.data?.shipping_sla_hours;
      if (slaValue?.hours !== undefined) {
        setShippingSla(String(slaValue.hours));
        setShippingSlaInput(String(slaValue.hours));
        setShippingSlaUpdated(slaValue.updated_at || null);
      }

      // Shipping Fine
      const fineValue = data.data?.shipping_fine_amount_usd;
      if (fineValue?.amount !== undefined) {
        setShippingFine(String(fineValue.amount));
        setShippingFineInput(String(fineValue.amount));
        setShippingFineUpdated(fineValue.updated_at || null);
      }
    } catch (error) {
      toast.error("Error al cargar las configuraciones del sitio.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReviews = async () => {
    const newValue = !allowOpenReviews;
    setAllowOpenReviews(newValue); // Optimistic UI update

    try {
      setSaving(true);
      await api.put("/admin/settings/community", { allow_open_reviews: newValue });
      toast.success(`Reseñas ${newValue ? "Públicas" : "Solo Compras Verificadas"} configuradas exitosamente.`);
    } catch (error) {
      setAllowOpenReviews(!newValue); // Rollback on error
      toast.error("Hubo un problema actualizando la configuración.");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBcvRate = async () => {
    const numericRate = parseFloat(bcvInput);
    if (!bcvInput || isNaN(numericRate) || numericRate <= 0) {
      toast.error("Ingresa una tasa BCV válida (mayor a 0).");
      return;
    }

    const previousRate = bcvRate;
    setBcvRate(String(numericRate)); // Optimistic

    try {
      setSavingBcv(true);
      await api.put("/admin/settings/bcv-rate", { rate: numericRate });
      const nowStr = new Date().toISOString();
      setBcvLastUpdated(nowStr);
      setBcvLastChecked(nowStr);
      // Actualizar localStorage para que el frontend muestre la tasa nueva inmediatamente
      localStorage.setItem("bcv_rate", numericRate);
      toast.success(`Tasa BCV actualizada a ${numericRate} Bs/$`);
    } catch (error) {
      setBcvRate(previousRate); // Rollback
      setBcvInput(previousRate);
      toast.error("Error al actualizar la tasa BCV.");
      console.error(error);
    } finally {
      setSavingBcv(false);
    }
  };

  const fetchOfficialBCVRate = async () => {
    try {
      setFetchingBcv(true);
      const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
      if (!response.ok) throw new Error("Error en la conexión con dolarapi");
      const data = await response.json();

      if (data.promedio) {
        setBcvInput(String(data.promedio));
        toast.success(`Tasa BCV obtenida: ${data.promedio.toFixed(2)} Bs/$`);
      } else {
        toast.error('La API no devolvió una tasa válida.');
      }
    } catch (error) {
      toast.error('Error al consultar la API del BCV.');
      console.error("Error fetching bcv rate:", error);
    } finally {
      setFetchingBcv(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-10 h-10 border-4 border-[#c3ff00] border-t-[#6b1e96] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 max-w-4xl mx-auto overflow-hidden">
      
      {/* Header */}
      <div className="bg-[#6b1e96] p-8 text-white relative overflow-hidden">
         <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
         <h1 className="text-3xl font-bold font-['Manrope'] mb-2 relative z-10">Configuraciones del Sitio</h1>
         <p className="text-purple-200 text-sm max-w-2xl relative z-10 leading-relaxed">
            Administra las reglas maestras de Forcepx. Estos ajustes aplican globalmente e inmediatamente a todas las tiendas y todos los productos de la plataforma.
         </p>
      </div>

      <div className="p-8 space-y-8">

        {/* ─── BCV Rate Block ─── */}
        <div className="border border-gray-200 rounded-2xl p-6 md:p-8 bg-gray-50/50 shadow-sm relative transition-all hover:border-[#6b1e96]/30 hover:shadow-md group">
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                 <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">currency_exchange</span>
                 </div>
                 <h2 className="text-xl font-bold text-gray-900 font-['Manrope']">Tasa BCV (Bs/$)</h2>
              </div>
              
              <p className="text-gray-600 text-[15px] leading-relaxed mb-6 max-w-xl">
                Define la tasa de cambio oficial del Banco Central de Venezuela. Este valor se usa para mostrar los precios en Bolívares en toda la plataforma y se <strong>congela en cada orden</strong> al momento de la compra.
              </p>

              {/* Tasa Actual */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
                  <span className="material-symbols-outlined text-green-600">monitoring</span>
                  <div>
                    <strong className="block text-[15px] text-green-700">
                      Tasa Actual: {bcvRate ? `${Number(bcvRate).toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs/$` : "No configurada"}
                    </strong>
                    {bcvLastUpdated && (
                      <span className="text-sm text-green-600/70 block">
                        Tasa cambió: {new Date(bcvLastUpdated).toLocaleDateString("es-VE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                    {bcvLastChecked && (
                      <span className="text-sm text-blue-500/70 block">
                        Última verificación: {new Date(bcvLastChecked).toLocaleDateString("es-VE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Input + Save */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">Bs/$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={bcvInput}
                      onChange={(e) => setBcvInput(e.target.value)}
                      placeholder="Ej: 36.50"
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/30 focus:border-[#6b1e96] transition-all"
                    />
                  </div>
                  <button
                    onClick={fetchOfficialBCVRate}
                    disabled={fetchingBcv || savingBcv}
                    className={`px-4 py-3 rounded-xl font-bold text-sm tracking-wider transition-all flex items-center justify-center gap-2 border ${
                      fetchingBcv || savingBcv
                        ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-white border-[#6b1e96]/30 text-[#6b1e96] hover:bg-purple-50 hover:border-[#6b1e96] shadow-sm hover:shadow active:scale-[0.98]"
                    }`}
                    title="Consultar tasa BCV oficial"
                  >
                    {fetchingBcv ? (
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <span className="material-symbols-outlined text-[18px]">cloud_sync</span>
                    )}
                    <span className="hidden sm:inline">Consultar</span>
                  </button>
                  <button
                    onClick={handleSaveBcvRate}
                    disabled={savingBcv || !bcvInput || bcvInput === bcvRate || fetchingBcv}
                    className={`px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                      savingBcv || !bcvInput || bcvInput === bcvRate || fetchingBcv
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-[#6b1e96] text-white hover:bg-[#531575] shadow-sm hover:shadow-md active:scale-[0.98]"
                    }`}
                  >
                    {savingBcv ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">save</span>
                        Actualizar Tasa
                      </>
                    )}
                  </button>
                </div>

                {/* Security Note */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                  <span className="material-symbols-outlined text-amber-600 text-[16px] mt-0.5 flex-shrink-0">shield</span>
                  <span>
                    <strong>Seguridad:</strong> La tasa se recalcula server-side al crear cada orden. Los precios que ve el comprador son de referencia visual. El valor real de la transacción siempre usa la tasa del servidor.
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ─── Community & Reviews Block ─── */}
        <div className="border border-gray-200 rounded-2xl p-6 md:p-8 bg-gray-50/50 shadow-sm relative transition-all hover:border-[#6b1e96]/30 hover:shadow-md group">
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                 <div className="w-10 h-10 rounded-full bg-purple-100 text-[#6b1e96] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">social_leaderboard</span>
                 </div>
                 <h2 className="text-xl font-bold text-gray-900 font-['Manrope']">Reseñas y Comunidad</h2>
              </div>
              
                 <p className="text-gray-600 text-[15px] leading-relaxed mb-6 max-w-xl">
                 Controla quién tiene permitido calificar los productos del catálogo. Al desactivarlo, el sistema entra en modo <strong>&quot;Compra Verificada&quot;</strong> bloqueando la caja de reseñas para aquellos usuarios que no posean una orden pagada con el producto a calificar.
              </p>

              <div className="flex flex-col gap-3">
                 <div className={`flex items-start gap-3 p-4 rounded-xl border ${allowOpenReviews ? 'bg-purple-50 border-purple-200' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                    <span className={`material-symbols-outlined mt-0.5 ${allowOpenReviews ? 'text-[#6b1e96]' : 'text-gray-400'}`}>public</span>
                    <div>
                       <strong className={`block text-[15px] ${allowOpenReviews ? 'text-[#6b1e96]' : 'text-gray-500'}`}>Modo Libre (Cualquier Usuario)</strong>
                       <span className="text-sm">Todo usuario registrado en Forcepx puede reseñar cualquier producto y afecta su global.</span>
                    </div>
                 </div>

                 <div className={`flex items-start gap-3 p-4 rounded-xl border ${!allowOpenReviews ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                    <span className={`material-symbols-outlined mt-0.5 ${!allowOpenReviews ? 'text-yellow-600' : 'text-gray-400'}`}>verified_user</span>
                    <div>
                       <strong className={`block text-[15px] ${!allowOpenReviews ? 'text-yellow-700' : 'text-gray-500'}`}>Compras Verificadas (Solo Clientes)</strong>
                       <span className="text-sm">Tu plataforma protege las reseñas. Nadie puede opinar si no consumió el producto realmente.</span>
                    </div>
                 </div>
              </div>

            </div>

            {/* Premium Toggle Switch */}
            <div className="flex flex-col items-end pt-2">
              <button 
                onClick={handleToggleReviews}
                disabled={saving}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#c3ff00] focus:ring-offset-2 ${saving ? 'opacity-50 cursor-not-allowed' : ''} ${allowOpenReviews ? 'bg-[#c3ff00]' : 'bg-gray-300'}`}
                aria-pressed={allowOpenReviews}
              >
                <span className="sr-only">Habilitar reseñas libres</span>
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${
                    allowOpenReviews ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`mt-3 text-sm font-bold tracking-wide uppercase ${allowOpenReviews ? 'text-[#557300]' : 'text-gray-500'}`}>
                 {allowOpenReviews ? 'Activado' : 'Apagado'}
              </span>
            </div>

          </div>
        </div>

        {/* ─── Comisiones y Porcentajes Block ─── */}
        <div className="border border-gray-200 rounded-2xl p-6 md:p-8 bg-gray-50/50 shadow-sm relative transition-all hover:border-[#6b1e96]/30 hover:shadow-md group">
          
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">percent</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 font-['Manrope']">Comisiones y Porcentajes</h2>
          </div>
          
          <p className="text-gray-600 text-[15px] leading-relaxed mb-6 max-w-xl">
            Configura los porcentajes de comisión que la plataforma cobra a las tiendas afiliadas y el cargo de servicio que se aplica a los compradores en el checkout.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Store Fee */}
            <div className="p-5 rounded-xl border border-gray-200 bg-white space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-[#6b1e96] text-[20px]">storefront</span>
                <h3 className="font-bold text-gray-900 text-[15px] font-['Manrope']">Comisión a Tiendas</h3>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Porcentaje que Forcepx retiene sobre cada venta de la tienda. <strong>No afecta el precio que ve el comprador.</strong>
              </p>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-purple-50 border border-purple-200">
                <span className="material-symbols-outlined text-[#6b1e96] text-[16px] mt-0.5">info</span>
                <span className="text-xs text-[#6b1e96]">
                  Actual: <strong>{storeFee ? `${storeFee}%` : "No configurado"}</strong>
                  {storeFeeUpdated && <> — Última actualización: {new Date(storeFeeUpdated).toLocaleDateString("es-VE", { day: "numeric", month: "short", year: "numeric" })}</>}
                </span>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={storeFeeInput}
                    onChange={(e) => setStoreFeeInput(e.target.value)}
                    placeholder="Ej: 5"
                    className="w-full pl-4 pr-8 py-3 border border-gray-300 rounded-xl text-gray-900 text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/30 focus:border-[#6b1e96] transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">%</span>
                </div>
                <button
                  onClick={async () => {
                    const val = parseFloat(storeFeeInput);
                    if (isNaN(val) || val < 0 || val > 100) { toast.error("Porcentaje inválido (0-100)"); return; }
                    const prev = storeFee;
                    setStoreFee(String(val));
                    try {
                      setSavingStoreFee(true);
                      await api.put("/admin/settings/store-fee", { percentage: val });
                      setStoreFeeUpdated(new Date().toISOString());
                      toast.success(`Comisión a tiendas actualizada a ${val}%`);
                    } catch { setStoreFee(prev); setStoreFeeInput(prev); toast.error("Error al guardar."); }
                    finally { setSavingStoreFee(false); }
                  }}
                  disabled={savingStoreFee || !storeFeeInput || storeFeeInput === storeFee}
                  className={`px-5 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
                    savingStoreFee || !storeFeeInput || storeFeeInput === storeFee
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-[#6b1e96] text-white hover:bg-[#531575] shadow-sm hover:shadow-md active:scale-[0.98]"
                  }`}
                >
                  {savingStoreFee ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <span className="material-symbols-outlined text-[18px]">save</span>}
                  Guardar
                </button>
              </div>
            </div>

            {/* Buyer Fee */}
            <div className="p-5 rounded-xl border border-gray-200 bg-white space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-[#c3ff00] bg-gray-800 rounded-full p-0.5 text-[18px]">shopping_cart</span>
                <h3 className="font-bold text-gray-900 text-[15px] font-['Manrope']">Comisión al Comprador</h3>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Cargo de servicio visible en el checkout que se <strong>suma al subtotal de productos</strong>. No aplica sobre el envío.
              </p>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <span className="material-symbols-outlined text-amber-600 text-[16px] mt-0.5">info</span>
                <span className="text-xs text-amber-800">
                  Actual: <strong>{buyerFee ? `${buyerFee}%` : "No configurado"}</strong>
                  {buyerFeeUpdated && <> — Última actualización: {new Date(buyerFeeUpdated).toLocaleDateString("es-VE", { day: "numeric", month: "short", year: "numeric" })}</>}
                </span>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={buyerFeeInput}
                    onChange={(e) => setBuyerFeeInput(e.target.value)}
                    placeholder="Ej: 10"
                    className="w-full pl-4 pr-8 py-3 border border-gray-300 rounded-xl text-gray-900 text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">%</span>
                </div>
                <button
                  onClick={async () => {
                    const val = parseFloat(buyerFeeInput);
                    if (isNaN(val) || val < 0 || val > 100) { toast.error("Porcentaje inválido (0-100)"); return; }
                    const prev = buyerFee;
                    setBuyerFee(String(val));
                    try {
                      setSavingBuyerFee(true);
                      await api.put("/admin/settings/buyer-fee", { percentage: val });
                      setBuyerFeeUpdated(new Date().toISOString());
                      toast.success(`Comisión al comprador actualizada a ${val}%`);
                    } catch { setBuyerFee(prev); setBuyerFeeInput(prev); toast.error("Error al guardar."); }
                    finally { setSavingBuyerFee(false); }
                  }}
                  disabled={savingBuyerFee || !buyerFeeInput || buyerFeeInput === buyerFee}
                  className={`px-5 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
                    savingBuyerFee || !buyerFeeInput || buyerFeeInput === buyerFee
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-amber-500 text-white hover:bg-amber-600 shadow-sm hover:shadow-md active:scale-[0.98]"
                  }`}
                >
                  {savingBuyerFee ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <span className="material-symbols-outlined text-[18px]">save</span>}
                  Guardar
                </button>
              </div>
            </div>

          </div>

          {/* Security Note */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-100 border border-gray-200 text-gray-600 text-xs mt-6">
            <span className="material-symbols-outlined text-gray-500 text-[16px] mt-0.5 flex-shrink-0">shield</span>
            <span>
              <strong>Seguridad:</strong> Los porcentajes se congelan server-side al momento de crear cada orden. Los valores visibles en el checkout son de referencia. El cálculo real siempre usa los datos del servidor.
            </span>
          </div>
        </div>

        {/* ─── SLA y Multas de Envíos Block ─── */}
        <div className="border border-gray-200 rounded-2xl p-6 md:p-8 bg-gray-50/50 shadow-sm relative transition-all hover:border-[#6b1e96]/30 hover:shadow-md group">
          
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">local_shipping</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 font-['Manrope']">SLA y Sanciones de Envíos</h2>
          </div>
          
          <p className="text-gray-600 text-[15px] leading-relaxed mb-6 max-w-xl">
            Configura el plazo máximo de despacho (SLA) para las tiendas afiliadas y el monto de la penalización monetaria que se aplicará en caso de demoras.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Shipping SLA (Hours) */}
            <div className="p-5 rounded-xl border border-gray-200 bg-white space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-[#6b1e96] text-[20px]">schedule</span>
                <h3 className="font-bold text-gray-900 text-[15px] font-['Manrope']">Plazo de Despacho (SLA)</h3>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Horas permitidas después de aprobado el pago para marcar el ítem como despachado.
              </p>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-purple-50 border border-purple-200">
                <span className="material-symbols-outlined text-[#6b1e96] text-[16px] mt-0.5">info</span>
                <span className="text-xs text-[#6b1e96]">
                  Actual: <strong>{shippingSla ? `${shippingSla} horas` : "24 horas"}</strong>
                  {shippingSlaUpdated && <> — Última actualización: {new Date(shippingSlaUpdated).toLocaleDateString("es-VE", { day: "numeric", month: "short", year: "numeric" })}</>}
                </span>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={shippingSlaInput}
                    onChange={(e) => setShippingSlaInput(e.target.value)}
                    placeholder="Ej: 24"
                    className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-xl text-gray-900 text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/30 focus:border-[#6b1e96] transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">horas</span>
                </div>
                <button
                  onClick={async () => {
                    const val = parseInt(shippingSlaInput);
                    if (isNaN(val) || val <= 0) { toast.error("Plazo inválido (debe ser mayor a 0)"); return; }
                    const prev = shippingSla;
                    setShippingSla(String(val));
                    try {
                      setSavingShippingSla(true);
                      await api.put("/admin/settings/shipping-sla", { hours: val });
                      setShippingSlaUpdated(new Date().toISOString());
                      toast.success(`SLA de despacho actualizado a ${val} horas`);
                    } catch { setShippingSla(prev); setShippingSlaInput(prev); toast.error("Error al guardar."); }
                    finally { setSavingShippingSla(false); }
                  }}
                  disabled={savingShippingSla || !shippingSlaInput || shippingSlaInput === shippingSla}
                  className={`px-5 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
                    savingShippingSla || !shippingSlaInput || shippingSlaInput === shippingSla
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-[#6b1e96] text-white hover:bg-[#531575] shadow-sm hover:shadow-md active:scale-[0.98]"
                  }`}
                >
                  {savingShippingSla ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <span className="material-symbols-outlined text-[18px]">save</span>}
                  Guardar
                </button>
              </div>
            </div>

            {/* Late Shipping Fine (USD) */}
            <div className="p-5 rounded-xl border border-gray-200 bg-white space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-amber-600 text-[20px]">monetization_on</span>
                <h3 className="font-bold text-gray-900 text-[15px] font-['Manrope']">Monto de Penalización (Multa)</h3>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Monto en USD a descontar de la billetera del vendedor si duplica el tiempo de SLA sin despachar.
              </p>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <span className="material-symbols-outlined text-amber-600 text-[16px] mt-0.5">info</span>
                <span className="text-xs text-amber-800">
                  Actual: <strong>{shippingFine ? `$${Number(shippingFine).toFixed(2)}` : "$5.00"}</strong>
                  {shippingFineUpdated && <> — Última actualización: {new Date(shippingFineUpdated).toLocaleDateString("es-VE", { day: "numeric", month: "short", year: "numeric" })}</>}
                </span>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={shippingFineInput}
                    onChange={(e) => setShippingFineInput(e.target.value)}
                    placeholder="Ej: 5.00"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
                <button
                  onClick={async () => {
                    const val = parseFloat(shippingFineInput);
                    if (isNaN(val) || val < 0) { toast.error("Monto inválido (debe ser mayor o igual a 0)"); return; }
                    const prev = shippingFine;
                    setShippingFine(String(val));
                    try {
                      setSavingShippingFine(true);
                      await api.put("/admin/settings/shipping-fine", { amount: val });
                      setShippingFineUpdated(new Date().toISOString());
                      toast.success(`Multa de despacho actualizada a $${val.toFixed(2)}`);
                    } catch { setShippingFine(prev); setShippingFineInput(prev); toast.error("Error al guardar."); }
                    finally { setSavingShippingFine(false); }
                  }}
                  disabled={savingShippingFine || !shippingFineInput || shippingFineInput === shippingFine}
                  className={`px-5 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
                    savingShippingFine || !shippingFineInput || shippingFineInput === shippingFine
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-amber-500 text-white hover:bg-amber-600 shadow-sm hover:shadow-md active:scale-[0.98]"
                  }`}
                >
                  {savingShippingFine ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <span className="material-symbols-outlined text-[18px]">save</span>}
                  Guardar
                </button>
              </div>
            </div>

          </div>

          {/* SLA Escalation Rules Alert */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs mt-6">
            <span className="material-symbols-outlined text-red-600 text-[16px] mt-0.5 flex-shrink-0">warning</span>
            <span>
              <strong>Regla de Escalado:</strong> Exceder el SLA genera una <strong>Amonestación</strong>. Exceder el doble del SLA genera la <strong>Multa configurada</strong>. Exceder el triple del SLA provoca la <strong>Suspensión automática</strong> de la tienda. Exceder el cuádruple de SLA genera la <strong>Cancelación automática</strong> de la orden y retorno de stock.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
