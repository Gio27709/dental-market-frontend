import { useState, useRef } from "react";
import PropTypes from "prop-types";
import { getBulkImportTemplateAPI, validateBulkImportAPI, bulkImportProductsAPI } from "../../services/api";
import { toast } from "react-hot-toast";

const BulkImportWizard = ({ isOpen, onClose, onSuccess, onGoToMissingImages }) => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validationReport, setValidationReport] = useState(null);
  const [importReport, setImportReport] = useState(null);
  
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = async () => {
    try {
      const response = await getBulkImportTemplateAPI();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "plantilla_importacion.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Plantilla descargada con éxito");
    } catch (error) {
      console.error(error);
      toast.error("Error al descargar la plantilla.");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile) => {
    if (!selectedFile.name.endsWith(".xlsx")) {
      toast.error("Por favor, sube únicamente archivos Excel (.xlsx) generados a partir de nuestra plantilla.");
      return;
    }
    setFile(selectedFile);
    setValidationReport(null);
    setImportReport(null);
    // Auto-advance to validation dry-run
    runDryRunValidation(selectedFile);
  };

  const runDryRunValidation = async (selectedFile) => {
    setIsValidating(true);
    setStep(3); // Go to step 3 preview
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await validateBulkImportAPI(formData);
      if (response.data?.success) {
        setValidationReport(response.data.report);
      } else {
        toast.error("No se pudo validar el archivo.");
        setStep(2); // return to upload step
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Error al validar el archivo. Comprueba el formato de la plantilla.");
      setStep(2);
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await bulkImportProductsAPI(formData);
      if (response.data?.success) {
        setImportReport(response.data.report);
        toast.success("Importación masiva completada.");
        if (onSuccess && response.data.report?.success > 0) {
          onSuccess(); // refresh parent products list
        }
        setStep(4); // Advance to results
      } else {
        toast.error("Ocurrió un problema durante la carga.");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Error al importar el archivo.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setValidationReport(null);
    setImportReport(null);
    setStep(1);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleGoToImages = () => {
    if (onGoToMissingImages) {
      onGoToMissingImages();
    }
    handleClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(10, 5, 20, 0.6)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px"
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "28px",
          width: "100%",
          maxWidth: "850px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          position: "relative",
          animation: "slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          overflow: "hidden"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>
          {`
            @keyframes slideIn {
              from { transform: translateY(30px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}
        </style>

        {/* ── HEADER & STEPPER ── */}
        <div style={{ padding: "24px 32px 16px 32px", borderBottom: "1px solid #f3f4f6", background: "linear-gradient(135deg, #faf9fe, #fff)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#1a0a2e", margin: 0 }}>
                Asistente de Importación Masiva
              </h2>
              <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 0 0" }}>
                Sube tu inventario a la tienda de forma rápida y segura en 4 pasos.
              </p>
            </div>
            <button
              onClick={handleClose}
              style={{
                background: "#f3f4f6",
                border: "none",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#6b7280",
                fontSize: "14px",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#e5e7eb"; e.currentTarget.style.color = "#1a0a2e"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#f3f4f6"; e.currentTarget.style.color = "#6b7280"; }}
            >
              ✕
            </button>
          </div>

          {/* Stepper progress */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", padding: "0 10px" }}>
            <div style={{ position: "absolute", left: "20px", right: "20px", top: "18px", height: "3px", backgroundColor: "#e5e7eb", zIndex: 1 }} />
            <div style={{ position: "absolute", left: "20px", width: step === 1 ? "0%" : step === 2 ? "33%" : step === 3 ? "66%" : "100%", top: "18px", height: "3px", backgroundColor: "#6b1e96", zIndex: 2, transition: "width 0.3s ease" }} />

            {[
              { num: 1, label: "Descargar plantilla" },
              { num: 2, label: "Subir Excel" },
              { num: 3, label: "Validación & Preview" },
              { num: 4, label: "Importación" }
            ].map((s) => {
              const isActive = step >= s.num;
              const isCurrent = step === s.num;
              return (
                <div key={s.num} style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 3, position: "relative", width: "80px" }}>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      backgroundColor: isCurrent ? "#6b1e96" : isActive ? "#8b5cf6" : "#fff",
                      border: `3px solid ${isActive ? "#6b1e96" : "#e5e7eb"}`,
                      color: isActive && !isCurrent ? "#fff" : isActive ? "#c3ff00" : "#9ca3af",
                      fontWeight: 700,
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.3s ease",
                      boxShadow: isCurrent ? "0 0 12px rgba(107,30,150,0.3)" : "none"
                    }}
                  >
                    {isActive && s.num < step ? "✓" : s.num}
                  </div>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: isCurrent || (isActive && s.num < step) ? 700 : 500,
                      color: isActive ? "#1a0a2e" : "#9ca3af",
                      textAlign: "center",
                      marginTop: "6px",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── CONTENT BODY ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "32px", minHeight: "250px", display: "flex", flexDirection: "column" }}>
          
          {/* STEP 1: DOWNLOAD TEMPLATE & INSTRUCTIONS */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", animation: "fadeIn 0.2s ease" }}>
              <div style={{ display: "flex", gap: "24px", alignItems: "flex-start", background: "rgba(107,30,150,0.03)", border: "1px solid rgba(107,30,150,0.08)", padding: "24px", borderRadius: "16px" }}>
                <div style={{ fontSize: "40px" }}>📥</div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: 700, color: "#6b1e96" }}>Descarga la Plantilla Excel Oficial</h4>
                  <p style={{ margin: 0, fontSize: "13.5px", color: "#4b5563", lineHeight: 1.6 }}>
                    Para subir tus productos masivamente, debes llenar la plantilla estructurada. 
                    Nuestra plantilla cuenta con **dropdowns de validación integrados** para las columnas de 
                    Categorías y Marcas que te evitarán errores al escribir.
                  </p>
                  <button
                    onClick={handleDownloadTemplate}
                    style={{
                      marginTop: "16px",
                      padding: "10px 20px",
                      background: "linear-gradient(135deg, #531575, #6b1e96)",
                      color: "#c3ff00",
                      border: "none",
                      borderRadius: "10px",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      boxShadow: "0 4px 12px rgba(107,30,150,0.2)",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    <span>Descargar Plantilla (.xlsx)</span>
                  </button>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#1a0a2e", margin: "12px 0 12px 0" }}>📋 Instrucciones Críticas de Llenado:</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {[
                    { title: "Variaciones de Productos", text: "Para crear variaciones (ej: diferentes colores o tallas) de un mismo producto, repite exactamente el mismo 'Nombre' en filas consecutivas." },
                    { title: "Categorías y Marcas", text: "Usa el menú desplegable en Excel para seleccionar la categoría y marca. Si no coinciden con la base de datos, la fila dará error." },
                    { title: "Modificadores de Precio", text: "Si una variación es más costosa, especifica el incremento en 'Modificador de precio' (ej. 5.50 para sumarle 5.50$ al precio base)." },
                    { title: "Estado Inicial", text: "Todos los productos subidos quedarán en modo 'Borrador' y desactivados hasta que edites el producto y añadas su imagen correspondiente." }
                  ].map((inst, idx) => (
                    <div key={idx} style={{ background: "#f9fafb", padding: "14px", borderRadius: "12px", border: "1px solid #f0f0f0" }}>
                      <h5 style={{ margin: "0 0 4px 0", fontSize: "12px", fontWeight: 700, color: "#1a0a2e" }}>{inst.title}</h5>
                      <p style={{ margin: 0, fontSize: "11.5px", color: "#6b7280", lineHeight: 1.5 }}>{inst.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
                <button
                  onClick={() => setStep(2)}
                  style={{
                    padding: "12px 28px",
                    background: "#f3f4f6",
                    color: "#1a0a2e",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#e5e7eb"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
                >
                  Entendido, ir a Cargar Archivo ➔
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: UPLOAD FILE AREA */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", flex: 1, animation: "fadeIn 0.2s ease" }}>
              <input
                type="file"
                accept=".xlsx"
                ref={fileInputRef}
                onChange={handleFileInput}
                style={{ display: "none" }}
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
                style={{
                  flex: 1,
                  border: `2px dashed ${isDragging ? '#6b1e96' : '#d1d5db'}`,
                  background: isDragging ? 'rgba(107,30,150,0.02)' : '#fafafa',
                  borderRadius: "20px",
                  padding: "50px 30px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6b1e96"; }}
                onMouseLeave={(e) => { if(!isDragging) e.currentTarget.style.borderColor = "#d1d5db"; }}
              >
                <div style={{ fontSize: "50px", marginBottom: "16px" }}>📁</div>
                <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: 700, color: "#1a0a2e" }}>
                  Haz clic o arrastra tu archivo Excel aquí
                </h3>
                <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#6b7280" }}>
                  Soporta únicamente archivos de formato Excel (.xlsx)
                </p>
                <div style={{ display: "inline-flex", padding: "6px 12px", background: "rgba(107,30,150,0.06)", color: "#6b1e96", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>
                  Máximo 500 productos por archivo
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    padding: "12px 20px",
                    background: "transparent",
                    color: "#6b7280",
                    border: "none",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer"
                  }}
                >
                  ⌥ Ver Instrucciones
                </button>
                <button
                  onClick={handleClose}
                  style={{
                    padding: "12px 24px",
                    background: "#f3f4f6",
                    color: "#4b5563",
                    border: "none",
                    borderRadius: "12px",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer"
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & DRY-RUN REPORT */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", flex: 1, animation: "fadeIn 0.2s ease" }}>
              {isValidating ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0" }}>
                  <div style={{ width: "40px", height: "40px", border: "4px solid rgba(107,30,150,0.15)", borderTopColor: "#6b1e96", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "16px" }} />
                  <h4 style={{ margin: "0 0 6px 0", fontSize: "15px", fontWeight: 700, color: "#1a0a2e" }}>Analizando y Validando Plantilla...</h4>
                  <p style={{ margin: 0, fontSize: "12.5px", color: "#6b7280" }}>Buscando inconsistencias de datos, SKU duplicados y formatos numéricos.</p>
                </div>
              ) : validationReport ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
                  
                  {/* Summary row */}
                  <div style={{ display: "flex", gap: "16px" }}>
                    <div style={{ flex: 1.5, background: "linear-gradient(135deg, #1a0a2e, #2d1248)", padding: "16px 20px", borderRadius: "16px", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Resumen del Análisis</div>
                      <div style={{ fontSize: "22px", fontWeight: 800, marginTop: "6px", color: "#c3ff00" }}>
                        {validationReport.productsCount} Productos <span style={{ fontSize: "14px", fontWeight: 500, color: "#fff" }}>({validationReport.variationsCount} variaciones)</span>
                      </div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>
                        Se creará un registro base por cada nombre único.
                      </div>
                    </div>
                    
                    <div style={{ flex: 1, background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "16px", borderRadius: "16px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      <div style={{ fontSize: "11px", color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>Filas Válidas</div>
                      <div style={{ fontSize: "28px", fontWeight: 800, color: "#15803d" }}>{validationReport.validRowsCount}</div>
                      <div style={{ fontSize: "10.5px", color: "#166534", marginTop: "2px" }}>Listas para importar</div>
                    </div>

                    <div style={{ flex: 1, background: validationReport.invalidRowsCount > 0 ? "#fef2f2" : "#f8fafc", border: `1px solid ${validationReport.invalidRowsCount > 0 ? '#fecaca' : '#e2e8f0'}`, padding: "16px", borderRadius: "16px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      <div style={{ fontSize: "11px", color: validationReport.invalidRowsCount > 0 ? "#991b1b" : "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Filas con Error</div>
                      <div style={{ fontSize: "28px", fontWeight: 800, color: validationReport.invalidRowsCount > 0 ? "#b91c1c" : "#475569" }}>{validationReport.invalidRowsCount}</div>
                      <div style={{ fontSize: "10.5px", color: validationReport.invalidRowsCount > 0 ? "#991b1b" : "#64748b", marginTop: "2px" }}>
                        {validationReport.invalidRowsCount > 0 ? "Requieren corrección" : "Todo correcto"}
                      </div>
                    </div>
                  </div>

                  {/* Warning Alert if errors exist */}
                  {validationReport.invalidRowsCount > 0 && (
                    <div style={{ display: "flex", gap: "12px", background: "#fffbeb", border: "1px solid #fef08a", padding: "14px 18px", borderRadius: "12px", alignItems: "center" }}>
                      <span style={{ fontSize: "20px" }}>⚠️</span>
                      <p style={{ margin: 0, fontSize: "12px", color: "#854d0e", lineHeight: 1.5 }}>
                        **Nota**: Los productos que posean errores en alguna de sus variaciones **serán omitidos por completo** durante la importación para evitar crear registros corruptos en tu catálogo. Te sugerimos descargar la plantilla corregida o continuar importando sólo los correctos.
                      </p>
                    </div>
                  )}

                  {/* Preview Table */}
                  <div style={{ flex: 1, minHeight: "180px", border: "1px solid #e5e7eb", borderRadius: "14px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "70px 180px 140px 100px 100px 1fr", gap: "10px", padding: "10px 16px", background: "#f8fafc", borderBottom: "1px solid #e5e7eb", fontSize: "11px", fontWeight: 700, color: "#4b5563", textTransform: "uppercase" }}>
                      <span>Fila</span>
                      <span>Nombre</span>
                      <span>Categoría</span>
                      <span>Precio Base</span>
                      <span>Estado</span>
                      <span>Errores / Observaciones</span>
                    </div>

                    <div style={{ flex: 1, overflowY: "auto", maxHeight: "200px" }}>
                      {validationReport.rows.map((rowReport, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "70px 180px 140px 100px 100px 1fr",
                            gap: "10px",
                            padding: "10px 16px",
                            borderBottom: idx < validationReport.rows.length - 1 ? "1px solid #f3f4f6" : "none",
                            alignItems: "center",
                            fontSize: "12.5px",
                            background: rowReport.isValid ? "transparent" : "#fff5f5"
                          }}
                        >
                          <span style={{ fontWeight: 600, color: "#6b7280" }}>#{rowReport.rowNumber}</span>
                          <span style={{ fontWeight: 700, color: "#1a0a2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={rowReport.data.name}>
                            {rowReport.data.name || "—"}
                          </span>
                          <span style={{ color: "#4b5563", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={rowReport.data.category_name}>
                            {rowReport.data.category_name || "—"}
                          </span>
                          <span style={{ fontWeight: 600, color: "#059669" }}>
                            {rowReport.data.price ? `$${rowReport.data.price.toFixed(2)}` : "—"}
                          </span>
                          <span>
                            {rowReport.isValid ? (
                              <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#16a34a", background: "#dcfce7", padding: "2px 8px", borderRadius: "12px" }}>✓ Válido</span>
                            ) : (
                              <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#dc2626", background: "#fee2e2", padding: "2px 8px", borderRadius: "12px" }}>✗ Error</span>
                            )}
                          </span>
                          <span style={{ fontSize: "11px", color: rowReport.isValid ? "#6b7280" : "#b91c1c", fontWeight: rowReport.isValid ? 500 : 600 }}>
                            {rowReport.isValid ? "Válido y listo" : rowReport.errors.join(" | ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div style={{ display: "flex", justifyContext: "space-between", gap: "12px", marginTop: "8px" }}>
                    <button
                      onClick={() => setStep(2)}
                      style={{
                        padding: "12px 20px",
                        background: "#fff",
                        color: "#4b5563",
                        border: "1px solid #d1d5db",
                        borderRadius: "12px",
                        fontWeight: 600,
                        fontSize: "13px",
                        cursor: "pointer"
                      }}
                    >
                      ⇠ Subir otro archivo
                    </button>
                    
                    <div style={{ flex: 1 }} />

                    <button
                      onClick={handleImport}
                      disabled={validationReport.validRowsCount === 0 || isImporting}
                      style={{
                        padding: "12px 28px",
                        background: validationReport.validRowsCount === 0 ? "#e5e7eb" : "linear-gradient(135deg, #531575, #6b1e96)",
                        color: validationReport.validRowsCount === 0 ? "#9ca3af" : "#c3ff00",
                        border: "none",
                        borderRadius: "12px",
                        fontWeight: 700,
                        fontSize: "13px",
                        cursor: validationReport.validRowsCount === 0 || isImporting ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        boxShadow: validationReport.validRowsCount > 0 ? "0 4px 15px rgba(107,30,150,0.2)" : "none"
                      }}
                    >
                      {isImporting ? (
                        <>
                          <div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                          Procesando...
                        </>
                      ) : (
                        `Importar ${validationReport.productsCount - (validationReport.rows.filter(r=>!r.isValid).reduce((acc,curr)=>{if(curr.data.name) acc.add(curr.data.name.toLowerCase().trim()); return acc;}, new Set()).size)} Productos Válidos`
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <p style={{ color: "#ef4444" }}>Ocurrió un error inesperado al mostrar el reporte.</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: SUCCESS & POST-IMPORT ACTIONS */}
          {step === 4 && importReport && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px", alignItems: "center", padding: "10px 40px", textAlign: "center", animation: "fadeIn 0.2s ease" }}>
              <div style={{ fontSize: "64px", filter: "drop-shadow(0 4px 10px rgba(16,185,129,0.2))" }}>🎉</div>
              <div>
                <h3 style={{ margin: "0 0 6px 0", fontSize: "20px", fontWeight: 800, color: "#10b981" }}>
                  ¡Procesamiento Completado!
                </h3>
                <p style={{ margin: 0, fontSize: "14px", color: "#4b5563" }}>
                  Se han insertado correctamente los productos válidos en la base de datos de tu tienda.
                </p>
              </div>

              {/* Statistics cards */}
              <div style={{ display: "flex", gap: "16px", width: "100%", maxWidth: "450px", margin: "8px 0" }}>
                <div style={{ flex: 1, background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "14px", borderRadius: "12px" }}>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: "#16a34a" }}>{importReport.success}</div>
                  <div style={{ fontSize: "11px", color: "#166534", fontWeight: 600, marginTop: "2px" }}>Productos Creados</div>
                </div>
                <div style={{ flex: 1, background: importReport.failed > 0 ? "#fef2f2" : "#f8fafc", border: `1px solid ${importReport.failed > 0 ? '#fecaca' : '#e2e8f0'}`, padding: "14px", borderRadius: "12px" }}>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: importReport.failed > 0 ? "#dc2626" : "#6b7280" }}>{importReport.failed}</div>
                  <div style={{ fontSize: "11px", color: importReport.failed > 0 ? "#991b1b" : "#6b7280", fontWeight: 600, marginTop: "2px" }}>Omitidos/Fallidos</div>
                </div>
              </div>

              {/* Detailed import errors if any */}
              {importReport.errors?.length > 0 && (
                <div style={{ width: "100%", maxWidth: "600px", background: "#fdf2f2", border: "1px solid #fde2e2", borderRadius: "12px", padding: "12px 16px", textAlign: "left" }}>
                  <h5 style={{ margin: "0 0 6px 0", fontSize: "12px", color: "#991b1b", fontWeight: 700 }}>Detalles de Omisiones/Errores ({importReport.errors.length}):</h5>
                  <div style={{ maxHeight: "90px", overflowY: "auto", fontSize: "11px", color: "#7f1d1d", lineHeight: 1.5 }}>
                    <ul style={{ margin: 0, paddingLeft: "16px" }}>
                      {importReport.errors.slice(0, 20).map((err, idx) => (
                        <li key={idx} style={{ marginBottom: "2px" }}>{err}</li>
                      ))}
                      {importReport.errors.length > 20 && <li>... y {importReport.errors.length - 20} omisiones adicionales.</li>}
                    </ul>
                  </div>
                </div>
              )}

              {/* CTA Alert */}
              <div style={{ background: "rgba(107,30,150,0.03)", border: "1px dashed rgba(107,30,150,0.2)", borderRadius: "16px", padding: "16px 20px", display: "flex", gap: "14px", alignItems: "flex-start", textAlign: "left", width: "100%" }}>
                <span style={{ fontSize: "24px" }}>📸</span>
                <div>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "13.5px", fontWeight: 700, color: "#1a0a2e" }}>¡Siguiente paso obligatorio: Carga de imágenes!</h4>
                  <p style={{ margin: 0, fontSize: "12.5px", color: "#6b7280", lineHeight: 1.5 }}>
                    Los productos importados han sido creados en modo **Borrador (inactivos)** porque no tienen imágenes asociadas. No aparecerán en el buscador de los odontólogos hasta que subas al menos una foto.
                  </p>
                </div>
              </div>

              {/* Action button CTAs */}
              <div style={{ display: "flex", gap: "12px", width: "100%", justifyContent: "center", marginTop: "10px" }}>
                <button
                  onClick={handleReset}
                  style={{
                    padding: "12px 24px",
                    background: "#f3f4f6",
                    color: "#4b5563",
                    border: "none",
                    borderRadius: "12px",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer"
                  }}
                >
                  Subir otro archivo Excel
                </button>
                <button
                  onClick={handleGoToImages}
                  style={{
                    padding: "12px 28px",
                    background: "linear-gradient(135deg, #531575, #6b1e96)",
                    color: "#c3ff00",
                    border: "none",
                    borderRadius: "12px",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                    boxShadow: "0 4px 15px rgba(107,30,150,0.3)"
                  }}
                >
                  Ir a Adjuntar Imágenes ➔
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

BulkImportWizard.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onGoToMissingImages: PropTypes.func
};

export default BulkImportWizard;
