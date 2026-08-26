import { useEffect, useRef } from "react";
import PropTypes from "prop-types";

/**
 * Aparición suave de una sección cuando entra en pantalla.
 *
 * Decisiones de rendimiento:
 *  - Un único IntersectionObserver para toda la página, compartido a nivel de módulo,
 *    en vez de uno por sección (y en vez de escuchar `scroll`, que obliga a recalcular
 *    en cada fotograma).
 *  - La clase se pone sobre el DOM directamente, sin estado de React: hacer scroll no
 *    provoca ni un solo re-render.
 *  - Se anima solo `opacity` y `transform`, que el navegador resuelve en el compositor
 *    sin recalcular layout.
 *  - Cada sección se deja de observar en cuanto aparece: la animación ocurre una vez y
 *    volver a subir no la repite.
 *
 * `prefers-reduced-motion` se respeta desde el CSS (ver `.reveal` en index.css).
 */
let sharedObserver = null;

const STAGGER_MS = 110;   // separación entre secciones que entran a la vez
const MAX_STAGGER = 3;    // a partir de la cuarta ya no se acumula más espera

const getObserver = () => {
  if (sharedObserver || typeof IntersectionObserver === "undefined") return sharedObserver;

  sharedObserver = new IntersectionObserver(
    (entries) => {
      let batch = 0;

      for (const entry of entries) {
        if (!entry.isIntersecting) continue;

        const el = entry.target;
        // Cuando varias secciones entran juntas (al cargar, o bajando rápido) se
        // escalonan: entrar todas en el mismo instante se percibe como un parpadeo.
        const own = Number(el.dataset.revealDelay || 0);
        const total = own + Math.min(batch, MAX_STAGGER) * STAGGER_MS;
        if (total) el.style.transitionDelay = `${total}ms`;

        el.classList.add("is-visible");
        sharedObserver.unobserve(el);
        batch += 1;
      }
    },
    // Empieza cuando asoma un poco por el borde inferior, para que la sección ya esté
    // completa cuando el usuario llega a ella.
    { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
  );

  return sharedObserver;
};

export default function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const observer = getObserver();
    if (!observer) {
      // Navegador sin IntersectionObserver: nada se queda invisible.
      el.classList.add("is-visible");
      return undefined;
    }

    // Las secciones que ya están en pantalla al cargar intersectan de inmediato, y si el
    // navegador no ha llegado a pintar el estado inicial salta directo al final: la
    // animación no se ve. Esperar dos fotogramas garantiza ese primer pintado, que es lo
    // que hace que la transición exista para las secciones de arriba.
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => observer.observe(el));
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      observer.unobserve(el);
    };
  }, []);

  return (
    <div ref={ref} className={`reveal ${className}`.trim()} data-reveal-delay={delay || undefined}>
      {children}
    </div>
  );
}

Reveal.propTypes = {
  children: PropTypes.node,
  delay: PropTypes.number,
  className: PropTypes.string,
};
