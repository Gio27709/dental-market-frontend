import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLocationContext } from "../../hooks/useLocationContext";
import { getTrendingShared } from "../../services/sharedRequests";
import ProductCard from "../ProductCard";
import LoadingSkeleton from "../LoadingSkeleton";
import PropTypes from "prop-types";

// Inicio en versión app (solo teléfono). La Home de escritorio es una página larga de
// marketing; aquí manda lo que la gente viene a hacer: buscar, entrar al catálogo, ver sus
// pedidos y comprar. Todo sale de datos reales (categorías y productos en tendencia).

const ROLES_CLINICOS = ["professional", "student"];

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

export default function InicioMovil() {
  const navigate = useNavigate();
  const { user, firstName, role } = useAuth();
  const { buyerState } = useLocationContext();
  const [busqueda, setBusqueda] = useState("");
  const [datos, setDatos] = useState({ productos: [], categorias: [] });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vivo = true;
    getTrendingShared(buyerState)
      .then(({ data }) => {
        if (!vivo) return;
        setDatos({
          productos: data?.data?.trending_products || [],
          categorias: data?.data?.trending_categories || [],
        });
      })
      .catch(() => {})
      .finally(() => vivo && setCargando(false));
    return () => {
      vivo = false;
    };
  }, [buyerState]);

  const accesos = useMemo(() => {
    const base = [
      { to: "/store-catalog", icono: "storefront", texto: "Catálogo" },
      { to: "/promociones", icono: "sell", texto: "Ofertas", color: "#b8482f", fondo: "#fbeae6" },
      { to: user ? "/account/orders" : "/login?redirect=/account/orders", icono: "local_shipping", texto: "Mis pedidos" },
      { to: user ? "/account/support" : "/contacto", icono: "support_agent", texto: "Ayuda" },
      { to: "/courses", icono: "school", texto: "Cursos" },
      { to: "/news", icono: "newspaper", texto: "Noticias" },
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
      <section className="bg-gradient-to-b from-[#6b1e96] to-[#5a1880] px-4 pb-5 pt-4 text-white"><div className="mx-auto w-full max-w-[560px]">
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
      <section className="-mt-3 rounded-t-3xl bg-white px-4 pb-5 pt-5"><div className="mx-auto w-full max-w-[560px]">
        <div className="grid grid-cols-4 gap-y-4">
          {accesos.map((a) => (
            <Acceso key={a.texto} {...a} />
          ))}
        </div>
      </div>
      </section>

      {/* Confianza */}
      <section className="mt-2 bg-white px-4 py-3"><div className="mx-auto w-full max-w-[560px]">
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
        <section className="mt-3">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-[15px] font-bold text-fx-text">Categorías</h2>
            <Link to="/store-catalog" className="text-[12.5px] font-semibold text-[#6b1e96]">Ver todo</Link>
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto px-4 pb-1">
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

      {/* Productos */}
      <section className="mt-4">
        <div className="flex items-center justify-between px-4">
          <h2 className="text-[15px] font-bold text-fx-text">Lo más buscado</h2>
          <Link to="/store-catalog" className="text-[12.5px] font-semibold text-[#6b1e96]">Ver catálogo</Link>
        </div>
        {cargando ? (
          <div className="flex gap-3 overflow-hidden px-4 pt-3">
            <LoadingSkeleton variant="product-card" count={2} />
          </div>
        ) : datos.productos.length === 0 ? (
          <p className="px-4 pt-3 text-[13px] text-fx-muted">Aún no hay productos para mostrar. Entra al catálogo para verlos todos.</p>
        ) : (
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 pt-3">
            {datos.productos.map((p) => (
              <div key={p.id} className="w-[190px] shrink-0 snap-start">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Promociones */}
      <section className="px-4 pt-5">
        <Link
          to="/promociones"
          className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#531575] to-[#6b1e96] px-4 py-4 text-white"
        >
          <span className="material-symbols-outlined text-[28px] text-[#c3ff00]" aria-hidden="true">local_offer</span>
          <span className="flex-1">
            <span className="block text-[14px] font-bold">Ofertas de las tiendas</span>
            <span className="block text-[12px] text-white/80">Descuentos vigentes y cupones</span>
          </span>
          <span className="material-symbols-outlined text-[22px]" aria-hidden="true">chevron_right</span>
        </Link>
      </section>
    </div>
  );
}
