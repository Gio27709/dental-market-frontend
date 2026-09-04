import { useState, useEffect, useCallback } from "react";
import { getWalletBalanceAPI, getWalletTransactionsAPI, getStorePayoutsAPI, requestPayoutAPI } from "../../services/api";
import { useProducts } from "../../context/ProductContext";
import toast from "react-hot-toast";

const TX_TYPE_CONFIG = {
  credit: { label: "Crédito", bg: "bg-blue-50 text-blue-700 border border-blue-100" },
  debit: { label: "Débito", bg: "bg-gray-50 text-gray-700 border border-gray-100" },
  payout: { label: "Retiro", bg: "bg-red-50 text-red-700 border border-red-100" },
  escrow_release: { label: "Liberación", bg: "bg-teal-50 text-teal-700 border border-teal-100" },
  fee: { label: "Comisión", bg: "bg-amber-50 text-amber-700 border border-amber-100" },
  sale: { label: "Venta", bg: "bg-green-50 text-green-700 border border-green-100" },
  fine_deduction: { label: "Sanción", bg: "bg-orange-50 text-orange-700 border border-orange-100" },
  refund: { label: "Reembolso", bg: "bg-purple-50 text-purple-700 border border-purple-100" },
  // Los tres tipos que el libro admite desde las migraciones 058, 059 y 063. Sin entrada
  // aquí el fallback pinta el nombre crudo del enum, así que la tienda leía badges que
  // decían "refund_charge" o "fine_reversal" en su historial de movimientos.
  refund_charge: { label: "Cargo por reembolso", bg: "bg-purple-50 text-purple-700 border border-purple-100" },
  debt_settlement: { label: "Cobro de deuda", bg: "bg-orange-50 text-orange-700 border border-orange-100" },
  fine_reversal: { label: "Sanción anulada", bg: "bg-emerald-50 text-emerald-700 border border-emerald-100" },
};

const VENEZUELAN_BANKS = [
  { code: "0102", name: "Banco de Venezuela" },
  { code: "0134", name: "Banesco" },
  { code: "0105", name: "Banco Mercantil" },
  { code: "0108", name: "BBVA Provincial" },
  { code: "0172", name: "Bancamiga" },
  { code: "0114", name: "Bancaribe" },
  { code: "0115", name: "Banco Exterior" },
  { code: "0128", name: "Banco Caroní" },
  { code: "0137", name: "Sofitasa" },
  { code: "0138", name: "Banco Plaza" },
  { code: "0151", name: "BFC Banco Fondo Común" },
  { code: "0156", name: "100% Banco" },
  { code: "0157", name: "Del Sur" },
  { code: "0163", name: "Banco del Tesoro" },
  { code: "0166", name: "Banco Agrícola de Venezuela" },
  { code: "0168", name: "Bancrecer" },
  { code: "0169", name: "Mi Banco" },
  { code: "0174", name: "Banplus" },
  { code: "0175", name: "Banco Bicentenario" },
  { code: "0177", name: "BANFANB" },
  { code: "0191", name: "Banco Activo" },
];

export default function StoreWallet() {
  // Tasa BCV para el equivalente en bolívares del retiro. Sale del mismo sitio que el
  // resto de la app (global_settings.bcv_rate vía ProductContext). Antes se leía
  // localStorage a pelo con 45,12 como respaldo: si la clave aún no estaba, la tienda veía
  // «Tasa BCV oficial: 45.12» con la tasa real en cientos de bolívares.
  const { bcvRate } = useProducts();
  const tasaBcv = Number(bcvRate) > 1 ? Number(bcvRate) : 0;

  // `escrow` viene desglosado del backend (v_escrow_items, la misma fuente que ve el
  // administrador). Antes esta pantalla pintaba `balance_pending`, una columna que nadie
  // mantenía: le decía $0.00 a tiendas con cientos de dólares retenidos de verdad.
  const [wallet, setWallet] = useState({
    balance_available: 0,
    balance_pending: 0,
    balance_debt: 0,
    // Disponible menos deuda. Es contra esto que valida el retiro (migración 064): sin
    // ello el formulario dejaba pedir un importe que el backend rechaza después.
    balance_withdrawable: 0,
    escrow: { retained: 0, in_transit: 0, claimable: 0, legacy: 0, items: 0 },
  });

  // El backend ya lo calcula, pero se recalcula aquí como red por si la respuesta viene de
  // una versión anterior sin el campo: nunca hay que ofrecer un botón de retiro por un
  // importe que la RPC va a rechazar.
  const retirable = Math.max(
    Number(wallet.balance_withdrawable ?? (Number(wallet.balance_available || 0) - Number(wallet.balance_debt || 0))),
    0
  );

  const [transactions, setTransactions] = useState([]);
  const [payouts, setPayouts] = useState([]); // Solicitudes de retiro de la tienda
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [payoutsLoading, setPayoutsLoading] = useState(false);

  // Modal withdraw states
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [viewDetailsPayout, setViewDetailsPayout] = useState(null); // Modal para ver recibo y estado del retiro
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pago_movil"); // pago_movil, transferencia
  const [submitting, setSubmitting] = useState(false);

  const [pmPhone, setPmPhone] = useState("");
  const [pmDni, setPmDni] = useState("");
  const [pmBank, setPmBank] = useState("");

  const [tfBankName, setTfBankName] = useState("");
  const [tfAccountNumber, setTfAccountNumber] = useState("");
  const [tfHolderName, setTfHolderName] = useState("");
  const [tfDni, setTfDni] = useState("");

  // Validation errors
  const [errors, setErrors] = useState({});

  const fetchWalletData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getWalletBalanceAPI();
      if (data?.success) {
        setWallet(data.data);
      }
    } catch (err) {
      toast.error("Error cargando saldo: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const { data } = await getWalletTransactionsAPI();
      if (data?.success) {
        setTransactions(data.data || []);
      }
    } catch (err) {
      toast.error("Error cargando historial: " + err.message);
    } finally {
      setTxLoading(false);
    }
  }, []);

  const fetchPayouts = useCallback(async () => {
    setPayoutsLoading(true);
    try {
      const { data } = await getStorePayoutsAPI();
      if (data?.success) {
        setPayouts(data.data || []);
      }
    } catch (err) {
      toast.error("Error cargando solicitudes de retiro: " + err.message);
    } finally {
      setPayoutsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWalletData();
    fetchTransactions();
    fetchPayouts();
  }, [fetchWalletData, fetchTransactions, fetchPayouts]);

  const handleOpenModal = () => {
    setWithdrawAmount("");
    setErrors({});
    setWithdrawModal(true);
  };

  const handleCloseModal = () => {
    if (!submitting) {
      setWithdrawModal(false);
    }
  };

  const validateForm = () => {
    const tempErrors = {};
    const amountNum = parseFloat(withdrawAmount);

    if (!withdrawAmount || isNaN(amountNum) || amountNum <= 0) {
      tempErrors.amount = "El monto debe ser un número mayor a 0";
    } else if (amountNum > retirable) {
      tempErrors.amount = Number(wallet.balance_debt || 0) > 0
        ? `Fondos insuficientes. Tienes $${Number(wallet.balance_available).toFixed(2)} disponibles, pero $${Number(wallet.balance_debt).toFixed(2)} son deuda pendiente: puedes retirar hasta $${retirable.toFixed(2)}`
        : `Fondos insuficientes. Tu saldo disponible es $${Number(wallet.balance_available).toFixed(2)}`;
    } else if (amountNum > 100000) {
      tempErrors.amount = "El monto máximo por retiro es $100,000";
    }

    if (paymentMethod === "pago_movil") {
      if (!pmPhone.trim()) {
        tempErrors.pmPhone = "El número de teléfono es requerido";
      } else if (!/^(0412|0414|0416|0424|0426|02)[0-9]{7,8}$/.test(pmPhone.replace(/[\s-]/g, ""))) {
        tempErrors.pmPhone = "Número telefónico inválido. Ej: 04121234567";
      }
      if (!pmDni.trim()) {
        tempErrors.pmDni = "El documento de identidad (CI/RIF) es requerido";
      }
      if (!pmBank) {
        tempErrors.pmBank = "El banco receptor es requerido";
      }
    } else if (paymentMethod === "transferencia") {
      if (!tfBankName.trim()) {
        tempErrors.tfBankName = "El nombre del banco es requerido";
      }
      if (!tfAccountNumber.trim() || !/^\d{20}$/.test(tfAccountNumber.replace(/[\s-]/g, ""))) {
        tempErrors.tfAccountNumber = "La cuenta bancaria debe tener exactamente 20 dígitos";
      }
      if (!tfHolderName.trim()) {
        tempErrors.tfHolderName = "El nombre del titular de la cuenta es requerido";
      }
      if (!tfDni.trim()) {
        tempErrors.tfDni = "El documento de identidad (CI/RIF) del titular es requerido";
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);

    const amount = parseFloat(withdrawAmount);
    let payment_details = {};

    if (paymentMethod === "pago_movil") {
      payment_details = {
        phone: pmPhone.replace(/[\s-]/g, "").trim(),
        dni: pmDni.trim().toUpperCase(),
        bank_code: pmBank,
      };
    } else if (paymentMethod === "transferencia") {
      payment_details = {
        bank_name: tfBankName.trim(),
        account_number: tfAccountNumber.replace(/[\s-]/g, "").trim(),
        holder_name: tfHolderName.trim(),
        dni: tfDni.trim().toUpperCase(),
      };
    }

    try {
      const { data } = await requestPayoutAPI({
        amount,
        method: paymentMethod,
        payment_details,
      });

      if (data?.success) {
        toast.success(data.message || "Solicitud de retiro enviada con éxito");
        setWithdrawModal(false);
        // Refresh wallet state, transactions & payout list
        fetchWalletData();
        fetchTransactions();
        fetchPayouts();
      }
    } catch (err) {
      toast.error(err.message || "Error procesando el retiro");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("es-VE", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight font-['Manrope']">
            Mi Billetera
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Administra tus ingresos acumulados y gestiona las solicitudes de retiro de fondos de tu comercio.
          </p>
        </div>
        <button
          onClick={() => {
            fetchWalletData();
            fetchTransactions();
            fetchPayouts();
          }}
          className="self-start md:self-auto text-xs font-semibold text-[#6b1e96] hover:bg-[#6b1e96]/10 px-3 py-2 rounded-lg transition-colors border border-[#6b1e96]/20 flex items-center gap-1.5 bg-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Sincronizar
        </button>
      </div>

      {/* Live Sync Action Wrapper */}
      <button
        style={{ display: "none" }}
        id="sync-payouts-btn"
        onClick={() => {
          fetchWalletData();
          fetchTransactions();
          fetchPayouts();
        }}
      />

      {/* Wallet Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Available Balance - Premium Purple Card */}
        <div
          className="rounded-2xl shadow-xl overflow-hidden p-6 md:p-8 flex flex-col justify-between min-h-[220px] relative text-white"
          style={{
            background: "linear-gradient(135deg, #1a0a2e 0%, #3b1566 100%)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          {/* Decorative design orb */}
          <div
            className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-20 pointer-events-none"
            style={{ background: "radial-gradient(circle, #c3ff00 0%, transparent 70%)" }}
          />

          <div className="relative z-10">
            <div className="flex items-center gap-2 text-white/70 uppercase tracking-widest text-xs font-bold">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-[#c3ff00]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
              </svg>
              Saldo Disponible
            </div>
            {loading ? (
              <div className="h-10 w-32 bg-white/10 animate-pulse rounded-lg mt-3" />
            ) : (
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mt-2 text-[#c3ff00] font-mono">
                ${Number(wallet.balance_available).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            )}
            <p className="text-xs text-white/60 mt-2">
              Fondos liberados listos para ser retirados a tus cuentas bancarias.
            </p>
          </div>

          <button
            onClick={handleOpenModal}
            disabled={retirable <= 0 || loading}
            className="w-full md:w-auto self-start mt-6 px-6 py-3 rounded-xl font-bold transition-all duration-200 shadow-md shadow-[#c3ff00]/10 flex items-center justify-center gap-2 text-[#1a0a2e] disabled:opacity-50 disabled:cursor-not-allowed uppercase text-sm tracking-wider"
            style={{
              backgroundColor: retirable > 0 && !loading ? "#c3ff00" : "rgba(255,255,255,0.15)",
              color: retirable > 0 && !loading ? "#1a0a2e" : "rgba(255,255,255,0.4)",
            }}
            onMouseEnter={(e) => {
              if (retirable > 0 && !loading) {
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(195, 255, 0, 0.4)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              if (retirable > 0 && !loading) {
                e.currentTarget.style.boxShadow = "0 4px 6px rgba(195, 255, 0, 0.1)";
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 0 0 4.5 9.75v7.5a2.25 2.25 0 0 0 2.25 2.25h7.5a2.25 2.25 0 0 0 2.25-2.25v-7.5a2.25 2.25 0 0 0-2.25-2.25h-.75m-6 3.75 3 3m0 0 3-3m-3 3V1.5m6 9h.75a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25v-.75" />
            </svg>
            Retirar Fondos
          </button>
        </div>

        {/* Pending Balance Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 flex flex-col justify-between min-h-[220px]">
          <div>
            <div className="flex items-center gap-2 text-gray-400 uppercase tracking-widest text-xs font-bold">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-purple-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Saldo en Custodia (Pendiente)
            </div>
            {loading ? (
              <div className="h-10 w-32 bg-gray-100 animate-pulse rounded-lg mt-3" />
            ) : (
              <>
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mt-2 text-gray-800 font-mono">
                  ${Number(wallet.escrow?.retained || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
                {/* El desglose es lo que de verdad le interesa a la tienda: no es lo mismo
                    dinero que aún viaja que dinero ya entregado esperando liberación. */}
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
                  <span>
                    En camino{" "}
                    <span className="font-mono font-bold text-gray-700">
                      ${Number(wallet.escrow?.in_transit || 0).toFixed(2)}
                    </span>
                  </span>
                  <span>
                    Entregado, por liberar{" "}
                    <span className="font-mono font-bold text-amber-600">
                      ${Number(wallet.escrow?.claimable || 0).toFixed(2)}
                    </span>
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="mt-4 p-4 rounded-xl bg-purple-50/50 border border-purple-100 text-xs text-purple-950 leading-relaxed">
            <span className="font-semibold text-purple-700 block mb-1">¿Por qué este saldo está pendiente?</span>
            Estos fondos corresponden a ventas en curso y están retenidos temporalmente en custodia (escrow). Serán liberados automáticamente a tu saldo disponible cuando el comprador confirme la entrega conforme del pedido.
          </div>

          {Number(wallet.escrow?.legacy || 0) > 0 && (
            <div className="mt-3 p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 leading-relaxed">
              <span className="font-semibold text-gray-700 block mb-1">
                Ventas liquidadas fuera de la plataforma: ${Number(wallet.escrow.legacy).toFixed(2)}
              </span>
              Son entregas anteriores a la puesta en marcha del escrow. Ya se te pagaron por
              fuera, así que no se cobran por esta vía y no forman parte de tu saldo. Aparecen
              aquí solo para que el historial esté completo.
            </div>
          )}

          {Number(wallet.balance_debt || 0) > 0 && (
            <div className="mt-3 p-4 rounded-xl bg-orange-50 border border-orange-200 text-xs text-orange-900 leading-relaxed">
              <span className="font-semibold text-orange-700 block mb-1">
                Pendiente de cobro: ${Number(wallet.balance_debt).toFixed(2)}
              </span>
              Corresponde a reembolsos a compradores y a multas por incumplimiento de SLA que
              no se pudieron descontar de tu saldo en su momento. Se descontará automáticamente
              de tu próxima venta liberada, y mientras tanto no forma parte de lo que puedes retirar.
            </div>
          )}
        </div>
      </div>

      {/* Payout Requests Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 font-['Manrope']">Solicitudes de Retiro Recientes</h3>
            <p className="text-xs text-gray-500 mt-0.5">Seguimiento en tiempo real de tus solicitudes de transferencia a cuentas bancarias.</p>
          </div>
        </div>

        {payoutsLoading && payouts.length === 0 ? (
          <div className="flex items-center justify-center p-16">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-[#6b1e96] rounded-full animate-spin" />
          </div>
        ) : payouts.length === 0 ? (
          <div className="text-center p-12 text-gray-500">
            <div className="text-4xl mb-3">💸</div>
            <h4 className="text-base font-bold text-gray-700 font-['Manrope']">No hay retiros solicitados</h4>
            <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">Tus solicitudes de Pago Móvil o Transferencia aparecerán listadas aquí con su estado de procesamiento.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse hidden md:table">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <th className="px-6 py-4">Fecha Solicitud</th>
                  <th className="px-6 py-4">ID Solicitud</th>
                  <th className="px-6 py-4">Método</th>
                  <th className="px-6 py-4">Monto USD (VES)</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {payouts.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-medium">
                        {formatDate(p.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-400">
                        #{p.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-gray-800">
                          {p.method === "pago_movil" ? "📱 Pago Móvil" : "🏦 Transferencia"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-[#6b1e96] font-mono">${Number(p.amount).toFixed(2)}</div>
                        {p.payment_details?.amount_ves && (
                          <div className="text-[10px] text-emerald-600 font-bold font-mono">
                            {Number(p.payment_details.amount_ves).toLocaleString("es-VE", { minimumFractionDigits: 2 })} VES
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                          p.status === "completed" ? "bg-green-50 text-green-700 border-green-100" :
                          p.status === "rejected" ? "bg-red-50 text-red-700 border-red-100" :
                          "bg-yellow-50 text-yellow-700 border-yellow-100"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            p.status === "completed" ? "bg-green-500" :
                            p.status === "rejected" ? "bg-red-500" :
                            "bg-yellow-500"
                          }`} />
                          {p.status === "completed" ? "Procesado" :
                           p.status === "rejected" ? "Rechazado" :
                           "En Proceso"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => setViewDetailsPayout(p)}
                          className="px-4 py-2 text-xs font-bold text-[#6b1e96] hover:bg-[#6b1e96]/10 rounded-xl transition-all border border-[#6b1e96]/20 bg-white"
                        >
                          Ver Detalles
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Vista responsiva de tarjetas en móvil para retiros */}
            <div className="grid grid-cols-1 gap-4 p-4 md:hidden border-t border-gray-150 bg-gray-50/10">
              {payouts.map((p) => (
                <div 
                  key={p.id} 
                  className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 font-semibold">{formatDate(p.created_at)}</span>
                      <span className="font-mono text-[11px] text-gray-400 mt-0.5">#{p.id.substring(0, 8).toUpperCase()}</span>
                    </div>
                    {/* Badge de Estado */}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      p.status === "completed" ? "bg-green-50 text-green-700 border-green-100" :
                      p.status === "rejected" ? "bg-red-50 text-red-700 border-red-100" :
                      "bg-yellow-50 text-yellow-700 border-yellow-100"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        p.status === "completed" ? "bg-green-500" :
                        p.status === "rejected" ? "bg-red-500" :
                        "bg-yellow-500"
                      }`} />
                      {p.status === "completed" ? "Procesado" :
                       p.status === "rejected" ? "Rechazado" :
                       "En Proceso"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-100">
                    <div className="flex flex-col">
                      <span className="text-gray-400">Método:</span>
                      <span className="font-bold text-gray-800 mt-0.5">
                        {p.method === "pago_movil" ? "📱 Pago Móvil" : "🏦 Transferencia"}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-gray-400">Monto:</span>
                      <span className="font-black text-[#6b1e96] font-mono text-sm mt-0.5">${Number(p.amount).toFixed(2)}</span>
                      {p.payment_details?.amount_ves && (
                        <span className="text-[10px] text-emerald-600 font-bold font-mono">
                          {Number(p.payment_details.amount_ves).toLocaleString("es-VE", { minimumFractionDigits: 2 })} VES
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setViewDetailsPayout(p)}
                      className="w-full py-2 text-center text-xs font-bold text-[#6b1e96] hover:bg-[#6b1e96]/10 rounded-xl transition-all border border-[#6b1e96]/20 bg-white"
                    >
                      Ver Detalles
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Transaction History Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 font-['Manrope']">Historial Contable</h3>
            <p className="text-xs text-gray-500 mt-0.5">Listado detallado de ingresos por ventas, retiros, penalizaciones y reembolsos.</p>
          </div>
        </div>

        {txLoading && transactions.length === 0 ? (
          <div className="flex items-center justify-center p-16">
            <div className="w-10 h-10 border-4 border-[#c3ff00] border-t-[#6b1e96] rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center p-12">
            <div className="text-4xl mb-3">📄</div>
            <h4 className="text-base font-bold text-gray-700 font-['Manrope']">No hay movimientos registrados</h4>
            <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">Cuando realices ventas o solicites retiros, se verán reflejados en esta tabla contable.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse hidden md:table">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <th className="px-6 py-4">Fecha / Hora</th>
                  <th className="px-6 py-4">ID de Transacción</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Detalle / Concepto</th>
                  <th className="px-6 py-4 text-right">Monto (USD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {transactions.map((tx) => {
                  const typeConf = TX_TYPE_CONFIG[tx.type] || { label: tx.type, bg: "bg-gray-100 text-gray-600 border-gray-200" };
                  const isNegative = parseFloat(tx.amount) < 0;

                  return (
                    <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4.5 whitespace-nowrap text-xs text-gray-500 font-medium">
                        {formatDate(tx.created_at)}
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap font-mono text-xs text-gray-400">
                        #{tx.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${typeConf.bg}`}>
                          {typeConf.label}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 max-w-xs md:max-w-md truncate text-gray-600">
                        {tx.description}
                      </td>
                      <td className={`px-6 py-4.5 whitespace-nowrap text-right font-mono font-bold text-sm ${isNegative ? "text-red-600" : "text-green-600"}`}>
                        {isNegative ? "-" : "+"}${Math.abs(parseFloat(tx.amount)).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Vista responsiva de tarjetas en móvil para transacciones */}
            <div className="grid grid-cols-1 gap-4 p-4 md:hidden border-t border-gray-150 bg-gray-50/10">
              {transactions.map((tx) => {
                const typeConf = TX_TYPE_CONFIG[tx.type] || { label: tx.type, bg: "bg-gray-100 text-gray-600 border-gray-200" };
                const isNegative = parseFloat(tx.amount) < 0;

                return (
                  <div 
                    key={tx.id} 
                    className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400 font-semibold">{formatDate(tx.created_at)}</span>
                        <span className="font-mono text-[11px] text-gray-400 mt-0.5">#{tx.id.substring(0, 8).toUpperCase()}</span>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${typeConf.bg}`}>
                        {typeConf.label}
                      </span>
                    </div>

                    <div className="flex justify-between items-end text-xs pt-2 border-t border-gray-100">
                      <div className="flex-1 min-w-0 pr-3">
                        <span className="text-gray-400 block mb-0.5">Concepto:</span>
                        <span className="text-gray-700 font-medium text-[11px] line-clamp-2 leading-tight" title={tx.description}>
                          {tx.description}
                        </span>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className="text-gray-400">Monto:</span>
                        <span className={`font-black font-mono text-sm mt-0.5 ${isNegative ? "text-red-600" : "text-green-600"}`}>
                          {isNegative ? "-" : "+"}${Math.abs(parseFloat(tx.amount)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      {withdrawModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4" onClick={handleCloseModal}>
          <div
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-[#6b1e96] flex items-center justify-center text-lg">
                  💸
                </div>
                <div>
                  <h3 className="text-xl font-bold font-['Manrope'] text-gray-900">Solicitar Retiro de Fondos</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Puedes retirar hasta ${retirable.toFixed(2)}</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                disabled={submitting}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleWithdrawSubmit}>
              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto admin-scrollbar">
                {/* Amount input */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Monto a Retirar (USD)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-lg text-gray-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      disabled={submitting}
                      className={`w-full pl-8 pr-4 py-3 bg-gray-50 border rounded-xl text-lg font-bold font-mono outline-none focus:ring-2 focus:ring-[#6b1e96]/20 transition-all ${
                        errors.amount ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-[#6b1e96]"
                      }`}
                    />
                  </div>
                  {/* Live VES Equivalency Banner based on BCV rate */}
                  {withdrawAmount && !isNaN(parseFloat(withdrawAmount)) && parseFloat(withdrawAmount) > 0 && (
                    tasaBcv > 0 ? (
                      <p className="text-xs text-[#6b1e96] font-bold mt-2 flex flex-wrap items-center gap-1.5 bg-purple-50 p-2.5 rounded-xl border border-purple-100/50">
                        💵 Equivalente aproximado: {(parseFloat(withdrawAmount) * tasaBcv).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VES
                        <span className="text-gray-400 font-medium font-mono text-[9px] ml-1">(Tasa BCV: {tasaBcv.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} VES/USD; la tasa que se congela es la del momento de la solicitud)</span>
                      </p>
                    ) : (
                      <p className="text-[10px] text-gray-400 mt-2">Tasa BCV no disponible en este momento; el equivalente en bolívares se calcula al registrar la solicitud.</p>
                    )
                  )}
                  {errors.amount ? (
                    <p className="text-xs text-red-500 mt-1 font-semibold">{errors.amount}</p>
                  ) : (
                    <p className="text-[10px] text-gray-400 mt-1">Ingresa el monto que deseas transferir. Máximo $100,000.</p>
                  )}
                </div>

                {/* Method selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Método de Pago</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "pago_movil", name: "Pago Móvil", icon: "📱" },
                      { id: "transferencia", name: "Transferencia", icon: "🏦" },
                    ].map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(method.id);
                          setErrors(prev => {
                            const clone = { ...prev };
                            delete clone.amount; // Keep amount error, clear details errors
                            return clone;
                          });
                        }}
                        disabled={submitting}
                        className={`py-3 px-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all outline-none ${
                          paymentMethod === method.id
                            ? "bg-purple-50 border-[#6b1e96] text-[#6b1e96] shadow-sm"
                            : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50/50"
                        }`}
                      >
                        <span className="text-lg">{method.icon}</span>
                        <span>{method.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dynamic Fields */}
                <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100 space-y-4">
                  {paymentMethod === "pago_movil" && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Banco Receptor</label>
                        <select
                          value={pmBank}
                          onChange={(e) => setPmBank(e.target.value)}
                          disabled={submitting}
                          className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#6b1e96]/20 transition-all ${
                            errors.pmBank ? "border-red-500" : "border-gray-200 focus:border-[#6b1e96]"
                          }`}
                        >
                          <option value="">Selecciona el banco...</option>
                          {VENEZUELAN_BANKS.map((b) => (
                            <option key={b.code} value={b.code}>
                              {b.code} - {b.name}
                            </option>
                          ))}
                        </select>
                        {errors.pmBank && <p className="text-xs text-red-500 mt-1 font-medium">{errors.pmBank}</p>}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Teléfono Asociado</label>
                          <input
                            type="text"
                            placeholder="04121234567"
                            value={pmPhone}
                            onChange={(e) => setPmPhone(e.target.value)}
                            disabled={submitting}
                            className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#6b1e96]/20 transition-all ${
                              errors.pmPhone ? "border-red-500" : "border-gray-200 focus:border-[#6b1e96]"
                            }`}
                          />
                          {errors.pmPhone && <p className="text-xs text-red-500 mt-1 font-medium">{errors.pmPhone}</p>}
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Cédula / RIF</label>
                          <input
                            type="text"
                            placeholder="V-12345678 o J-123456789"
                            value={pmDni}
                            onChange={(e) => setPmDni(e.target.value)}
                            disabled={submitting}
                            className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#6b1e96]/20 transition-all ${
                              errors.pmDni ? "border-red-500" : "border-gray-200 focus:border-[#6b1e96]"
                            }`}
                          />
                          {errors.pmDni && <p className="text-xs text-red-500 mt-1 font-medium">{errors.pmDni}</p>}
                        </div>
                      </div>
                    </>
                  )}

                  {paymentMethod === "transferencia" && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Nombre del Banco</label>
                          <input
                            type="text"
                            placeholder="Banesco"
                            value={tfBankName}
                            onChange={(e) => setTfBankName(e.target.value)}
                            disabled={submitting}
                            className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#6b1e96]/20 transition-all ${
                              errors.tfBankName ? "border-red-500" : "border-gray-200 focus:border-[#6b1e96]"
                            }`}
                          />
                          {errors.tfBankName && <p className="text-xs text-red-500 mt-1 font-medium">{errors.tfBankName}</p>}
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Cédula / RIF del Titular</label>
                          <input
                            type="text"
                            placeholder="V-12345678"
                            value={tfDni}
                            onChange={(e) => setTfDni(e.target.value)}
                            disabled={submitting}
                            className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#6b1e96]/20 transition-all ${
                              errors.tfDni ? "border-red-500" : "border-gray-200 focus:border-[#6b1e96]"
                            }`}
                          />
                          {errors.tfDni && <p className="text-xs text-red-500 mt-1 font-medium">{errors.tfDni}</p>}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Número de Cuenta (20 dígitos)</label>
                        <input
                          type="text"
                          placeholder="01340105000000000000"
                          maxLength={24} // Allow spaces/hyphens initially
                          value={tfAccountNumber}
                          onChange={(e) => setTfAccountNumber(e.target.value)}
                          disabled={submitting}
                          className={`w-full px-4 py-2.5 bg-white border rounded-xl font-mono text-sm tracking-wide outline-none focus:ring-2 focus:ring-[#6b1e96]/20 transition-all ${
                            errors.tfAccountNumber ? "border-red-500" : "border-gray-200 focus:border-[#6b1e96]"
                          }`}
                        />
                        {errors.tfAccountNumber && <p className="text-xs text-red-500 mt-1 font-medium">{errors.tfAccountNumber}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Nombre Completo del Titular</label>
                        <input
                          type="text"
                          placeholder="John Doe"
                          value={tfHolderName}
                          onChange={(e) => setTfHolderName(e.target.value)}
                          disabled={submitting}
                          className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#6b1e96]/20 transition-all ${
                            errors.tfHolderName ? "border-red-500" : "border-gray-200 focus:border-[#6b1e96]"
                          }`}
                        />
                        {errors.tfHolderName && <p className="text-xs text-red-500 mt-1 font-medium">{errors.tfHolderName}</p>}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-200/50 rounded-xl transition-all font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, #531575, #6b1e96)",
                    color: "#c3ff00",
                  }}
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#c3ff00] border-t-transparent rounded-full animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      Confirmar Retiro
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Payout Details Modal */}
      {viewDetailsPayout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4 animate-in fade-in duration-200" onClick={() => setViewDetailsPayout(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-[#6b1e96] flex items-center justify-center text-base">
                  🏦
                </div>
                <div>
                  <h3 className="text-lg font-bold font-['Manrope'] text-gray-900">Detalle del Retiro</h3>
                  <p className="text-xs text-gray-400 mt-0.5">ID: #{viewDetailsPayout.id.substring(0, 8).toUpperCase()}</p>
                </div>
              </div>
              <button onClick={() => setViewDetailsPayout(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-sm text-gray-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider font-['Manrope']">Fecha de Solicitud</span>
                  <span className="font-semibold text-gray-800 mt-0.5 block">{formatDate(viewDetailsPayout.created_at)}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider font-['Manrope']">Monto Solicitado</span>
                  <span className="font-extrabold text-[#6b1e96] text-lg mt-0.5 block font-mono">${Number(viewDetailsPayout.amount).toFixed(2)}</span>
                </div>
              </div>

              {/* Bolívares Equivalency banner */}
              {viewDetailsPayout.payment_details?.amount_ves && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-950 flex flex-col gap-0.5 shadow-sm">
                  <span className="block text-[9px] font-bold text-emerald-700 uppercase tracking-widest">Monto liquidado en Bolívares (VES)</span>
                  <span className="text-xl font-black block font-mono mt-0.5">{Number(viewDetailsPayout.payment_details.amount_ves).toLocaleString("es-VE", { minimumFractionDigits: 2 })} VES</span>
                  <span className="text-[9px] text-emerald-700/80 block font-medium font-mono mt-0.5">Tasa oficial congelada: {viewDetailsPayout.payment_details.exchange_rate_at_request} VES/USD</span>
                </div>
              )}

              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Coordenadas de Pago</span>
                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-2.5">
                  <div>
                    <span className="block text-[9px] font-bold text-gray-400 uppercase">Método</span>
                    <span className="font-bold text-gray-800 text-xs mt-0.5 block">{viewDetailsPayout.method === "pago_movil" ? "📱 Pago Móvil" : "🏦 Transferencia"}</span>
                  </div>
                  {viewDetailsPayout.method === "pago_movil" && (
                    <>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div>
                          <span className="block text-[9px] font-bold text-gray-400 uppercase">Teléfono</span>
                          <span className="font-bold text-gray-800 text-xs font-mono">{viewDetailsPayout.payment_details?.phone}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-gray-400 uppercase">Cédula / RIF</span>
                          <span className="font-bold text-gray-800 text-xs font-mono">{viewDetailsPayout.payment_details?.dni}</span>
                        </div>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-gray-400 uppercase">Banco Código</span>
                        <span className="font-bold text-gray-800 text-xs font-mono select-all block mt-0.5">{viewDetailsPayout.payment_details?.bank_code}</span>
                      </div>
                    </>
                  )}
                  {viewDetailsPayout.method === "transferencia" && (
                    <>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div>
                          <span className="block text-[9px] font-bold text-gray-400 uppercase">Banco</span>
                          <span className="font-bold text-gray-800 text-xs">{viewDetailsPayout.payment_details?.bank_name}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-gray-400 uppercase">Cédula / RIF</span>
                          <span className="font-bold text-gray-800 text-xs font-mono">{viewDetailsPayout.payment_details?.dni}</span>
                        </div>
                      </div>
                      <div className="mt-1">
                        <span className="block text-[9px] font-bold text-gray-400 uppercase">Número de Cuenta</span>
                        <span className="font-bold text-gray-800 text-xs font-mono block bg-white p-2 rounded-lg border border-gray-100 text-center tracking-wider mt-1 select-all">{viewDetailsPayout.payment_details?.account_number}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-gray-400 uppercase">Nombre del Titular</span>
                        <span className="font-bold text-gray-800 text-xs">{viewDetailsPayout.payment_details?.holder_name}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Status & Receipt capture details */}
              <div className="pt-3 border-t border-gray-100 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase">Estado actual:</span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                    viewDetailsPayout.status === "completed" ? "bg-green-50 text-green-700 border-green-100" :
                    viewDetailsPayout.status === "rejected" ? "bg-red-50 text-red-700 border-red-100" :
                    "bg-yellow-50 text-yellow-700 border-yellow-100"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      viewDetailsPayout.status === "completed" ? "bg-green-500" :
                      viewDetailsPayout.status === "rejected" ? "bg-red-500" :
                      "bg-yellow-500"
                    }`} />
                    {viewDetailsPayout.status === "completed" ? "Procesado" :
                     viewDetailsPayout.status === "rejected" ? "Rechazado" :
                     "En Proceso"}
                  </span>
                </div>

                {viewDetailsPayout.payment_details?.processed_at && (
                  <div className="text-xs text-gray-500 font-medium">
                    Liquidado el: <span className="font-bold text-gray-700">{formatDate(viewDetailsPayout.payment_details.processed_at)}</span>
                  </div>
                )}

                {viewDetailsPayout.payment_details?.receipt_url && (
                  <div className="p-3.5 bg-purple-50 border border-purple-100 rounded-2xl flex flex-col gap-2 shadow-sm mt-1">
                    <span className="text-[10px] font-bold text-[#6b1e96] uppercase tracking-wider block">📸 Comprobante de Transferencia</span>
                    <a
                      href={viewDetailsPayout.payment_details.receipt_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 w-full py-2 bg-[#6b1e96] hover:bg-[#6b1e96]/95 text-white font-bold text-xs rounded-xl shadow transition-colors"
                    >
                      <span>📄 Ver captura de transacción</span>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button onClick={() => setViewDetailsPayout(null)} className="px-5 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200/50 rounded-xl transition-all">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
