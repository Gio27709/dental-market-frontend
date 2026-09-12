import { useState } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { exportDentistExcelAPI } from "../../services/api";

export default function ExportReportButtons({ containerId = "profitability-container" }) {
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleExportExcel = async () => {
    try {
      setDownloadingExcel(true);
      const res = await exportDentistExcelAPI();
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Reporte_Contable_Clinica_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Reporte Excel descargado correctamente.");
    } catch (err) {
      console.error("Error descargando Excel:", err);
      toast.error("No se pudo descargar el reporte Excel.");
    } finally {
      setDownloadingExcel(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setDownloadingPdf(true);
      const input = document.getElementById(containerId);
      if (!input) {
        toast.error("No se pudo capturar la pantalla para el PDF.");
        return;
      }

      const canvas = await html2canvas(input, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Informe_Financiero_Clinica_${Date.now()}.pdf`);
      toast.success("Informe PDF generado correctamente.");
    } catch (err) {
      console.error("Error generando PDF:", err);
      toast.error("Error al generar el documento PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    // En móvil: dos botones a lo ancho, con la etiqueta corta.
    <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-3 w-full sm:w-auto">
      <button
        onClick={handleExportExcel}
        disabled={downloadingExcel}
        className="flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-2.5 bg-[#006d37] hover:bg-[#005228] text-white rounded-2xl font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[18px]">table_chart</span>
        {downloadingExcel ? (
          <span>Generando...</span>
        ) : (
          <>
            <span className="sm:hidden">Excel</span>
            <span className="hidden sm:inline">Descargar Excel Contable (.xlsx)</span>
          </>
        )}
      </button>

      <button
        onClick={handleExportPdf}
        disabled={downloadingPdf}
        className="flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-2.5 bg-[#541a97] hover:bg-[#6c38b0] text-white rounded-2xl font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
        {downloadingPdf ? (
          <span>Generando...</span>
        ) : (
          <>
            <span className="sm:hidden">PDF</span>
            <span className="hidden sm:inline">Exportar Informe PDF</span>
          </>
        )}
      </button>
    </div>
  );
}

ExportReportButtons.propTypes = {
  containerId: PropTypes.string,
};
