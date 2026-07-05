import { useState, useEffect } from "react";
import {
  getMyPaymentMethodsAPI,
  createPaymentMethodAPI,
  updatePaymentMethodAPI,
  deletePaymentMethodAPI,
  setDefaultPaymentMethodAPI,
} from "../../services/api";
import toast from "react-hot-toast";

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

export default function PaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [methodType, setMethodType] = useState("pago_movil"); // pago_movil, transferencia, zelle
  const [label, setLabel] = useState("");
  const [bank, setBank] = useState("");
  const [ci, setCi] = useState("");
  const [phone, setPhone] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [holder, setHolder] = useState("");
  const [accountType, setAccountType] = useState("corriente");
  const [email, setEmail] = useState("");

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const res = await getMyPaymentMethodsAPI();
      if (res.data && res.data.success) {
        setPaymentMethods(res.data.data || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar los métodos de pago.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const openAddModal = () => {
    setEditingMethod(null);
    setMethodType("pago_movil");
    setLabel("");
    setBank("");
    setCi("");
    setPhone("");
    setAccountNumber("");
    setHolder("");
    setAccountType("corriente");
    setEmail("");
    setIsModalOpen(true);
  };

  const openEditModal = (pm) => {
    setEditingMethod(pm);
    setMethodType(pm.method_type);
    setLabel(pm.label);
    setBank(pm.bank || "");
    setCi(pm.ci || "");
    setPhone(pm.phone || "");
    setAccountNumber(pm.account_number || "");
    setHolder(pm.holder || "");
    setAccountType(pm.account_type || "corriente");
    setEmail(pm.email || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!label.trim()) return toast.error("La etiqueta es requerida.");

    // Dynamic validation
    if (methodType === "pago_movil") {
      if (!bank) return toast.error("El banco es requerido.");
      if (!ci.trim()) return toast.error("La cédula/RIF es requerida.");
      if (!phone.trim()) return toast.error("El teléfono es requerido.");
      if (!/^\d+$/.test(phone.replace(/[\s-]/g, ""))) return toast.error("El teléfono debe contener solo números.");
    } else if (methodType === "transferencia") {
      if (!bank) return toast.error("El banco es requerido.");
      if (!ci.trim()) return toast.error("La cédula/RIF es requerida.");
      if (!accountNumber.trim()) return toast.error("El número de cuenta es requerido.");
      if (accountNumber.replace(/[\s-]/g, "").length !== 20) {
        return toast.error("El número de cuenta debe tener exactamente 20 dígitos.");
      }
      if (!holder.trim()) return toast.error("El titular es requerido.");
    } else if (methodType === "zelle") {
      if (!email.trim()) return toast.error("El correo de Zelle es requerido.");
      if (!holder.trim()) return toast.error("El titular es requerido.");
    }

    const payload = {
      method_type: methodType,
      label: label.trim(),
      bank: methodType !== "zelle" ? bank : null,
      ci: methodType !== "zelle" ? ci.trim() : null,
      phone: methodType === "pago_movil" ? phone.trim() : null,
      account_number: methodType === "transferencia" ? accountNumber.trim() : null,
      holder: methodType !== "pago_movil" ? holder.trim() : (methodType === "pago_movil" ? label.trim() : null), // For Pago móvil, we can default holder to label
      account_type: methodType === "transferencia" ? accountType : null,
      email: methodType === "zelle" ? email.trim() : null,
    };

    // For Pago móvil we set a placeholder holder just in case backend expects it, or pass the cleaned title
    if (methodType === "pago_movil") {
      payload.holder = label.trim();
    }

    try {
      setSubmitting(true);
      if (editingMethod) {
        const res = await updatePaymentMethodAPI(editingMethod.id, payload);
        if (res.data && res.data.success) {
          toast.success("Método de pago actualizado exitosamente.");
          setIsModalOpen(false);
          fetchPaymentMethods();
        }
      } else {
        const res = await createPaymentMethodAPI(payload);
        if (res.data && res.data.success) {
          toast.success("Método de pago agregado exitosamente.");
          setIsModalOpen(false);
          fetchPaymentMethods();
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Error al procesar el método de pago.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este método de pago?")) return;
    try {
      const res = await deletePaymentMethodAPI(id);
      if (res.data && res.data.success) {
        toast.success("Método de pago eliminado exitosamente.");
        fetchPaymentMethods();
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar el método de pago.");
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const res = await setDefaultPaymentMethodAPI(id);
      if (res.data && res.data.success) {
        toast.success("Método de pago establecido como predeterminado.");
        fetchPaymentMethods();
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al cambiar el método predeterminado.");
    }
  };

  // Mask sensitive data for display
  const maskValue = (val, type) => {
    if (!val) return "";
    if (type === "phone") {
      const clean = val.replace(/[\s-]/g, "");
      return `${clean.substring(0, 4)}***${clean.substring(clean.length - 4)}`;
    }
    if (type === "ci") {
      return `V-***${val.substring(val.length - 4)}`;
    }
    if (type === "account") {
      const clean = val.replace(/[\s-]/g, "");
      return `**** **** **** **** ${clean.substring(clean.length - 4)}`;
    }
    if (type === "email") {
      const parts = val.split("@");
      if (parts.length === 2) {
        return `${parts[0].substring(0, 2)}***@${parts[1]}`;
      }
    }
    return val;
  };

  const getBankName = (code) => {
    const found = VENEZUELAN_BANKS.find((b) => b.code === code);
    return found ? found.name : code;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#191c23" }}>
            Métodos de Pago
          </h1>
          <p className="text-sm mt-1" style={{ color: "#727785" }}>
            Gestiona tus cuentas de retiro para recibir pagos y liquidaciones de tu billetera Forcepx.
          </p>
        </div>
        <div>
          <button
            onClick={openAddModal}
            disabled={paymentMethods.length >= 5}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            style={{ background: "#6b1e96" }}
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Agregar Método
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 rounded-xl text-xs flex items-start gap-3 border" style={{ background: "#f9f9ff", borderColor: "#6b1e96/10", color: "#6b1e96" }}>
        <span className="material-symbols-outlined text-[20px] mt-0.5">info</span>
        <div>
          <span className="font-extrabold block mb-0.5">Liquidación de Fondos</span>
          Estos métodos de pago se utilizarán para liquidar el saldo disponible en tu Billetera cuando solicites un retiro. Por favor, asegúrate de que todos los datos sean correctos.
        </div>
      </div>

      {loading ? (
        // Skeletons
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="rounded-2xl p-6 h-48 animate-pulse border border-slate-100 bg-white"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-200" />
                <div className="h-5 w-24 bg-slate-200 rounded" />
              </div>
              <div className="space-y-2.5">
                <div className="h-4 w-full bg-slate-200 rounded" />
                <div className="h-4 w-5/6 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : paymentMethods.length === 0 ? (
        // Empty state
        <div
          className="rounded-2xl p-12 text-center border border-dashed border-gray-200 flex flex-col items-center justify-center max-w-lg mx-auto mt-6"
          style={{ background: "#ffffff" }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "#f3e8ff", color: "#6b1e96" }}>
            <span className="material-symbols-outlined text-[32px]">credit_card</span>
          </div>
          <h3 className="text-lg font-bold mb-2" style={{ color: "#191c23" }}>No tienes métodos de pago</h3>
          <p className="text-sm mb-6 max-w-sm" style={{ color: "#727785" }}>
            Agrega tu Pago Móvil, cuenta de Transferencia Bancaria o Zelle para recibir tus retiros de forma rápida y segura.
          </p>
          <button
            onClick={openAddModal}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-sm hover:shadow-md cursor-pointer"
            style={{ background: "#6b1e96" }}
          >
            Agregar mi primer método
          </button>
        </div>
      ) : (
        // Grid of Payment Cards
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paymentMethods.map((pm) => {
            const isDefault = pm.is_default;
            return (
              <div
                key={pm.id}
                className={`rounded-2xl p-6 border transition-all duration-300 relative flex flex-col justify-between ${
                  isDefault ? "shadow-md" : "hover:shadow-xs"
                }`}
                style={{
                  background: "#ffffff",
                  borderColor: isDefault ? "#6b1e96" : "rgba(0,0,0,0.06)",
                  borderWidth: isDefault ? "2px" : "1px",
                }}
              >
                {isDefault && (
                  <span
                    className="absolute -top-3 left-6 px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full text-white shadow-sm"
                    style={{ background: "#6b1e96" }}
                  >
                    Predeterminado
                  </span>
                )}

                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                        style={{
                          background: isDefault ? "#6b1e96" : "#f3e8ff",
                          color: isDefault ? "#ffffff" : "#6b1e96",
                        }}
                      >
                        {pm.method_type === "pago_movil" ? "📱" : pm.method_type === "transferencia" ? "🏦" : "💵"}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm" style={{ color: "#191c23" }}>
                          {pm.label}
                        </h3>
                        <span className="text-[10px] uppercase font-bold text-gray-400">
                          {pm.method_type === "pago_movil" ? "Pago Móvil" : pm.method_type === "transferencia" ? "Transferencia" : "Zelle"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="space-y-1.5 text-xs text-slate-600 font-medium bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
                    {pm.method_type === "pago_movil" && (
                      <>
                        <p><span className="text-gray-400 font-semibold">Banco:</span> {getBankName(pm.bank)}</p>
                        <p><span className="text-gray-400 font-semibold">CI/RIF:</span> {maskValue(pm.ci, "ci")}</p>
                        <p><span className="text-gray-400 font-semibold">Teléfono:</span> {maskValue(pm.phone, "phone")}</p>
                      </>
                    )}
                    {pm.method_type === "transferencia" && (
                      <>
                        <p className="truncate"><span className="text-gray-400 font-semibold">Banco:</span> {pm.bank}</p>
                        <p className="font-mono text-[11px] tracking-wide"><span className="text-gray-400 font-semibold font-sans">Cuenta:</span> {maskValue(pm.account_number, "account")}</p>
                        <p className="truncate"><span className="text-gray-400 font-semibold">Titular:</span> {pm.holder}</p>
                        <p><span className="text-gray-400 font-semibold">CI/RIF:</span> {maskValue(pm.ci, "ci")}</p>
                        <p><span className="text-gray-400 font-semibold">Tipo:</span> {pm.account_type === "corriente" ? "Corriente" : "Ahorro"}</p>
                      </>
                    )}
                    {pm.method_type === "zelle" && (
                      <>
                        <p className="truncate"><span className="text-gray-400 font-semibold">Correo:</span> {maskValue(pm.email, "email")}</p>
                        <p className="truncate"><span className="text-gray-400 font-semibold">Titular:</span> {pm.holder}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(pm)}
                      className="text-xs font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      style={{ color: "#6b1e96" }}
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(pm.id)}
                      className="text-xs font-bold hover:underline flex items-center gap-1 text-red-500 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                      Eliminar
                    </button>
                  </div>

                  {!isDefault && (
                    <button
                      onClick={() => handleSetDefault(pm.id)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border hover:bg-purple-50 transition-colors cursor-pointer"
                      style={{ color: "#6b1e96", borderColor: "#6b1e96" }}
                    >
                      Usar por defecto
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal - Add / Edit Payment Method */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-scale-in bg-white"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: "#191c23" }}>
                {editingMethod ? "Editar Método de Pago" : "Nuevo Método de Pago"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Method Type Selector */}
                {!editingMethod && (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
                      Tipo de Método *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "pago_movil", name: "Pago Móvil", icon: "📱" },
                        { id: "transferencia", name: "Transferencia", icon: "🏦" },
                        { id: "zelle", name: "Zelle", icon: "💵" },
                      ].map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setMethodType(type.id)}
                          className={`py-2.5 px-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all outline-none cursor-pointer ${
                            methodType === type.id
                              ? "bg-purple-50 border-[#6b1e96] text-[#6b1e96]"
                              : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          <span className="text-base">{type.icon}</span>
                          <span>{type.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Label */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
                    Nombre identificador / Etiqueta *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Mi Pago Móvil BDV, Retiro Cuenta Banesco..."
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="w-full pl-4 pr-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 focus:ring-2 focus:ring-[#6b1e96]/30 bg-slate-50 border border-slate-100 focus:border-[#6b1e96]"
                  />
                </div>

                {/* Pago Móvil Fields */}
                {methodType === "pago_movil" && (
                  <>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
                        Banco receptor *
                      </label>
                      <select
                        required
                        value={bank}
                        onChange={(e) => setBank(e.target.value)}
                        className="w-full pl-4 pr-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 focus:ring-2 focus:ring-[#6b1e96]/30 bg-slate-50 border border-slate-100 focus:border-[#6b1e96] appearance-none"
                      >
                        <option value="">Selecciona el banco...</option>
                        {VENEZUELAN_BANKS.map((b) => (
                          <option key={b.code} value={b.code}>
                            {b.code} - {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
                          Teléfono Pago Móvil *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: 04121234567"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-4 pr-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 focus:ring-2 focus:ring-[#6b1e96]/30 bg-slate-50 border border-slate-100 focus:border-[#6b1e96]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
                          Cédula / RIF del titular *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: V-12345678"
                          value={ci}
                          onChange={(e) => setCi(e.target.value)}
                          className="w-full pl-4 pr-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 focus:ring-2 focus:ring-[#6b1e96]/30 bg-slate-50 border border-slate-100 focus:border-[#6b1e96]"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Transferencia Fields */}
                {methodType === "transferencia" && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
                          Nombre del Banco *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: Banesco, Mercantil..."
                          value={bank}
                          onChange={(e) => setBank(e.target.value)}
                          className="w-full pl-4 pr-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 focus:ring-2 focus:ring-[#6b1e96]/30 bg-slate-50 border border-slate-100 focus:border-[#6b1e96]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
                          Cédula / RIF del titular *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: V-12345678 o J-123456789"
                          value={ci}
                          onChange={(e) => setCi(e.target.value)}
                          className="w-full pl-4 pr-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 focus:ring-2 focus:ring-[#6b1e96]/30 bg-slate-50 border border-slate-100 focus:border-[#6b1e96]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
                        Número de Cuenta (20 dígitos) *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={20}
                        placeholder="Ej: 01340105000000000000"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                        className="w-full pl-4 pr-4 py-3 rounded-xl font-mono text-sm font-medium outline-none transition-all duration-200 focus:ring-2 focus:ring-[#6b1e96]/30 bg-slate-50 border border-slate-100 focus:border-[#6b1e96] tracking-widest"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
                          Titular de la cuenta *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: Juan Pérez"
                          value={holder}
                          onChange={(e) => setHolder(e.target.value)}
                          className="w-full pl-4 pr-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 focus:ring-2 focus:ring-[#6b1e96]/30 bg-slate-50 border border-slate-100 focus:border-[#6b1e96]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
                          Tipo de Cuenta *
                        </label>
                        <select
                          required
                          value={accountType}
                          onChange={(e) => setAccountType(e.target.value)}
                          className="w-full pl-4 pr-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 focus:ring-2 focus:ring-[#6b1e96]/30 bg-slate-50 border border-slate-100 focus:border-[#6b1e96]"
                        >
                          <option value="corriente">Corriente</option>
                          <option value="ahorro">Ahorro</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* Zelle Fields */}
                {methodType === "zelle" && (
                  <>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
                        Correo registrado en Zelle *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="Ej: tuemail@zelle.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-4 pr-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 focus:ring-2 focus:ring-[#6b1e96]/30 bg-slate-50 border border-slate-100 focus:border-[#6b1e96]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
                        Nombre del titular *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: John Doe"
                        value={holder}
                        onChange={(e) => setHolder(e.target.value)}
                        className="w-full pl-4 pr-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 focus:ring-2 focus:ring-[#6b1e96]/30 bg-slate-50 border border-slate-100 focus:border-[#6b1e96]"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                  style={{ background: "#6b1e96" }}
                >
                  {submitting ? "Guardando..." : "Guardar Método"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
