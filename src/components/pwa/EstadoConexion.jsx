import { useEffect, useState } from "react";

// Aviso cuando se pierde internet. Con la app instalada la pantalla abre igual sin conexión,
// pero precios, pedidos y pagos necesitan red: mejor decirlo que dejar errores sueltos.

export default function EstadoConexion() {
  const [enLinea, setEnLinea] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [recuperada, setRecuperada] = useState(false);

  useEffect(() => {
    let temporizador;
    const alConectar = () => {
      setEnLinea(true);
      setRecuperada(true);
      temporizador = setTimeout(() => setRecuperada(false), 3000);
    };
    const alDesconectar = () => {
      clearTimeout(temporizador);
      setRecuperada(false);
      setEnLinea(false);
    };
    window.addEventListener("online", alConectar);
    window.addEventListener("offline", alDesconectar);
    return () => {
      clearTimeout(temporizador);
      window.removeEventListener("online", alConectar);
      window.removeEventListener("offline", alDesconectar);
    };
  }, []);

  if (enLinea && !recuperada) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-0 top-0 z-[1050] px-4 py-2 text-center text-[13px] font-semibold text-white shadow-md ${enLinea ? "bg-[#4f7d33]" : "bg-[#33243d]"}`}
      style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
    >
      {enLinea ? "Conexión recuperada" : "Sin conexión a internet. Precios, pedidos y pagos se actualizarán cuando vuelva la señal."}
    </div>
  );
}
