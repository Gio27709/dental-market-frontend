import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import toast from "react-hot-toast";

export default function AccountPassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }

    try {
      setIsUpdating(true);

      // 1. Obtener usuario autenticado actual
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) {
        throw new Error("No se pudo obtener el usuario autenticado.");
      }

      // 2. Verificar si el método de inicio de sesión es por email/password (y no OAuth social)
      const isEmailUser = user.app_metadata?.provider === "email";

      if (isEmailUser) {
        if (!currentPassword) {
          toast.error("Por favor ingresa tu contraseña actual para continuar.");
          setIsUpdating(false);
          return;
        }

        // Re-autenticación silenciosa: intentamos iniciar sesión con la clave actual
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

        if (authError) {
          throw new Error("La contraseña actual es incorrecta.");
        }
      }

      // 3. Proceder con el cambio a la nueva contraseña
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      
      if (updateErr) {
        throw updateErr;
      }

      toast.success("Contraseña actualizada con éxito.");
      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Hubo un error al actualizar la contraseña.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#191c23" }}>
          Seguridad y Contraseña
        </h1>
        <p className="text-sm mt-1" style={{ color: "#727785" }}>
          Mantén tu cuenta protegida usando una contraseña segura.
        </p>
      </div>

      <div className="rounded-2xl p-6 lg:p-8" style={{ background: "#ffffff", boxShadow: "0 4px 24px rgba(107,30,150,0.04)" }}>
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#f3e8ff", color: "#6b1e96" }}>
            <span className="material-symbols-outlined text-[24px]">lock</span>
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: "#191c23" }}>Cambiar Contraseña</h2>
            <p className="text-sm" style={{ color: "#727785" }}>Establece una nueva contraseña para iniciar sesión en Dentix.</p>
          </div>
        </div>

        <form onSubmit={handleUpdatePassword} className="max-w-md space-y-5">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
              Contraseña Actual
            </label>
            <div className="relative">
              <input
                type="password"
                required
                className="w-full pl-4 pr-10 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 focus:ring-2 focus:ring-[#6b1e96]/30"
                style={{ background: "#f9f9ff", color: "#191c23", border: "1px solid rgba(0,0,0,0.06)" }}
                placeholder="Ingresa tu contraseña actual"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 select-none text-[20px]">
                lock_open
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
              Nueva Contraseña
            </label>
            <div className="relative">
              <input
                type="password"
                required
                className="w-full pl-4 pr-10 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 focus:ring-2 focus:ring-[#6b1e96]/30"
                style={{ background: "#f9f9ff", color: "#191c23", border: "1px solid rgba(0,0,0,0.06)" }}
                placeholder="Ingresa la nueva contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 select-none text-[20px]">
                password
              </span>
            </div>
            <p className="text-[11px] mt-1.5" style={{ color: "#9ca3af" }}>Mínimo 6 caracteres.</p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
              Confirmar Nueva Contraseña
            </label>
            <div className="relative">
              <input
                type="password"
                required
                className="w-full pl-4 pr-10 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 focus:ring-2 focus:ring-[#6b1e96]/30 bg-white"
                style={{ background: "#f9f9ff", color: "#191c23", border: "1px solid rgba(0,0,0,0.06)" }}
                placeholder="Repite la nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 select-none text-[20px]">
                password
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isUpdating}
              className="w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ background: "#6b1e96" }}
            >
              {isUpdating ? "Actualizando..." : "Actualizar Contraseña"}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
