import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "react-hot-toast";

// Pin propio con divIcon: los PNG por defecto de Leaflet no resuelven bien con Vite.
const pinIcon = L.divIcon({
  className: "",
  html: `
    <svg width="36" height="36" viewBox="0 0 24 24" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.35));">
      <path fill="#6b1e96" stroke="#ffffff" stroke-width="1.2"
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="2.6" fill="#c3ff00"/>
    </svg>`,
  iconSize: [36, 36],
  iconAnchor: [18, 34],
});

const VENEZUELA_CENTER = [7.1, -66.0];

/**
 * Mapa con pin arrastrable (Leaflet + OpenStreetMap, sin API key).
 * - Clic en el mapa o arrastrar el pin fija la ubicación.
 * - Botón GPS centra en la posición del dispositivo y coloca el pin.
 *
 * Props:
 *   value    {lat, lng} | null — ubicación actual (controlada desde fuera)
 *   onChange (lat, lng) => void — se dispara al fijar/mover el pin
 *   height   alto CSS del mapa (default "280px")
 */
export default function MapAddressPicker({ value, onChange, height = "280px" }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [locating, setLocating] = useState(false);

  const hasValue = typeof value?.lat === "number" && typeof value?.lng === "number";

  const placeMarker = (lat, lng, { notify = true, pan = false, zoom = null } = {}) => {
    const map = mapRef.current;
    if (!map) return;
    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(map);
      markerRef.current.on("dragend", () => {
        const p = markerRef.current.getLatLng();
        onChangeRef.current?.(p.lat, p.lng);
      });
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }
    if (pan) map.setView([lat, lng], zoom ?? Math.max(map.getZoom(), 16));
    if (notify) onChangeRef.current?.(lat, lng);
  };

  // Inicialización única del mapa
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: hasValue ? [value.lat, value.lng] : VENEZUELA_CENTER,
      zoom: hasValue ? 16 : 6,
      scrollWheelZoom: false, // no secuestrar el scroll de la página; zoom con doble clic/botones
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    map.on("click", (e) => placeMarker(e.latlng.lat, e.latlng.lng));
    mapRef.current = map;
    if (hasValue) placeMarker(value.lat, value.lng, { notify: false });
    // El contenedor puede montarse dentro de layouts que aún están midiendo
    setTimeout(() => map.invalidateSize(), 150);
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincronizar cambios de valor externos (ej. perfil que carga async tras montar)
  useEffect(() => {
    if (!mapRef.current || !hasValue) return;
    const current = markerRef.current?.getLatLng();
    const same = current && Math.abs(current.lat - value.lat) < 1e-9 && Math.abs(current.lng - value.lng) < 1e-9;
    if (!same) placeMarker(value.lat, value.lng, { notify: false, pan: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.lat, value?.lng]);

  const handleGps = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Tu navegador no soporta geolocalización.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        placeMarker(pos.coords.latitude, pos.coords.longitude, { pan: true, zoom: 17 });
        toast.success("Ubicación fijada. Ajusta el pin si hace falta.");
      },
      () => {
        setLocating(false);
        toast.error("No pudimos obtener tu GPS. Coloca el pin tocando el mapa.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl ring-1 ring-slate-900/10" style={{ height }}>
      <div ref={containerRef} className="w-full h-full" style={{ zIndex: 0 }} />
      <button
        type="button"
        onClick={handleGps}
        disabled={locating}
        className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-800 text-xs font-bold rounded-xl shadow-md ring-1 ring-slate-900/10 transition-colors"
        style={{ zIndex: 1000 }}
      >
        {locating ? (
          <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
        ) : (
          <span className="material-symbols-outlined text-[16px] text-[#6b1e96]">my_location</span>
        )}
        Usar mi ubicación
      </button>
      {!hasValue && (
        <div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900/80 text-white text-[11px] font-semibold rounded-full pointer-events-none"
          style={{ zIndex: 1000 }}
        >
          Toca el mapa para colocar el pin
        </div>
      )}
    </div>
  );
}
