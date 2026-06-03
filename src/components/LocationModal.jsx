import { useState, useEffect } from "react";
import { VENEZUELA_STATES } from "../utils/venezuelaStates";
import { useLocationContext } from "../hooks/useLocationContext";
import { checkGeolocationSupport } from "../services/geolocationService";
import PropTypes from "prop-types";

/**
 * LocationModal — Modal de ubicación con detección automática GPS + selección manual.
 * 
 * Estados del modal:
 * 1. "welcome"   → Pantalla inicial con opciones auto/manual
 * 2. "detecting"  → Buscando ubicación GPS (spinner)
 * 3. "detected"   → Ubicación encontrada, confirmar
 * 4. "error"      → Error en detección, ofrece manual
 * 5. "manual"     → Grid de 24 estados para elegir
 */
export default function LocationModal({ isOpen, onClose }) {
  const {
    buyerState,
    isDetecting,
    detectionError,
    detectedState,
    detectLocation,
    confirmDetectedLocation,
    setManualLocation,
    dismissPrompt,
    clearLocation,
    resetDetection,
  } = useLocationContext();

  const [view, setView] = useState("welcome"); // welcome | detecting | detected | error | manual
  const [searchFilter, setSearchFilter] = useState("");

  // Sincronizar pantalla cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      if (buyerState) {
        setView("manual");
      } else {
        setView("welcome");
      }
      resetDetection();
      setSearchFilter("");
    }
  }, [isOpen, buyerState, resetDetection]);

  if (!isOpen) return null;

  const geoSupported = checkGeolocationSupport();

  // ─── Handlers ───

  const handleAutoDetect = async () => {
    setView("detecting");
    const result = await detectLocation();
    if (result.success) {
      setView("detected");
    } else {
      setView("error");
    }
  };

  const handleConfirmDetected = () => {
    confirmDetectedLocation();
    onClose();
  };

  const handleManualSelect = (stateName) => {
    setManualLocation(stateName);
    onClose();
  };

  const handleDismiss = () => {
    dismissPrompt();
    onClose();
  };

  const handleClearLocation = () => {
    clearLocation();
    onClose();
  };

  const handleGoToManual = () => {
    resetDetection();
    setView("manual");
  };

  const handleRetryDetection = () => {
    resetDetection();
    handleAutoDetect();
  };

  const handleClose = () => {
    onClose();
  };

  // Filtrar estados por búsqueda
  const filteredStates = VENEZUELA_STATES.filter(name =>
    name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[1000] flex justify-center items-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal Box */}
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden z-[1001] flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* ══════════════════════════════════════════════ */}
        {/* VIEW: WELCOME — Pantalla inicial              */}
        {/* ══════════════════════════════════════════════ */}
        {view === "welcome" && (
          <>
            {/* Header con gradiente */}
            <div className="bg-gradient-to-br from-[#6b1e96] to-[#531575] px-6 py-8 text-center text-white relative overflow-hidden">
              {/* Decoración de fondo */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white" />
                <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white" />
              </div>
              
              <div className="relative z-10">
                {/* Ícono de ubicación */}
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center ring-4 ring-white/10">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[#c3ff00]">
                    <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
                  </svg>
                </div>

                <h3 className="text-xl font-bold mb-2">
                  ¿Dónde te encuentras?
                </h3>
                <p className="text-sm text-white/80 leading-relaxed max-w-xs mx-auto">
                  Detectar tu ubicación nos ayuda a mostrarte vendedores cercanos y calcular envíos más rápidos.
                </p>
              </div>
            </div>

            {/* Opciones */}
            <div className="p-6 space-y-3">
              {/* Botón Auto-detectar (principal) */}
              {geoSupported && (
                <button
                  onClick={handleAutoDetect}
                  className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-[#6b1e96] hover:bg-[#531575] text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-[#6b1e96]/25 hover:shadow-[#6b1e96]/40 active:scale-[0.98]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
                  </svg>
                  Detectar automáticamente
                </button>
              )}

              {/* Botón Manual (secundario) */}
              <button
                onClick={handleGoToManual}
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl font-medium text-sm transition-all duration-200 active:scale-[0.98]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
                Elegir estado manualmente
              </button>

              {/* Link sutil "No ahora" */}
              <button
                onClick={handleDismiss}
                className="w-full text-center text-xs text-gray-400 hover:text-gray-600 py-2 transition-colors"
              >
                No ahora
              </button>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* VIEW: DETECTING — Buscando GPS                */}
        {/* ══════════════════════════════════════════════ */}
        {view === "detecting" && (
          <div className="p-8 text-center">
            {/* Spinner animado */}
            <div className="relative w-20 h-20 mx-auto mb-6">
              {/* Anillo exterior pulsante */}
              <div className="absolute inset-0 rounded-full border-4 border-[#6b1e96]/20 animate-ping" />
              {/* Anillo spinner */}
              <div className="absolute inset-0 rounded-full border-4 border-gray-200 border-t-[#6b1e96] animate-spin" />
              {/* Ícono centro */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-[#6b1e96]">
                  <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Detectando ubicación...
            </h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Si tu navegador te pide permiso, haz clic en <strong>&quot;Permitir&quot;</strong> para detectar tu estado automáticamente.
            </p>

            <button
              onClick={handleClose}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* VIEW: DETECTED — Ubicación encontrada         */}
        {/* ══════════════════════════════════════════════ */}
        {view === "detected" && detectedState && (
          <div className="p-8 text-center">
            {/* Ícono de éxito */}
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-emerald-50 flex items-center justify-center ring-4 ring-emerald-100">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-emerald-500">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-1">
              ¡Ubicación detectada!
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Detectamos que estás en:
            </p>

            {/* Estado detectado (destacado) */}
            <div className="inline-flex items-center gap-2 px-5 py-3 bg-[#6b1e96]/5 border-2 border-[#6b1e96]/20 rounded-xl mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#6b1e96]">
                <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
              </svg>
              <span className="text-lg font-bold text-[#6b1e96]">
                {detectedState}
              </span>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3">
              <button
                onClick={handleGoToManual}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm transition-all active:scale-[0.98]"
              >
                Cambiar
              </button>
              <button
                onClick={handleConfirmDetected}
                className="flex-1 px-4 py-3 bg-[#6b1e96] hover:bg-[#531575] text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-[#6b1e96]/25 active:scale-[0.98]"
              >
                ✓ Confirmar
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* VIEW: ERROR — Error en detección GPS           */}
        {/* ══════════════════════════════════════════════ */}
        {view === "error" && (
          <div className="p-8 text-center">
            {/* Ícono de error */}
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-amber-50 flex items-center justify-center ring-4 ring-amber-100">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-amber-500">
                <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">
              No se pudo detectar tu ubicación
            </h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              {detectionError?.message || "Ocurrió un error inesperado. Puedes elegir tu estado manualmente."}
            </p>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={handleRetryDetection}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm transition-all active:scale-[0.98]"
              >
                Reintentar
              </button>
              <button
                onClick={handleGoToManual}
                className="flex-1 px-4 py-3 bg-[#6b1e96] hover:bg-[#531575] text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-[#6b1e96]/25 active:scale-[0.98]"
              >
                Elegir manualmente
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* VIEW: MANUAL — Grid de estados                */}
        {/* ══════════════════════════════════════════════ */}
        {view === "manual" && (
          <>
            {/* Header */}
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setView("welcome")}
                  className="p-1 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <h3 className="font-bold text-gray-900 m-0">Elige tu estado</h3>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Barra de búsqueda */}
            <div className="px-5 pt-4 pb-2">
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Buscar estado..."
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/30 focus:border-[#6b1e96] transition-all"
                  autoFocus
                />
              </div>

              {/* Botón rápido: usar GPS */}
              {geoSupported && (
                <button
                  onClick={handleAutoDetect}
                  className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-[#6b1e96] bg-[#6b1e96]/5 hover:bg-[#6b1e96]/10 rounded-lg font-medium transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                    <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
                  </svg>
                  O usar mi GPS para detectar automáticamente
                </button>
              )}
            </div>

            {/* Grid de estados (scrollable) */}
            <div className="px-5 pb-5 flex-1 overflow-y-auto max-h-[45vh]">
              <div className="grid grid-cols-2 gap-2">
                {filteredStates.map((stateName) => (
                  <button
                    key={stateName}
                    onClick={() => handleManualSelect(stateName)}
                    className={`text-left px-3 py-2.5 text-sm rounded-xl border transition-all duration-150 active:scale-[0.97] ${
                      buyerState === stateName
                        ? "border-[#6b1e96] bg-[#6b1e96]/5 text-[#6b1e96] font-semibold shadow-sm"
                        : "border-gray-200 hover:border-[#6b1e96]/40 hover:bg-[#6b1e96]/5 text-gray-700"
                    }`}
                  >
                    {stateName}
                  </button>
                ))}
              </div>

              {filteredStates.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No se encontró ningún estado con &quot;{searchFilter}&quot;
                </div>
              )}

              {/* Footer del manual */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                {buyerState && (
                  <button
                    onClick={handleClearLocation}
                    className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
                  >
                    Borrar ubicación
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="text-sm bg-gray-900 text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium ml-auto"
                >
                  Listo
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

LocationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
