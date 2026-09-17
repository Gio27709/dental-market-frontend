import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLocationContext } from "../../hooks/useLocationContext";
import { getTrendingShared } from "../../services/sharedRequests";
import { getProducts, getPostsAPI } from "../../services/api";
import TarjetaProductoMovil from "./TarjetaProductoMovil";
import LoadingSkeleton from "../LoadingSkeleton";
import PropTypes from "prop-types";

// Inicio en versión app (solo teléfono). La Home de escritorio es una página larga de
// marketing; aquí manda lo que la gente viene a hacer: buscar, entrar al catálogo, ver ofertas,
// sus pedidos y las publicaciones. Todo sale de datos reales (tendencias, catálogo y posts
// publicados); si una sección no tiene datos, no se dibuja en vez de mostrar ejemplos falsos.

const ROLES_CLINICOS = ["professional", "student"];
// Las secciones se centran a 560 px para que en ventanas anchas (o tablet) no se estiren.
const ANCHO = "mx-auto w-full max-w-[560px]";

function Acceso({ to, icono, texto, color = "#6b1e96", fondo = "#f1ebf9" }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: fondo }}>
        <span className="material-symbols-outlined text-[26px]" style={{ color }} aria-hidden="true">{icono}</span>
      </span>
      <span className="text-center text-[11px] font-semibold leading-tight text-fx-text">{texto}</span>
    </Link>
  );
}

Acceso.propTypes = {
  to: PropTypes.string.isRequired,
  icono: PropTypes.string.isRequired,
  texto: PropTypes.string.isRequired,
  color: PropTypes.string,
  fondo: PropTypes.string,
};

function Titulo({ texto, enlace, enlaceTexto = "Ver todo" }) {
  return (
    <div className={`${ANCHO} flex items-center justify-between px-4`}>
      <h2 className="text-[15px] font-bold text-fx-text">{texto}</h2>
      {enlace && <Link to={enlace} className="text-[12.5px] font-semibold text-[#6b1e96]">{enlaceTexto}</Link>}
    </div>
  );
}

Titulo.propTypes = {
  texto: PropTypes.string.isRequired,
  enlace: PropTypes.string,
  enlaceTexto: PropTypes.string,
};

function Carrusel({ productos }) {
  return (
    <div className={`${ANCHO} flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 pt-3`}>
      {productos.map((p) => (
        <TarjetaProductoMovil key={p.id} producto={p} />
      ))}
    </div>
  );
}

Carrusel.propTypes = { productos: PropTypes.array.isRequired };

const fechaCorta = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("es-ES", { timeZone: "America/Caracas", day: "numeric", month: "short" })
    : "";

export default function InicioMovil() {
  const navigate = useNavigate();
  const { user, firstName, role } = useAuth();
  const { buyerState } = useLocationContext();
  const [busqueda, setBusqueda] = useState("");
  const [datos, setDatos] = useState({ productos: [], categorias: [] });
  const [catalogo, setCatalogo] = useState([]);
  const [publicaciones, setPublicaciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vivo = true;
    Promise.allSettled([
      getTrendingShared(buyerState),
      getProducts({ limit: 16, buyer_state: buyerState || undefined }),
      getPostsAPI(),
    ])
      .then(([tendencias, productos, posts]) => {
        if (!vivo) return;
        if (tendencias.status === "fulfilled") {
          const d = tendencias.value?.data?.data;
          setDatos({
            productos: d?.trending_products || [],
            categorias: d?.trending_categories || [],
          });
        }
        if (productos.status === "fulfilled") setCatalogo(productos.value?.data?.data || []);
        if (posts.status === "fulfilled") setPublicaciones((posts.value?.data?.data || []).slice(0, 8));
      })
      .finally(() => {
        if (vivo) setCargando(false);
      });
    return () => {
      vivo = false;
    };
  }, [buyerState]);

  // Con descuento vigente y lo último que publicaron las tiendas (el catálogo no ordena por
  // fecha, así que se ordena aquí con lo que ya trajimos).
  const ofertas = useMemo(() => catalogo.filter((p) => p.active_discount).slice(0, 8), [catalogo]);
  const recientes = useMemo(
    () => [...catalogo].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 8),
    [catalogo],
  );

  const accesos = useMemo(() => {
    const base = [
      { to: "/store-catalog", icono: "storefront", texto: "Catálogo" },
      { to: "/promociones", icono: "sell", texto: "Ofertas", color: "#b8482f", fondo: "#fbeae6" },
      { to: user ? "/account/orders" : "/login?redirect=/account/orders", icono: "local_shipping", texto: "Mis pedidos" },
      { to: user ? "/account/support" : "/contacto", icono: "support_agent", texto: "Ayuda" },
      { to: "/courses", icono: "school", texto: "Cursos" },
      // Publicaciones ya vive en la barra de abajo; aquí va lo que no está en ella.
      { to: user ? "/account/favorites" : "/login?redirect=/account/favorites", icono: "favorite", texto: "Favoritos" },
      { to: "/acerca", icono: "info", texto: "Quiénes somos" },
    ];
    if (ROLES_CLINICOS.includes(role)) {
      base.splice(3, 0, { to: "/clinic", icono: "medical_services", texto: "Mi clínica", color: "#4f7d33", fondo: "#eaf5dc" });
    } else if (role === "store") {
      base.splice(3, 0, { to: "/store", icono: "inventory_2", texto: "Mi tienda", color: "#4f7d33", fondo: "#eaf5dc" });
    } else {
      base.push({ to: "/afiliate", icono: "handshake", texto: "Vender" });
    }
    return base.slice(0, 8);
  }, [user, role]);

  const buscar = (e) => {
    e.preventDefault();
    const q = busqueda.trim();
    navigate(q ? `/store-catalog?search=${encodeURIComponent(q)}` : "/store-catalog");
  };

  return (
    <div className="min-h-screen bg-fx-base pb-6">
      {/* Saludo + buscador */}
      <section className="bg-gradient-to-b from-[#6b1e96] to-[#5a1880] px-4 pb-5 pt-4 text-white"><div className={ANCHO}>
        <p className="text-[15px] font-semibold">
          {user ? `Hola${firstName ? `, ${firstName}` : ""} 👋` : "¡Hola! 👋"}
        </p>
        <p className="mb-3 text-[12.5px] text-white/80">
          {buyerState ? `Enviamos a ${buyerState}` : "Insumos y equipos odontológicos"}
        </p>
        <form onSubmit={buscar} className="relative">
          <label htmlFor="buscar-inicio" className="sr-only">Buscar productos</label>
          <input
            id="buscar-inicio"
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar resina, guantes, brackets…"
            className="w-full rounded-2xl border-0 bg-white py-3 pl-11 pr-4 text-[16px] text-fx-text shadow-lg outline-none placeholder:text-fx-faint"
          />
          <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[22px] text-fx-faint" aria-hidden="true">search</span>
        </form>
      </div>
      </section>

      {/* Accesos rápidos */}
      <section className="-mt-3 rounded-t-3xl bg-white px-4 pb-5 pt-5"><div className={ANCHO}>
        <div className="grid grid-cols-4 gap-y-4">
          {accesos.map((a) => (
            <Acceso key={a.texto} {...a} />
          ))}
        </div>
      </div>
      </section>

      {/* Confianza */}
      <section className="mt-2 bg-white px-4 py-3"><div className={ANCHO}>
        <ul className="flex items-center justify-between gap-2 text-center text-[10.5px] font-semibold text-fx-muted">
          {[
            ["verified_user", "Compra protegida"],
            ["storefront", "Tiendas verificadas"],
            ["local_shipping", "Envío a todo el país"],
          ].map(([icono, texto]) => (
            <li key={texto} className="flex flex-1 flex-col items-center gap-1">
              <span className="material-symbols-outlined text-[20px] text-[#6b1e96]" aria-hidden="true">{icono}</span>
              {texto}
            </li>
          ))}
        </ul>
      </div>
      </section>

      {/* Categorías */}
      {datos.categorias.length > 0 && (
        <section className="mt-4">
          <Titulo texto="Categorías" enlace="/store-catalog" />
          <div className={`${ANCHO} mt-2 flex gap-2 overflow-x-auto px-4 pb-1`}>
            {datos.categorias.map((c) => (
              <Link
                key={c.id}
                to={`/store-catalog?category=${c.id}`}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-fx-line bg-white px-3 py-2 text-[12.5px] font-semibold text-fx-text"
              >
                <span className="material-symbols-outlined text-[18px] text-[#6b1e96]" aria-hidden="true">{c.icon || "category"}</span>
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Lo más buscado */}
      <section className="mt-4">
        <Titulo texto="Lo más buscado" enlace="/store-catalog" enlaceTexto="Ver catálogo" />
        {cargando ? (
          <div className={`${ANCHO} flex gap-3 overflow-hidden px-4 pt-3`}>
            <LoadingSkeleton variant="product-card" count={2} />
          </div>
        ) : datos.productos.length === 0 ? (
          <p className={`${ANCHO} px-4 pt-3 text-[13px] text-fx-muted`}>Aún no hay productos para mostrar. Entra al catálogo para verlos todos.</p>
        ) : (
          <Carrusel productos={datos.productos} />
        )}
      </section>

      {/* Con descuento */}
      {ofertas.length > 0 && (
        <section className="mt-4">
          <Titulo texto="Con descuento" enlace="/promociones" enlaceTexto="Ver ofertas" />
          <Carrusel productos={ofertas} />
        </section>
      )}

      {/* Promociones */}
      <section className="px-4 pt-4">
        <Link
          to="/promociones"
          className={`${ANCHO} flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#531575] to-[#6b1e96] px-4 py-4 text-white`}
        >
          <span className="material-symbols-outlined text-[28px] text-[#c3ff00]" aria-hidden="true">local_offer</span>
          <span className="flex-1">
            <span className="block text-[14px] font-bold">Ofertas de las tiendas</span>
            <span className="block text-[12px] text-white/80">Descuentos vigentes y cupones</span>
          </span>
          <span className="material-symbols-outlined text-[22px]" aria-hidden="true">chevron_right</span>
        </Link>
      </section>

      {/* Recién llegados */}
      {recientes.length > 0 && (
        <section className="mt-4">
          <Titulo texto="Recién llegados" enlace="/store-catalog" enlaceTexto="Ver catálogo" />
          <Carrusel productos={recientes} />
        </section>
      )}

      {/* Publicaciones */}
      {publicaciones.length > 0 && (
        <section className="mt-4">
          <Titulo texto="Publicaciones" enlace="/news" enlaceTexto="Ver todas" />
          <div className={`${ANCHO} flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 pt-3`}>
            {publicaciones.map((p) => (
              <Link
                key={p.id}
                to={`/news/${p.id}`}
                className="flex w-[220px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-fx-line bg-white transition-transform active:scale-[0.98]"
              >
                <div className="h-28 bg-fx-inset">
                  {p.thumbnail_url ? (
                    <img src={p.thumbnail_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <span className="material-symbols-outlined text-[30px] text-fx-faint" aria-hidden="true">article</span>
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1 p-2.5">
                  {p.category && (
                    <span className="w-fit rounded-full bg-[#f1ebf9] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#6b1e96]">{p.category}</span>
                  )}
                  <p className="line-clamp-2 text-[12.5px] font-semibold leading-tight text-fx-text">{p.title}</p>
                  <span className="mt-auto pt-1 text-[11px] text-fx-faint">{fechaCorta(p.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Vender en Forcepx (solo para quien todavía no tiene tienda) */}
      {role !== "store" && (
        <section className="px-4 pt-4">
          <Link
            to="/afiliate"
            className={`${ANCHO} flex items-center gap-3 rounded-2xl border border-fx-line bg-white px-4 py-4`}
          >
            <span className="material-symbols-outlined text-[26px] text-[#6b1e96]" aria-hidden="true">handshake</span>
            <span className="flex-1">
              <span className="block text-[14px] font-bold text-fx-text">¿Vendes insumos dentales?</span>
              <span className="block text-[12px] text-fx-muted">Abre tu tienda en Forcepx</span>
            </span>
            <span className="material-symbols-outlined text-[22px] text-fx-faint" aria-hidden="true">chevron_right</span>
          </Link>
        </section>
      )}

      {/* Ayuda */}
      <section className="px-4 pt-4">
        <div className={`${ANCHO} rounded-2xl bg-white px-4 py-4 text-center`}>
          <p className="text-[13px] font-semibold text-fx-text">¿Necesitas ayuda?</p>
          <p className="mt-1 text-[12px] text-fx-muted">Escríbenos por el chat de la esquina o abre un ticket de soporte.</p>
          <Link
            to={user ? "/account/support" : "/contacto"}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#f1ebf9] px-4 py-2 text-[12.5px] font-bold text-[#6b1e96]"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">support_agent</span>
            Contactar soporte
          </Link>
        </div>
      </section>
    </div>
  );
}
