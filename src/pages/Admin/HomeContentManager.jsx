import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { 
  getHomeSectionsAPI, 
  updateHomeSectionAPI, 
  toggleHomeSectionAPI,
  uploadHomeSectionImageAPI 
} from "../../services/api";
import toast from "react-hot-toast";

// ─── Reusable sub-components for visual editors ────────────────────────────
const SectionBox = ({ title, children }) => (
  <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg">
    <h3 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">
      <span className="w-1.5 h-1.5 bg-[#6b1e96] rounded-full"></span>{title}
    </h3>
    {children}
  </div>
);

SectionBox.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

const Field = ({ label, value, onChange, placeholder, type = "text", rows }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
    {type === "textarea" ? (
      <textarea
        rows={rows || 3}
        className="w-full border border-gray-300 p-2 rounded-md text-sm focus:ring-1 focus:ring-[#6b1e96] focus:border-[#6b1e96] outline-none"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    ) : (
      <input
        type={type}
        className="w-full border border-gray-300 p-2 rounded-md text-sm focus:ring-1 focus:ring-[#6b1e96] focus:border-[#6b1e96] outline-none"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    )}
  </div>
);

Field.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  type: PropTypes.string,
  rows: PropTypes.number,
};

const ImageField = ({ label, value, onChange }) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("image", file);
      const { data } = await uploadHomeSectionImageAPI(formData);
      if (data && data.success && data.data?.url) {
        onChange(data.data.url);
        toast.success("Imagen subida y asignada correctamente");
      }
    } catch {
      toast.error("Error al subir la imagen");
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <div className="flex gap-2 items-start">
        <input
          className="flex-1 border border-gray-300 p-2 rounded-md text-sm focus:ring-1 focus:ring-[#6b1e96] focus:border-[#6b1e96] outline-none font-mono text-xs"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
        />
        <label className={`bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 px-3 py-2 rounded-md cursor-pointer transition-colors flex-shrink-0 flex items-center justify-center ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
          {uploading ? (
            <span className="material-symbols-outlined text-sm animate-spin">sync</span>
          ) : (
            <span className="material-symbols-outlined text-sm" title="Subir Imagen desde PC">cloud_upload</span>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
        {value && (
          <img src={value} alt="" className="w-12 h-12 object-cover rounded border border-gray-200 flex-shrink-0" onError={(e) => { e.target.style.display = 'none'; }} />
        )}
      </div>
    </div>
  );
};

ImageField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

const AddButton = ({ onClick, text }) => (
  <button onClick={onClick} className="bg-[#6b1e96] text-white text-xs px-3 py-1.5 rounded-md hover:bg-[#531575] transition-colors flex items-center gap-1">
    <span className="material-symbols-outlined text-xs">add</span>{text}
  </button>
);

AddButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  text: PropTypes.string.isRequired,
};

const RemoveButton = ({ onClick }) => (
  <button onClick={onClick} className="bg-red-50 text-red-500 px-2 py-2 rounded-md border border-red-100 font-bold hover:bg-red-100 transition-colors flex-shrink-0 text-xs">
    <span className="material-symbols-outlined text-sm">delete</span>
  </button>
);

RemoveButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
export default function HomeContentManager() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState(null);
  const [jsonText, setJsonText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editorMode, setEditorMode] = useState("visual");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchSections(); }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const { data } = await getHomeSectionsAPI();
      if (data && data.success) {
        setSections(data.data);
        if (selectedSection) {
           const updated = data.data.find(s => s.section_key === selectedSection.section_key);
           if (updated) setSelectedSection(updated);
        }
      }
    } catch {
      toast.error("Error al cargar las secciones");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (sec) => {
    setSelectedSection(sec);
    setJsonText(JSON.stringify(sec.content, null, 2));
    setEditorMode("visual");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const parsedContent = JSON.parse(jsonText);
      await updateHomeSectionAPI(selectedSection.section_key, parsedContent);
      toast.success("Sección actualizada correctamente");
      
      localStorage.removeItem("dental_market_home_sections_cache");
      window.dispatchEvent(new Event("home_sections_updated"));
      
      fetchSections();
    } catch {
      toast.error("JSON inválido o error al guardar la sección");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (sectionKey) => {
    try {
      await toggleHomeSectionAPI(sectionKey);
      toast.success("Estado cambiado correctamente");
      
      localStorage.removeItem("dental_market_home_sections_cache");
      window.dispatchEvent(new Event("home_sections_updated"));
      
      fetchSections();
    } catch {
      toast.error("Error al cambiar estado");
    }
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("image", file);
      const { data } = await uploadHomeSectionImageAPI(formData);
      if (data && data.success) {
         toast.success("Imagen subida. URL copiada al portapapeles.");
         navigator.clipboard.writeText(data.data.url);
      }
    } catch {
      toast.error("Error al subir imagen");
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  // ─── VISUAL EDITOR ENGINE ───────────────────────────────────
  const renderVisualEditor = () => {
    let d = {};
    try { d = JSON.parse(jsonText); } catch { return <div className="p-4 text-red-500">JSON Inválido para modo visual. Corrige la sintaxis en la pestaña JSON.</div>; }
    
    const update = (newData) => setJsonText(JSON.stringify(newData, null, 2));
    const key = selectedSection?.section_key;

    // ━━━━━━━━━━━━━━━ HERO ━━━━━━━━━━━━━━━
    if (key === 'hero') {
      const cards = d.promo_cards || [];
      return (
        <div className="p-4 overflow-y-auto flex-1 space-y-5">
          <SectionBox title="Contenido Principal">
            <div className="space-y-3">
              <Field label="Badge" value={d.badge_text} onChange={v => update({...d, badge_text: v})} placeholder="Nueva Colección 2024" />
              <Field label="Título" value={d.heading} onChange={v => update({...d, heading: v})} placeholder="Equipamiento Odontológico de" />
              <Field label="Título Resaltado" value={d.heading_highlight} onChange={v => update({...d, heading_highlight: v})} placeholder="Vanguardia" />
              <Field label="Descripción" value={d.description} onChange={v => update({...d, description: v})} type="textarea" />
              <ImageField label="Imagen de Fondo" value={d.background_image} onChange={v => update({...d, background_image: v})} />
              
              <div className="mt-4 p-4 bg-purple-50 border border-purple-100 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-[#6b1e96]">
                  <span className="material-symbols-outlined text-base font-bold">info</span>
                  Especificaciones Recomendadas de Imagen:
                </div>
                <p className="leading-relaxed text-gray-700">
                  Para asegurar que el banner de la página de inicio se vea impecable en todas las pantallas (incluyendo dispositivos móviles y pantallas de alta densidad):
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-gray-600 pl-1">
                  <li>
                    <strong>Resolución óptima:</strong> <code className="bg-purple-100/80 text-[#6b1e96] px-1.5 py-0.5 rounded font-mono text-[10px]">2400 x 600 px</code> (Relación de aspecto 4:1). Mínimo recomendado: <code className="bg-purple-100/80 text-[#6b1e96] px-1.5 py-0.5 rounded font-mono text-[10px]">1200 x 300 px</code>.
                  </li>
                  <li>
                    <strong>Composición visual:</strong> Coloca el producto, equipo o punto focal en el <strong>lado derecho</strong>. La mitad izquierda debe permanecer limpia o con fondos oscuros/neutros para mantener legible el texto blanco superpuesto.
                  </li>
                  <li>
                    <strong>Ajuste dinámico:</strong> La imagen utiliza el comportamiento <code className="bg-purple-100/80 text-[#6b1e96] px-1.5 py-0.5 rounded font-mono text-[10px]">cover</code>, por lo que se adaptará y recortará de forma inteligente por los bordes según la pantalla.
                  </li>
                </ul>
              </div>
            </div>
          </SectionBox>
          <SectionBox title="Botones">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Botón Primario — Texto" value={d.primary_button?.text} onChange={v => update({...d, primary_button: {...(d.primary_button||{}), text: v}})} />
              <Field label="Botón Primario — Link" value={d.primary_button?.link} onChange={v => update({...d, primary_button: {...(d.primary_button||{}), link: v}})} />
              <Field label="Botón Secundario — Texto" value={d.secondary_button?.text} onChange={v => update({...d, secondary_button: {...(d.secondary_button||{}), text: v}})} />
              <Field label="Botón Secundario — Link" value={d.secondary_button?.link} onChange={v => update({...d, secondary_button: {...(d.secondary_button||{}), link: v}})} />
            </div>
          </SectionBox>
          <SectionBox title="Promo Cards">
            <div className="flex justify-end mb-3">
              <AddButton onClick={() => update({...d, promo_cards: [...cards, {badge:'',badge_color:'primary',title:'',description:'',link_text:'',link_url:'#',link_color:'primary',image_url:''}]})} text="Añadir Card" />
            </div>
            <div className="space-y-4">
              {cards.map((card, i) => (
                <div key={i} className="bg-white p-3 border border-gray-200 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500">Card {i + 1}</span>
                    <RemoveButton onClick={() => { const arr = [...cards]; arr.splice(i, 1); update({...d, promo_cards: arr}); }} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Field label="Badge" value={card.badge} onChange={v => { const arr = [...cards]; arr[i] = {...arr[i], badge: v}; update({...d, promo_cards: arr}); }} />
                    <Field label="Color Badge" value={card.badge_color} onChange={v => { const arr = [...cards]; arr[i] = {...arr[i], badge_color: v}; update({...d, promo_cards: arr}); }} placeholder="red, primary, orange" />
                    <Field label="Título" value={card.title} onChange={v => { const arr = [...cards]; arr[i] = {...arr[i], title: v}; update({...d, promo_cards: arr}); }} />
                    <Field label="Descripción" value={card.description} onChange={v => { const arr = [...cards]; arr[i] = {...arr[i], description: v}; update({...d, promo_cards: arr}); }} />
                    <Field label="Texto Link" value={card.link_text} onChange={v => { const arr = [...cards]; arr[i] = {...arr[i], link_text: v}; update({...d, promo_cards: arr}); }} />
                    <Field label="URL Link" value={card.link_url} onChange={v => { const arr = [...cards]; arr[i] = {...arr[i], link_url: v}; update({...d, promo_cards: arr}); }} />
                  </div>
                  <ImageField label="Imagen" value={card.image_url} onChange={v => { const arr = [...cards]; arr[i] = {...arr[i], image_url: v}; update({...d, promo_cards: arr}); }} />
                  <p className="text-[10px] text-purple-700 mt-1.5 flex items-center gap-1 font-medium bg-purple-50/60 p-2 rounded-lg border border-purple-100/50">
                    <span className="material-symbols-outlined text-[13px] font-bold">info</span>
                    <span>Recomendado: Imagen cuadrada (1:1), mínimo 160 x 160 px, con fondo blanco o transparente.</span>
                  </p>
                </div>
              ))}
            </div>
          </SectionBox>
        </div>
      );
    }

    // ━━━━━━━━━━━━━━━ FEATURES BAR ━━━━━━━━━━━━━━━
    if (key === 'features_bar') {
      const features = d.features || [];
      return (
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-700">Features ({features.length})</h3>
            <AddButton onClick={() => update({...d, features: [...features, {icon:'star', title:'', description:'', link:''}]})} text="Añadir Feature" />
          </div>
          <div className="space-y-3">
            {features.map((f, i) => (
              <div key={i} className="bg-gray-50 p-3 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-500">Feature {i + 1}</span>
                  <RemoveButton onClick={() => { const arr = [...features]; arr.splice(i, 1); update({...d, features: arr}); }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Field label="Ícono (Material)" value={f.icon} onChange={v => { const arr = [...features]; arr[i] = {...arr[i], icon: v}; update({...d, features: arr}); }} placeholder="support_agent" />
                  <Field label="Título" value={f.title} onChange={v => { const arr = [...features]; arr[i] = {...arr[i], title: v}; update({...d, features: arr}); }} />
                  <Field label="Descripción" value={f.description} onChange={v => { const arr = [...features]; arr[i] = {...arr[i], description: v}; update({...d, features: arr}); }} />
                </div>
                <div className="mt-2">
                  <Field label="Enlace al hacer click (opcional)" value={f.link} onChange={v => { const arr = [...features]; arr[i] = {...arr[i], link: v}; update({...d, features: arr}); }} placeholder="/terminos#pago-escrow" />
                  <p className="text-[10px] text-gray-500 mt-1">
                    Ruta interna (<code>/devoluciones</code>, <code>/terminos#envios</code>, <code>/account/support</code>) o URL completa (se abre en otra pestaña). Si lo dejas vacío o escribes <code>#</code>, se usa el destino por defecto de esa tarjeta.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // ━━━━━━━━━━━━━━━ BRANDS TICKER ━━━━━━━━━━━━━━━
    if (key === 'brands_ticker') {
      const brands = d.brands || [];
      return (
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          <Field label="Título de la Sección" value={d.heading} onChange={v => update({...d, heading: v})} />
          
          <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-[#6b1e96]">
              <span className="material-symbols-outlined text-base font-bold">info</span>
              Especificaciones Recomendadas para los Logos:
            </div>
            <p className="leading-relaxed text-gray-700">
              Para garantizar que los logos se alineen perfectamente y se visualicen con total claridad y elegancia en el carrusel infinito del Home:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-600 pl-1">
              <li>
                <strong>Formatos admitidos:</strong> Imagen <code className="bg-purple-100/80 text-[#6b1e96] px-1.5 py-0.5 rounded font-mono text-[10px]">PNG</code> o <code className="bg-purple-100/80 text-[#6b1e96] px-1.5 py-0.5 rounded font-mono text-[10px]">WebP</code>. Para URLs externas directas, también se admite <code className="bg-purple-100/80 text-[#6b1e96] px-1.5 py-0.5 rounded font-mono text-[10px]">SVG</code>.
              </li>
              <li>
                <strong>Fondo Transparente:</strong> Es <strong>indispensable</strong> que el logo tenga fondo transparente. Evita imágenes con fondos de color sólido o recuadros blancos que rompan la estética limpia del carrusel.
              </li>
              <li>
                <strong>Resolución recomendada:</strong> Altura óptima entre <code className="bg-purple-100/80 text-[#6b1e96] px-1.5 py-0.5 rounded font-mono text-[10px]">120px</code> y <code className="bg-purple-100/80 text-[#6b1e96] px-1.5 py-0.5 rounded font-mono text-[10px]">200px</code> (con ancho proporcional) para asegurar nitidez en pantallas de alta densidad (Retina). El carrusel escala dinámicamente los logos a una altura máxima de <code className="bg-purple-100/80 text-[#6b1e96] px-1.5 py-0.5 rounded font-mono text-[10px]">56px</code>.
              </li>
              <li>
                <strong>Márgenes y Recorte:</strong> Recorta todo el espacio transparente innecesario alrededor del logo. Si el archivo tiene márgenes vacíos grandes, el logo se renderizará extremadamente pequeño y se verá desalineado.
              </li>
            </ul>
          </div>

          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-700">Marcas ({brands.length})</h3>
            <AddButton onClick={() => update({...d, brands: [...brands, {name:'', img:''}]})} text="Añadir Marca" />
          </div>
          <div className="space-y-3">
            {brands.map((b, i) => (
              <div key={i} className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Field label="Nombre" value={b.name} onChange={v => { const arr = [...brands]; arr[i] = {...arr[i], name: v}; update({...d, brands: arr}); }} />
                  </div>
                  <div className="flex-1">
                    <ImageField label="Logo URL" value={b.img} onChange={v => { const arr = [...brands]; arr[i] = {...arr[i], img: v}; update({...d, brands: arr}); }} />
                  </div>
                  <RemoveButton onClick={() => { const arr = [...brands]; arr.splice(i, 1); update({...d, brands: arr}); }} />
                </div>
                {b.img && (
                  <p className="text-[10px] text-gray-500 flex items-center gap-1 font-medium bg-white/60 p-1.5 rounded border border-gray-100">
                    <span className="material-symbols-outlined text-[13px] text-[#6b1e96] font-bold">info</span>
                    <span>Asegúrate de que este logo tenga fondo transparente y las dimensiones optimizadas.</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // ━━━━━━━━━━━━━━━ TOP CATEGORIES ━━━━━━━━━━━━━━━
    if (key === 'top_categories') {
      return (
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          <SectionBox title="Configuración">
            <div className="space-y-3">
              <Field label="Título" value={d.heading} onChange={v => update({...d, heading: v})} />
              <Field label="Subtítulo" value={d.subheading} onChange={v => update({...d, subheading: v})} />
              <Field label="Máximo a Mostrar" value={d.max_display} onChange={v => update({...d, max_display: parseInt(v) || 8})} type="number" />
            </div>
          </SectionBox>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
            <span className="material-symbols-outlined text-sm align-middle mr-1">info</span>
            Las categorías se cargan dinámicamente desde la API de categorías. Aquí solo se configuran textos y límite.
          </div>
        </div>
      );
    }

    // ━━━━━━━━━━━━━━━ TRENDING PRODUCTS ━━━━━━━━━━━━━━━
    if (key === 'trending_products') {
      return (
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          <SectionBox title="Configuración">
            <div className="space-y-3">
              <Field label="Título de la Sección" value={d.heading} onChange={v => update({...d, heading: v})} />
              <Field label="Máximo a Mostrar" value={d.max_display} onChange={v => update({...d, max_display: parseInt(v) || 6})} type="number" />
            </div>
          </SectionBox>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
            <span className="material-symbols-outlined text-sm align-middle mr-1">info</span>
            Los productos en tendencia se cargan automáticamente. Aquí se configura el título y el límite.
          </div>
        </div>
      );
    }

    // ━━━━━━━━━━━━━━━ PROMO BANNERS ━━━━━━━━━━━━━━━
    if (key === 'promo_banners') {
      const banners = d.banners || [];
      return (
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-700">Banners Promocionales ({banners.length})</h3>
            <AddButton onClick={() => update({...d, banners: [...banners, {position:'left',heading:'',description:'',button_text:'',button_link:'',button_color:'primary',image_url:'',bg_color:'gray-100'}]})} text="Añadir Banner" />
          </div>
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-gray-700 leading-relaxed space-y-1">
            <div className="flex items-center gap-2 font-bold text-blue-700">
              <span className="material-symbols-outlined text-base">info</span>
              Cómo funcionan estos banners
            </div>
            <p>El banner <strong>central</strong> se reemplaza automáticamente por la promoción destacada activa: título, subtítulo, imagen, badge y cuenta atrás salen de Promociones. Lo que escribas aquí se usa solo cuando no hay ninguna promoción viva.</p>
            <p>Los <strong>laterales</strong> siempre usan este contenido. Si guardas menos de 3 banners, los que falten se completan con los valores por defecto.</p>
            <p>En <strong>Link Botón</strong>, un valor vacío o <code>#</code> significa &quot;usar el destino por defecto&quot;: <code>#</code> no navega a ninguna parte, así que se ignora.</p>
          </div>

          {banners.map((b, i) => (
            <div key={i} className="bg-gray-50 p-4 border border-gray-200 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#6b1e96]">Banner {i + 1} — {b.position || 'N/A'}</span>
                <RemoveButton onClick={() => { const arr = [...banners]; arr.splice(i, 1); update({...d, banners: arr}); }} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Field label="Posición" value={b.position} onChange={v => { const arr = [...banners]; arr[i] = {...arr[i], position: v}; update({...d, banners: arr}); }} placeholder="left, center, right" />
                <Field label="Color Fondo" value={b.bg_color} onChange={v => { const arr = [...banners]; arr[i] = {...arr[i], bg_color: v}; update({...d, banners: arr}); }} />
                <Field label="Título" value={b.heading} onChange={v => { const arr = [...banners]; arr[i] = {...arr[i], heading: v}; update({...d, banners: arr}); }} />
                <Field label="Descripción" value={b.description} onChange={v => { const arr = [...banners]; arr[i] = {...arr[i], description: v}; update({...d, banners: arr}); }} />
                <Field label="Texto Botón" value={b.button_text} onChange={v => { const arr = [...banners]; arr[i] = {...arr[i], button_text: v}; update({...d, banners: arr}); }} />
                <Field label="Link Botón" value={b.button_link} onChange={v => { const arr = [...banners]; arr[i] = {...arr[i], button_link: v}; update({...d, banners: arr}); }} placeholder="/store-catalog?category=<id>" />
                <Field label="Color Botón" value={b.button_color} onChange={v => { const arr = [...banners]; arr[i] = {...arr[i], button_color: v}; update({...d, banners: arr}); }} placeholder="sky, primary" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Field label="Texto Descuento" value={b.discount_text} onChange={v => { const arr = [...banners]; arr[i] = {...arr[i], discount_text: v}; update({...d, banners: arr}); }} />
                <Field label="Sub-texto Descuento" value={b.discount_subtext} onChange={v => { const arr = [...banners]; arr[i] = {...arr[i], discount_subtext: v}; update({...d, banners: arr}); }} />
              </div>
              <ImageField label="Imagen" value={b.image_url} onChange={v => { const arr = [...banners]; arr[i] = {...arr[i], image_url: v}; update({...d, banners: arr}); }} />
            </div>
          ))}
        </div>
      );
    }

    // ━━━━━━━━━━━━━━━ FEATURED DEALS ━━━━━━━━━━━━━━━
    if (key === 'featured_deals') {
      const categories = d.categories || [];
      return (
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          <Field label="Título Hero" value={d.hero_title} onChange={v => update({...d, hero_title: v})} placeholder="Oferta Estrella" />
          <SectionBox title="Categorías Destacadas">
            <div className="flex justify-end mb-3">
              <AddButton onClick={() => update({...d, categories: [...categories, {title:''}]})} text="Añadir Categoría" />
            </div>
            <div className="space-y-2">
              {categories.map((c, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <div className="flex-1"><Field label={`Categoría ${i+1}`} value={c.title} onChange={v => { const arr = [...categories]; arr[i] = {...arr[i], title: v}; update({...d, categories: arr}); }} /></div>
                  <RemoveButton onClick={() => { const arr = [...categories]; arr.splice(i, 1); update({...d, categories: arr}); }} />
                </div>
              ))}
            </div>
          </SectionBox>
        </div>
      );
    }

    // ━━━━━━━━━━━━━━━ DEAL OF THE DAY ━━━━━━━━━━━━━━━
    if (key === 'deal_of_the_day') {
      return (
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          <SectionBox title="Textos de la Sección">
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Título Sección" value={d.section_title} onChange={v => update({...d, section_title: v})} />
                <Field label="Título Grid" value={d.grid_title} onChange={v => update({...d, grid_title: v})} />
              </div>
              <Field label="Badge" value={d.badge_text} onChange={v => update({...d, badge_text: v})} />
              <Field label="Título Promo (usar \\n para salto de línea)" value={d.promo_heading} onChange={v => update({...d, promo_heading: v})} type="textarea" rows={2} />
              <Field label="Subtexto Promo" value={d.promo_subtext} onChange={v => update({...d, promo_subtext: v})} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Texto Botón" value={d.button_text} onChange={v => update({...d, button_text: v})} />
                <Field label="Link Botón" value={d.button_link} onChange={v => update({...d, button_link: v})} />
              </div>
            </div>
          </SectionBox>
        </div>
      );
    }

    // ━━━━━━━━━━━━━━━ TOP SELLING ━━━━━━━━━━━━━━━
    if (key === 'top_selling') {
      const tabs = d.tabs || [];
      return (
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          <Field label="Título de la Sección" value={d.heading} onChange={v => update({...d, heading: v})} />
          <SectionBox title="Pestañas de Filtro">
            <div className="flex justify-end mb-3">
              <AddButton onClick={() => update({...d, tabs: [...tabs, {id: '', label: ''}]})} text="Añadir Pestaña" />
            </div>
            <div className="space-y-2">
              {tabs.map((t, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <div className="w-1/3"><Field label="ID" value={t.id} onChange={v => { const arr = [...tabs]; arr[i] = {...arr[i], id: v}; update({...d, tabs: arr}); }} placeholder="all" /></div>
                  <div className="flex-1"><Field label="Etiqueta" value={t.label} onChange={v => { const arr = [...tabs]; arr[i] = {...arr[i], label: v}; update({...d, tabs: arr}); }} placeholder="Todos" /></div>
                  <RemoveButton onClick={() => { const arr = [...tabs]; arr.splice(i, 1); update({...d, tabs: arr}); }} />
                </div>
              ))}
            </div>
          </SectionBox>
        </div>
      );
    }

    // ━━━━━━━━━━━━━━━ DUAL BANNERS ━━━━━━━━━━━━━━━
    if (key === 'dual_banners') {
      const banners = d.banners || [];
      return (
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-700">Banners Duales ({banners.length})</h3>
            <AddButton onClick={() => update({...d, banners: [...banners, {badge:'',heading:'',button_text:'',button_link:'#',image_url:''}]})} text="Añadir Banner" />
          </div>
          {banners.map((b, i) => (
            <div key={i} className="bg-gray-50 p-4 border border-gray-200 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#6b1e96]">Banner {i + 1}</span>
                <RemoveButton onClick={() => { const arr = [...banners]; arr.splice(i, 1); update({...d, banners: arr}); }} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Field label="Badge" value={b.badge} onChange={v => { const arr = [...banners]; arr[i] = {...arr[i], badge: v}; update({...d, banners: arr}); }} />
                <Field label="Título" value={b.heading} onChange={v => { const arr = [...banners]; arr[i] = {...arr[i], heading: v}; update({...d, banners: arr}); }} />
                <Field label="Texto Botón" value={b.button_text} onChange={v => { const arr = [...banners]; arr[i] = {...arr[i], button_text: v}; update({...d, banners: arr}); }} />
                <Field label="Link Botón" value={b.button_link} onChange={v => { const arr = [...banners]; arr[i] = {...arr[i], button_link: v}; update({...d, banners: arr}); }} />
              </div>
              <ImageField label="Imagen" value={b.image_url} onChange={v => { const arr = [...banners]; arr[i] = {...arr[i], image_url: v}; update({...d, banners: arr}); }} />
            </div>
          ))}
        </div>
      );
    }

    // ━━━━━━━━━━━━━━━ BLOG SECTION ━━━━━━━━━━━━━━━
    if (key === 'blog_section') {
      const posts = d.posts || [];
      return (
        <div className="p-4 overflow-y-auto flex-1 space-y-5">
          <SectionBox title="Encabezado">
            <div className="space-y-3">
              <Field label="Título" value={d.heading} onChange={v => update({...d, heading: v})} />
              <Field label="Subtítulo" value={d.subheading} onChange={v => update({...d, subheading: v})} type="textarea" rows={2} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Texto Botón" value={d.button_text} onChange={v => update({...d, button_text: v})} />
                <Field label="Link Botón" value={d.button_link} onChange={v => update({...d, button_link: v})} />
              </div>
            </div>
          </SectionBox>
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-700">Posts ({posts.length})</h3>
            <AddButton onClick={() => update({...d, posts: [...posts, {title:'',author:'',date:'',comments:0,excerpt:'',image:''}]})} text="Añadir Post" />
          </div>
          {posts.map((p, i) => (
            <div key={i} className="bg-gray-50 p-4 border border-gray-200 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#6b1e96]">Post {i + 1}</span>
                <RemoveButton onClick={() => { const arr = [...posts]; arr.splice(i, 1); update({...d, posts: arr}); }} />
              </div>
              <Field label="Título" value={p.title} onChange={v => { const arr = [...posts]; arr[i] = {...arr[i], title: v}; update({...d, posts: arr}); }} />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Field label="Autor" value={p.author} onChange={v => { const arr = [...posts]; arr[i] = {...arr[i], author: v}; update({...d, posts: arr}); }} />
                <Field label="Fecha" value={p.date} onChange={v => { const arr = [...posts]; arr[i] = {...arr[i], date: v}; update({...d, posts: arr}); }} placeholder="05 Jun, 2024" />
                <Field label="Comentarios" value={p.comments} onChange={v => { const arr = [...posts]; arr[i] = {...arr[i], comments: parseInt(v) || 0}; update({...d, posts: arr}); }} type="number" />
              </div>
              <Field label="Extracto" value={p.excerpt} onChange={v => { const arr = [...posts]; arr[i] = {...arr[i], excerpt: v}; update({...d, posts: arr}); }} type="textarea" rows={2} />
              <ImageField label="Imagen" value={p.image} onChange={v => { const arr = [...posts]; arr[i] = {...arr[i], image: v}; update({...d, posts: arr}); }} />
            </div>
          ))}
        </div>
      );
    }

    // ━━━━━━━━━━━━━━━ CATALOG SECTION ━━━━━━━━━━━━━━━
    if (key === 'catalog_section') {
      return (
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          <SectionBox title="Configuración del Catálogo">
            <div className="space-y-3">
              <Field label="Título" value={d.heading} onChange={v => update({...d, heading: v})} />
              <Field label="Subtítulo" value={d.subheading} onChange={v => update({...d, subheading: v})} />
              <Field label="Placeholder de Búsqueda" value={d.search_placeholder} onChange={v => update({...d, search_placeholder: v})} />
            </div>
          </SectionBox>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
            <span className="material-symbols-outlined text-sm align-middle mr-1">info</span>
            Los productos del catálogo se cargan automáticamente desde la base de datos.
          </div>
        </div>
      );
    }

    // ━━━━━━━━━━━━━━━ FOOTER ━━━━━━━━━━━━━━━
    if (key === 'footer') {
      const newsletter = d.newsletter || {};
      const socialLinks = d.social_links || {};
      const columns = d.columns || [];
      return (
        <div className="p-4 overflow-y-auto flex-1 space-y-5">
          <SectionBox title="Newsletter">
            <div className="space-y-3">
              <Field label="Título" value={newsletter.heading} onChange={v => update({...d, newsletter: {...newsletter, heading: v}})} />
              <Field label="Subtítulo" value={newsletter.subheading} onChange={v => update({...d, newsletter: {...newsletter, subheading: v}})} />
              <Field label="Placeholder" value={newsletter.placeholder} onChange={v => update({...d, newsletter: {...newsletter, placeholder: v}})} />
            </div>
          </SectionBox>
          <SectionBox title="General">
            <div className="space-y-3">
              <Field label="Nombre de Marca" value={d.brand_name} onChange={v => update({...d, brand_name: v})} />
              <Field label="Copyright ({'{year}'} se reemplaza automáticamente)" value={d.copyright} onChange={v => update({...d, copyright: v})} />
            </div>
          </SectionBox>
          <SectionBox title="Métodos de Pago">
            <p className="text-xs text-gray-500">
              Los métodos que aparecen en el pie de página se configuran en{' '}
              <a href="/admin/payment-methods" className="text-[#6b1e96] font-bold hover:underline">Métodos de Pago</a>,
              y son siempre los que están activos en el checkout. Antes se editaban aquí, pero
              el pie de página nunca leyó ese dato.
            </p>
          </SectionBox>
          <SectionBox title="Redes Sociales">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Instagram" value={socialLinks.instagram} onChange={v => update({...d, social_links: {...socialLinks, instagram: v}})} placeholder="https://..." />
              <Field label="Facebook" value={socialLinks.facebook} onChange={v => update({...d, social_links: {...socialLinks, facebook: v}})} placeholder="https://..." />
              <Field label="Twitter/X" value={socialLinks.twitter} onChange={v => update({...d, social_links: {...socialLinks, twitter: v}})} placeholder="https://..." />
              <Field label="LinkedIn" value={socialLinks.linkedin} onChange={v => update({...d, social_links: {...socialLinks, linkedin: v}})} placeholder="https://..." />
            </div>
          </SectionBox>
          <SectionBox title="Columnas de Enlaces">
            <div className="flex justify-end mb-3">
              <AddButton onClick={() => update({...d, columns: [...columns, {title:'', links:[]}]})} text="Añadir Columna" />
            </div>
            {columns.map((col, ci) => (
              <div key={ci} className="bg-white p-3 border border-gray-200 rounded-lg mb-3 space-y-2">
                <div className="flex justify-between items-center">
                  <Field label={`Título Columna ${ci+1}`} value={col.title} onChange={v => { const arr = [...columns]; arr[ci] = {...arr[ci], title: v}; update({...d, columns: arr}); }} />
                  <RemoveButton onClick={() => { const arr = [...columns]; arr.splice(ci,1); update({...d, columns: arr}); }} />
                </div>
                <div className="space-y-1 ml-2">
                  {(col.links || []).map((lk, li) => (
                    <div key={li} className="flex gap-1 items-center">
                      <input className="border p-1.5 rounded text-xs flex-1" value={lk.text||''} placeholder="Texto" onChange={e => { const arr=[...columns]; const links=[...(arr[ci].links||[])]; links[li]={...links[li], text: e.target.value}; arr[ci]={...arr[ci], links}; update({...d, columns: arr}); }} />
                      <input className="border p-1.5 rounded text-xs flex-1 font-mono" value={lk.url||''} placeholder="URL" onChange={e => { const arr=[...columns]; const links=[...(arr[ci].links||[])]; links[li]={...links[li], url: e.target.value}; arr[ci]={...arr[ci], links}; update({...d, columns: arr}); }} />
                      <button onClick={() => { const arr=[...columns]; const links=[...(arr[ci].links||[])]; links.splice(li,1); arr[ci]={...arr[ci], links}; update({...d, columns: arr}); }} className="text-red-400 hover:text-red-600 font-bold text-sm px-1">×</button>
                    </div>
                  ))}
                  <button onClick={() => { const arr=[...columns]; const links=[...(arr[ci].links||[]), {text:'',url:''}]; arr[ci]={...arr[ci], links}; update({...d, columns: arr}); }} className="text-xs text-[#6b1e96] mt-1 hover:underline">+ Añadir Link</button>
                </div>
              </div>
            ))}
          </SectionBox>
        </div>
      );
    }

    // ━━━━━━━━━━━━━━━ HEADER ━━━━━━━━━━━━━━━
    if (key === 'header') {
      const topBar = d.top_bar || {};
      const navLinks = d.nav_links || [];
      return (
        <div className="p-4 overflow-y-auto flex-1 space-y-6">
          <SectionBox title="General">
            <div className="space-y-3">
              <Field label="Nombre de la Marca (Brand)" value={d.brand_name} onChange={v => update({...d, brand_name: v})} />
              <ImageField label="Logo de la Marca (Imagen)" value={d.brand_logo} onChange={v => update({...d, brand_logo: v})} />
              <p className="text-[10px] text-purple-700 mt-1 flex items-center gap-1 font-medium bg-purple-50/60 p-2 rounded-lg border border-purple-100/50">
                <span className="material-symbols-outlined text-[13px] font-bold">info</span>
                <span>Recomendado: Formato SVG o WebP con fondo transparente. Dimensión sugerida: 120 x 120 px. La subida convertirá automáticamente imágenes PNG/JPG a WebP.</span>
              </p>
            </div>
          </SectionBox>
          <SectionBox title="Top Bar Promo">
            <div className="space-y-3">
              <Field label="Texto Promocional" value={topBar.promo_text} onChange={v => update({...d, top_bar: {...topBar, promo_text: v}})} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Texto del Enlace" value={topBar.promo_link_text} onChange={v => update({...d, top_bar: {...topBar, promo_link_text: v}})} />
                <Field label="URL del Enlace" value={topBar.promo_link_url} onChange={v => update({...d, top_bar: {...topBar, promo_link_url: v}})} />
              </div>
            </div>
          </SectionBox>
          <SectionBox title="Navegación Desktop & Mobile">
            <div className="flex justify-end mb-3">
              <AddButton onClick={() => update({...d, nav_links: [...navLinks, {text: '', url: ''}]})} text="Añadir Link" />
            </div>
            <div className="space-y-2">
              {navLinks.map((ln, i) => (
                <div key={i} className="flex gap-2 items-center">
                   <input placeholder="Texto" className="border border-gray-300 p-2 rounded-md flex-1 text-sm" value={ln.text || ''} onChange={e => { const arr = [...navLinks]; arr[i] = {...arr[i], text: e.target.value}; update({...d, nav_links: arr}); }} />
                   <input placeholder="URL" className="border border-gray-300 p-2 rounded-md flex-1 text-sm font-mono" value={ln.url || ''} onChange={e => { const arr = [...navLinks]; arr[i] = {...arr[i], url: e.target.value}; update({...d, nav_links: arr}); }} />
                   <RemoveButton onClick={() => { const arr = [...navLinks]; arr.splice(i, 1); update({...d, nav_links: arr}); }} />
                </div>
              ))}
            </div>
          </SectionBox>
        </div>
      );
    }

    // ━━━━━━━━━━━━━━━ FALLBACK ━━━━━━━━━━━━━━━
    return null;
  };

  // ─── Check if a section has a visual editor ─────────────────
  const hasVisualEditor = (sectionKey) => {
    const supported = ['hero','features_bar','brands_ticker','top_categories','trending_products',
      'promo_banners','featured_deals','deal_of_the_day','top_selling','dual_banners',
      'blog_section','catalog_section','footer','header'];
    return supported.includes(sectionKey);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestor de Contenido del Home</h1>
          <p className="text-gray-500 text-sm mt-1">Modifica textos, configuraciones e imágenes de la página principal.</p>
        </div>
        <div>
           <label className="bg-primary-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-primary-700 transition font-medium flex items-center gap-2">
             <span className="material-symbols-outlined text-sm">cloud_upload</span>
             {uploading ? "Subiendo..." : "Subir Imagen (Hosting)"}
             <input type="file" className="hidden" accept="image/*" onChange={handleUploadImage} disabled={uploading}/>
           </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[75vh] overflow-hidden">
           <h2 className="font-semibold mb-4 text-gray-700 uppercase text-sm tracking-wider">Secciones</h2>
           <div className="overflow-y-auto flex-1 pr-2">
             {loading && sections.length === 0 ? <p className="text-gray-400 text-sm">Cargando...</p> : (
               <ul className="space-y-2">
                 {sections.map(sec => (
                   <li key={sec.section_key} 
                       className={`p-3 rounded-lg cursor-pointer border transition-colors ${selectedSection?.section_key === sec.section_key ? 'bg-primary-50 border-primary-500 shadow-sm' : 'hover:bg-gray-50 border-transparent'}`}
                       onClick={() => handleSelect(sec)}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`font-semibold text-sm ${selectedSection?.section_key === sec.section_key ? 'text-primary-800' : 'text-gray-700'}`}>{sec.name}</span>
                        <span className={`w-2.5 h-2.5 rounded-full ${sec.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      </div>
                      <p className="text-[10px] text-gray-500 truncate">{sec.section_key}</p>
                   </li>
                 ))}
               </ul>
             )}
           </div>
        </div>

        <div className="md:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[75vh] flex flex-col">
           {selectedSection ? (
             <div className="flex flex-col h-full">
               <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedSection.name}</h2>
                    <p className="text-gray-500 text-sm mt-1">{selectedSection.description}</p>
                    {selectedSection.updated_at && (
                       <p className="text-[11px] text-gray-400 mt-1 font-mono">
                          Última actualización: {new Date(selectedSection.updated_at).toLocaleString()}
                       </p>
                    )}
                  </div>
                  <button onClick={() => handleToggle(selectedSection.section_key)} className={`px-4 py-1.5 text-xs rounded-full font-bold uppercase tracking-wide transition-all ${selectedSection.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'}`}>
                    {selectedSection.is_active ? 'Desactivar Sección' : 'Activar Sección'}
                  </button>
               </div>
               
               <div className="flex items-center gap-2 mb-2 p-1 bg-gray-100 rounded-lg w-max">
                 <button onClick={() => setEditorMode("visual")} className={`px-4 py-1.5 text-sm rounded-md font-medium transition ${editorMode === "visual" ? "bg-white shadow text-[#6b1e96]" : "text-gray-500 hover:text-gray-700"}`}>Visual</button>
                 <button onClick={() => setEditorMode("json")} className={`px-4 py-1.5 text-sm rounded-md font-medium transition ${editorMode === "json" ? "bg-white shadow text-[#6b1e96]" : "text-gray-500 hover:text-gray-700"}`}>JSON (Avanzado)</button>
               </div>
               
               <div className="flex-1 flex flex-col mb-4 overflow-hidden border border-gray-200 rounded-lg bg-white relative">
                 {editorMode === "visual" && hasVisualEditor(selectedSection.section_key) ? (
                    renderVisualEditor()
                 ) : editorMode === "visual" ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-sm">
                      <span className="material-symbols-outlined text-4xl mb-2 text-gray-300">code_blocks</span>
                      Esta sección no tiene editor visual asignado. Cambie al modo JSON.
                    </div>
                 ) : (
                    <textarea 
                      spellCheck="false"
                      value={jsonText}
                      onChange={(e) => setJsonText(e.target.value)}
                      className="w-full h-full p-4 font-mono text-sm focus:ring-primary-500 focus:border-primary-500 bg-gray-50 resize-none outline-none"
                    />
                 )}
               </div>
               
               <div className="flex justify-end pt-2 border-t border-gray-100">
                  <button onClick={handleSave} disabled={saving} className={`px-8 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 shadow-md ${saving ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-primary-600 text-white hover:bg-primary-700 shadow-primary-500/20'}`}>
                    <span className="material-symbols-outlined text-sm">{saving ? 'hourglass_top' : 'save'}</span>
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
               </div>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <span className="material-symbols-outlined text-6xl mb-4 text-gray-200">dashboard_customize</span>
                <p className="font-medium text-gray-500">Selecciona una sección en el panel izquierdo para editar.</p>
                <p className="text-sm mt-2 text-gray-400 text-center max-w-sm">Aquí podrás configurar textos, imágenes, enlaces y comportamientos dinámicos.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
