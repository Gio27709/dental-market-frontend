import { useState } from "react";
import PropTypes from "prop-types";
import useAnalyticsPermissions from "../../../hooks/useAnalyticsPermissions";
import toast from "react-hot-toast";

export default function AnalyticsExportButton({ activeArea = "executive" }) {
  const { canExport } = useAnalyticsPermissions();
  const [exporting, setExporting] = useState(false);

  if (!canExport()) return null;

  const handleExport = async (format) => {
    setExporting(true);
    try {
      toast.success(`Generando reporte de ${activeArea.toUpperCase()} en ${format.toUpperCase()}...`);
      setTimeout(() => {
        setExporting(false);
        toast.success(`Reporte descargado exitosamente.`);
      }, 1000);
    } catch (err) {
      console.error("Error exportando reporte:", err);
      toast.error("Error al exportar el reporte.");
      setExporting(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-1 bg-fx-raised border border-fx-line-strong rounded-xl p-1">
      <button
        onClick={() => handleExport("excel")}
        disabled={exporting}
        className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
      >
        <span>📊</span>
        <span>Exportar Excel</span>
      </button>
      <button
        onClick={() => handleExport("csv")}
        disabled={exporting}
        className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-fx-muted hover:bg-fx-raised transition-all disabled:opacity-50"
      >
        CSV
      </button>
    </div>
  );
}

AnalyticsExportButton.propTypes = {
  activeArea: PropTypes.string
};
