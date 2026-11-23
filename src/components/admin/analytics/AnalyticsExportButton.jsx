import PropTypes from "prop-types";
import useAnalyticsPermissions from "../../../hooks/useAnalyticsPermissions";
import toast from "react-hot-toast";

/**
 * Exporta a CSV los datos que la pestaña tiene cargados (mismo período y filtros que se ven).
 *
 * Antes este botón no exportaba nada: enseñaba «Generando reporte…» y a los 1 s «Reporte
 * descargado exitosamente» sin descargar ningún archivo. Ahora recibe el payload de la pestaña
 * (`data`) y lo vuelca: primero los valores sueltos (KPIs) como «métrica, valor» y después cada
 * tabla (arreglo de filas) como una sección con sus columnas. Sin `data` el botón no se muestra:
 * mejor no ofrecerlo que fingir una descarga.
 */
const celda = (v) => {
  if (v === null || v === undefined) return "";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const aCsv = (data) => {
  const sueltos = [];
  const tablas = [];
  const recorrer = (obj, ruta) => {
    for (const [k, v] of Object.entries(obj || {})) {
      const nombre = ruta ? `${ruta}.${k}` : k;
      if (Array.isArray(v)) {
        if (v.length && v.every((x) => x && typeof x === "object" && !Array.isArray(x))) tablas.push([nombre, v]);
        else sueltos.push([nombre, v.join(" | ")]);
      } else if (v && typeof v === "object") {
        recorrer(v, nombre);
      } else {
        sueltos.push([nombre, v]);
      }
    }
  };
  recorrer(data, "");

  const lineas = ["Métrica,Valor", ...sueltos.map(([k, v]) => `${celda(k)},${celda(v)}`)];
  for (const [nombre, filas] of tablas) {
    const cols = [...new Set(filas.flatMap((f) => Object.keys(f)))];
    lineas.push("", celda(nombre), cols.map(celda).join(","));
    for (const f of filas) lineas.push(cols.map((c) => celda(f[c])).join(","));
  }
  return lineas.join("\n");
};

export default function AnalyticsExportButton({ activeArea = "executive", period = "", data }) {
  const { canExport } = useAnalyticsPermissions();

  if (!canExport() || !data) return null;

  const handleExport = () => {
    try {
      const blob = new Blob([`\ufeff${aCsv(data)}`], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `forcepx-analiticas-${activeArea}${period ? `-${period}` : ""}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exportando reporte:", err);
      toast.error("Error al exportar el reporte.");
    }
  };

  return (
    <button
      onClick={handleExport}
      title="Descarga en CSV los datos de esta pestaña con el período y los filtros actuales"
      className="inline-flex items-center gap-1.5 px-3 py-2 bg-fx-raised border border-fx-line-strong rounded-xl text-xs font-bold text-fx-pos hover:bg-fx-pos/20 transition-all"
    >
      <span>Exportar CSV</span>
    </button>
  );
}

AnalyticsExportButton.propTypes = {
  activeArea: PropTypes.string,
  period: PropTypes.string,
  data: PropTypes.object
};
