import { useState } from "react";
import { useLocation } from "react-router-dom";
import useAccionInstalar from "./useAccionInstalar";

// Aviso «Instala la app» en el móvil, debajo del encabezado de la tienda pública (no flota: no
// tapa el carrito ni los botones de la esquina). Se oculta 30 días al cerrarlo o al instalar, y
// no aparece donde estorba (pago, inicio de sesión, registro).

const CLAVE = "forcepx_banner_app_oculto_hasta";
const DIAS_OCULTO = 30;
const OCULTO_EN = ["/checkout", "/order-success", "/login", "/register"];

function ocultoPorAhora() {
  try {
    return Number(localStorage.getItem(CLAVE) || 0) > Date.now();
  } catch {
    return false;
  }
}

function ocultar() {
  try {
    localStorage.setItem(CLAVE, String(Date.now() + DIAS_OCULTO * 24 * 60 * 60 * 1000));
  } catch {
    /* sin localStorage: vuelve a salir en la próxima visita */
  }
}

export default function BannerInstalarApp() {
  const { pathname } = useLocation();
  const { disponible, accion, dialogo } = useAccionInstalar();
  const [cerrado, setCerrado] = useState(ocultoPorAhora);

  if (!disponible || cerrado || OCULTO_EN.some((p) => pathname.startsWith(p))) return dialogo;

  const cerrar = () => {
    ocultar();
    setCerrado(true);
  };

  return (
    <>
      <div className="md:hidden border-b border-[#e6daf5] bg-[#f6f0fc]">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <img src="/icons/logo-192.png" alt="" className="h-9 w-9 shrink-0 rounded-lg" />
          <p className="min-w-0 flex-1 text-[13px] leading-tight text-fx-text">
            <strong className="block text-[#531575]">Instala la app de Forcepx</strong>
            Ábrela desde tu pantalla de inicio, más rápido.
          </p>
          <button
            type="button"
            onClick={async () => {
              const resultado = await accion();
              if (resultado === "accepted") cerrar();
            }}
            className="shrink-0 rounded-full bg-[#6b1e96] px-3.5 py-1.5 text-[13px] font-semibold text-white active:scale-95"
          >
            Instalar
          </button>
          <button type="button" onClick={cerrar} aria-label="Cerrar el aviso de instalar la app" className="shrink-0 rounded-full p-1 text-fx-faint hover:text-fx-muted">
            <span className="material-symbols-outlined text-[20px] leading-none" aria-hidden="true">close</span>
          </button>
        </div>
      </div>
      {dialogo}
    </>
  );
}
