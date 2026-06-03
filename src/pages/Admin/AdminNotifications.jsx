import { useState, useEffect, useCallback } from "react";
import {
  getAdminNotifTemplatesAPI,
  updateAdminNotifTemplateAPI,
  getAdminNotifStatsAPI,
  sendAdminNotifAPI,
} from "../../services/api";
import toast from "react-hot-toast";

export default function AdminNotifications() {
  const [templates, setTemplates] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("stats");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [sendForm, setSendForm] = useState({ title: "", message: "", user_id: "" });
  const [sending, setSending] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [templatesRes, statsRes] = await Promise.all([
        getAdminNotifTemplatesAPI(),
        getAdminNotifStatsAPI(),
      ]);
      if (templatesRes.data?.success) setTemplates(templatesRes.data.data);
      if (statsRes.data?.success) setStats(statsRes.data.data);
    } catch {
      toast.error("Error cargando datos de notificaciones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEditTemplate = (template) => {
    setEditingId(template.id);
    setEditForm({
      title_template: template.title_template,
      message_template: template.message_template,
      channels: template.channels,
      is_active: template.is_active,
    });
  };

  const handleSaveTemplate = async (templateId) => {
    try {
      await updateAdminNotifTemplateAPI(templateId, editForm);
      toast.success("Template actualizado");
      setEditingId(null);
      fetchData();
    } catch {
      toast.error("Error actualizando template");
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!sendForm.title.trim() || !sendForm.message.trim()) {
      toast.error("Título y mensaje son obligatorios");
      return;
    }
    setSending(true);
    try {
      const payload = {
        title: sendForm.title.trim(),
        message: sendForm.message.trim(),
        channel: sendForm.channel || "in_app",
      };
      if (sendForm.user_id?.trim()) {
        payload.user_id = sendForm.user_id.trim();
      }
      const { data } = await sendAdminNotifAPI(payload);
      if (data?.success) {
        toast.success(data.message);
        setSendForm({ title: "", message: "", user_id: "", channel: "in_app" });
        fetchData();
      }
    } catch {
      toast.error("Error enviando notificación");
    } finally {
      setSending(false);
    }
  };

  const TABS = [
    { key: "stats", label: "Estadísticas", icon: "analytics" },
    { key: "templates", label: "Templates", icon: "description" },
    { key: "send", label: "Enviar Manual", icon: "send" },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 24px", color: "#9ca3af" }}>
        <span className="material-symbols-outlined" style={{ fontSize: "40px", display: "block", marginBottom: "12px" }}>
          hourglass_top
        </span>
        Cargando...
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#1a1a2e", margin: "0 0 24px" }}>
        🔔 Centro de Notificaciones
      </h1>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 18px",
              borderRadius: "10px",
              border: activeTab === tab.key ? "1px solid #6b1e96" : "1px solid #e5e7eb",
              background: activeTab === tab.key ? "linear-gradient(135deg, #6b1e96, #531575)" : "#fff",
              color: activeTab === tab.key ? "#fff" : "#727785",
              fontSize: "13px",
              fontWeight: activeTab === tab.key ? 600 : 400,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Stats Tab ── */}
      {activeTab === "stats" && stats && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "28px" }}>
            {[
              { label: "Total enviadas", value: stats.total, icon: "notifications", color: "#6b1e96" },
              { label: "Sin leer", value: stats.unread, icon: "mark_email_unread", color: "#f59e0b" },
              { label: "Últimas 24h", value: stats.last24h, icon: "schedule", color: "#10b981" },
              { label: "Tasa lectura", value: `${stats.readRate}%`, icon: "done_all", color: "#3b82f6" },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  background: "#fff",
                  borderRadius: "14px",
                  padding: "20px",
                  boxShadow: "0 2px 12px rgba(107,30,150,0.06)",
                  borderLeft: `4px solid ${stat.color}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "20px", color: stat.color }}>{stat.icon}</span>
                  <span style={{ fontSize: "12px", color: "#727785" }}>{stat.label}</span>
                </div>
                <div style={{ fontSize: "28px", fontWeight: 700, color: "#1a1a2e" }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Top Types */}
          {stats.topTypes?.length > 0 && (
            <div style={{ background: "#fff", borderRadius: "14px", padding: "24px", boxShadow: "0 2px 12px rgba(107,30,150,0.06)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#1a1a2e", margin: "0 0 16px" }}>
                Tipos más frecuentes
              </h3>
              {stats.topTypes.map((item) => (
                <div key={item.type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ fontSize: "13px", color: "#4a4a5a", fontFamily: "monospace" }}>{item.type}</span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#6b1e96", background: "#f3e8ff", padding: "2px 10px", borderRadius: "20px" }}>
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Templates Tab ── */}
      {activeTab === "templates" && (
        <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 12px rgba(107,30,150,0.06)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: "#727785", fontWeight: 500 }}>Tipo</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: "#727785", fontWeight: 500 }}>Título</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: "#727785", fontWeight: 500 }}>Canal</th>
                  <th style={{ textAlign: "center", padding: "10px 12px", color: "#727785", fontWeight: 500 }}>Activo</th>
                  <th style={{ textAlign: "center", padding: "10px 12px", color: "#727785", fontWeight: 500 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: "12px", color: "#6b1e96" }}>{t.type}</td>
                    <td style={{ padding: "10px 12px" }}>
                      {editingId === t.id ? (
                        <input
                          type="text"
                          value={editForm.title_template}
                          onChange={(e) => setEditForm({ ...editForm, title_template: e.target.value })}
                          style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px" }}
                        />
                      ) : (
                        t.title_template
                      )}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {editingId === t.id ? (
                        <select
                          value={editForm.channels}
                          onChange={(e) => setEditForm({ ...editForm, channels: e.target.value })}
                          style={{ padding: "6px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "12px" }}
                        >
                          <option value="in_app">In-App</option>
                          <option value="email">Email</option>
                          <option value="both">Ambos</option>
                        </select>
                      ) : (
                        <span style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "3px 8px",
                          borderRadius: "20px",
                          background: t.channels === "both" ? "#dcfce7" : t.channels === "email" ? "#dbeafe" : "#f3e8ff",
                          color: t.channels === "both" ? "#15803d" : t.channels === "email" ? "#1d4ed8" : "#6b1e96",
                        }}>
                          {t.channels === "both" ? "App + Email" : t.channels === "email" ? "Email" : "In-App"}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: "center", padding: "10px 12px" }}>
                      {editingId === t.id ? (
                        <input
                          type="checkbox"
                          checked={editForm.is_active}
                          onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                        />
                      ) : (
                        <span style={{ color: t.is_active ? "#10b981" : "#ef4444", fontSize: "16px" }}>
                          {t.is_active ? "●" : "●"}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: "center", padding: "10px 12px" }}>
                      {editingId === t.id ? (
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          <button
                            onClick={() => handleSaveTemplate(t.id)}
                            style={{ padding: "4px 12px", borderRadius: "6px", border: "none", background: "#6b1e96", color: "#fff", fontSize: "12px", cursor: "pointer" }}
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            style={{ padding: "4px 12px", borderRadius: "6px", border: "1px solid #d1d5db", background: "#fff", color: "#666", fontSize: "12px", cursor: "pointer" }}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditTemplate(t)}
                          style={{ padding: "4px 12px", borderRadius: "6px", border: "1px solid #d1d5db", background: "#fff", color: "#6b1e96", fontSize: "12px", cursor: "pointer" }}
                        >
                          Editar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Send Manual Tab ── */}
      {activeTab === "send" && (
        <div style={{ background: "#fff", borderRadius: "14px", padding: "28px", boxShadow: "0 2px 12px rgba(107,30,150,0.06)", maxWidth: "600px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#1a1a2e", margin: "0 0 20px" }}>
            Enviar Notificación Manual
          </h3>
          <form onSubmit={handleSendNotification}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#4a4a5a", marginBottom: "6px" }}>
                User ID <span style={{ color: "#9ca3af", fontWeight: 400 }}>(dejar vacío = broadcast a todos)</span>
              </label>
              <input
                type="text"
                value={sendForm.user_id}
                onChange={(e) => setSendForm({ ...sendForm, user_id: e.target.value })}
                placeholder="UUID del usuario (opcional)"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #d1d5db", fontSize: "14px", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#4a4a5a", marginBottom: "6px" }}>
                Canal de envío *
              </label>
              <select
                value={sendForm.channel || "in_app"}
                onChange={(e) => setSendForm({ ...sendForm, channel: e.target.value })}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #d1d5db", fontSize: "14px", boxSizing: "border-box", background: "#fff" }}
              >
                <option value="in_app">Solo App</option>
                <option value="email">Solo Correo</option>
                <option value="both">Ambos (App y Correo)</option>
              </select>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#4a4a5a", marginBottom: "6px" }}>
                Título *
              </label>
              <input
                type="text"
                value={sendForm.title}
                onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })}
                placeholder="Ej: Mantenimiento programado"
                required
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #d1d5db", fontSize: "14px", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#4a4a5a", marginBottom: "6px" }}>
                Mensaje *
              </label>
              <textarea
                value={sendForm.message}
                onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })}
                placeholder="Escribe el mensaje de la notificación..."
                required
                rows={4}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #d1d5db", fontSize: "14px", resize: "vertical", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                type="submit"
                disabled={sending}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 24px",
                  borderRadius: "10px",
                  border: "none",
                  background: sending ? "#d1d5db" : "linear-gradient(135deg, #6b1e96, #531575)",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: sending ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  {sending ? "hourglass_top" : sendForm.user_id ? "send" : "campaign"}
                </span>
                {sending ? "Enviando..." : sendForm.user_id ? "Enviar a usuario" : "Enviar a todos"}
              </button>

              {!sendForm.user_id && (
                <span style={{ fontSize: "12px", color: "#f59e0b", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>warning</span>
                  Se enviará a todos los usuarios registrados
                </span>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
