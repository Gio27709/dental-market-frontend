import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  getNotificationPreferencesAPI,
  updateNotificationPreferencesAPI,
} from "../../services/api";

// Solo se listan las 5 categorías que el backend respeta de verdad
// (notificationService.js → shouldNotifyInApp). Las columnas email_* existen en la
// tabla pero ninguna ruta de envío las consulta, así que no se ofrecen aquí.
const CATEGORIES = [
  {
    key: "inapp_orders",
    icon: "receipt_long",
    label: "Pedidos",
    description: "Confirmaciones, cancelaciones, entregas y devoluciones.",
  },
  {
    key: "inapp_payments",
    icon: "payments",
    label: "Pagos",
    description: "Comprobantes subidos, aprobaciones y rechazos.",
  },
  {
    key: "inapp_shipping",
    icon: "local_shipping",
    label: "Envíos",
    description: "Despachos, repartidor en camino e incidencias de entrega.",
  },
  {
    key: "inapp_reviews",
    icon: "rate_review",
    label: "Reseñas y preguntas",
    description: "Nuevas reseñas, preguntas y respuestas en tus productos.",
  },
  {
    key: "inapp_promotions",
    icon: "campaign",
    label: "Promociones y comunidad",
    description: "Ofertas, carrito abandonado, alertas de inventario y publicaciones.",
  },
];

export default function NotificationPreferences() {
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getNotificationPreferencesAPI();
        if (res.data?.success) setPrefs(res.data.data);
      } catch (error) {
        console.error(error);
        toast.error("No se pudieron cargar tus preferencias.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleToggle = async (key) => {
    const previous = prefs;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setSaving(true);
    try {
      const payload = {};
      for (const c of CATEGORIES) payload[c.key] = next[c.key] !== false;
      await updateNotificationPreferencesAPI(payload);
    } catch (error) {
      console.error(error);
      setPrefs(previous);
      toast.error("No se pudo guardar el cambio.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 24px", color: "#9ca3af" }}>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: "40px", marginBottom: "12px", display: "block" }}
        >
          hourglass_top
        </span>
        <p style={{ fontSize: "14px", margin: 0 }}>Cargando preferencias...</p>
      </div>
    );
  }

  if (!prefs) {
    return (
      <div style={{ textAlign: "center", padding: "60px 24px" }}>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: "56px", color: "#d1d5db", marginBottom: "12px", display: "block" }}
        >
          tune
        </span>
        <p style={{ fontSize: "13px", color: "#9ca3af", margin: 0 }}>
          No pudimos cargar tus preferencias. Vuelve a intentarlo más tarde.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "8px" }}>
      <p
        style={{
          fontSize: "13px",
          color: "#727785",
          margin: "12px 16px 4px",
          lineHeight: 1.5,
        }}
      >
        Elige qué avisos quieres recibir dentro de la plataforma. Los cambios se guardan solos.
      </p>

      {CATEGORIES.map((cat, index) => {
        const enabled = prefs[cat.key] !== false;
        return (
          <div
            key={cat.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "16px",
              borderTop: index === 0 ? "none" : "1px solid #f0f0f5",
            }}
          >
            <div
              style={{
                width: "38px",
                height: "38px",
                flexShrink: 0,
                borderRadius: "10px",
                background: enabled ? "#f3e8ff" : "#f4f4f6",
                color: enabled ? "#6b1e96" : "#9ca3af",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                {cat.icon}
              </span>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#1a1a2e", margin: 0 }}>
                {cat.label}
              </h3>
              <p style={{ fontSize: "12px", color: "#9ca3af", margin: "2px 0 0" }}>
                {cat.description}
              </p>
            </div>

            <button
              role="switch"
              aria-checked={enabled}
              aria-label={cat.label}
              onClick={() => handleToggle(cat.key)}
              disabled={saving}
              style={{
                width: "44px",
                height: "24px",
                flexShrink: 0,
                borderRadius: "999px",
                border: "none",
                padding: "2px",
                background: enabled ? "#6b1e96" : "#d1d5db",
                cursor: saving ? "wait" : "pointer",
                opacity: saving ? 0.6 : 1,
                display: "flex",
                justifyContent: enabled ? "flex-end" : "flex-start",
                alignItems: "center",
                transition: "all 0.2s",
              }}
            >
              <span
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "#ffffff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  display: "block",
                }}
              />
            </button>
          </div>
        );
      })}

      <p
        style={{
          fontSize: "12px",
          color: "#9ca3af",
          margin: "8px 16px 12px",
          lineHeight: 1.5,
        }}
      >
        Los avisos de seguridad de la cuenta siempre se envían y no se pueden desactivar.
      </p>
    </div>
  );
}
