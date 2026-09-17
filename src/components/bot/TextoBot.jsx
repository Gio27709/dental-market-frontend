import PropTypes from "prop-types";
import { validarRuta, nombreRuta } from "./rutasBot";

// Texto del asistente con un formato mínimo y seguro: párrafos, listas con «- », **negritas**
// y rutas internas (/store-catalog) convertidas en botones. Nunca se inyecta HTML: todo pasa
// por React, que escapa el contenido.

const RUTA_EN_TEXTO = /(^|[\s(«"'])(\/[a-z][\w\-/]*(?:\?[\w=&%+-]*)?)/gi;

function Linea({ texto, onNavegar }) {
  // 1) Rutas internas → botones (solo las permitidas; el resto queda como texto).
  const trozos = [];
  let ultimo = 0;
  for (const m of texto.matchAll(RUTA_EN_TEXTO)) {
    const inicioRuta = m.index + m[1].length;
    const crudo = m[2].replace(/[.,;:)»"']+$/, "");
    const ruta = validarRuta(crudo);
    if (!ruta) continue;
    trozos.push({ tipo: "texto", valor: texto.slice(ultimo, inicioRuta) });
    trozos.push({ tipo: "ruta", valor: ruta });
    ultimo = inicioRuta + crudo.length;
  }
  trozos.push({ tipo: "texto", valor: texto.slice(ultimo) });

  // 2) **negritas** dentro de cada trozo de texto.
  return trozos.map((t, i) => {
    if (t.tipo === "ruta") {
      return (
        <button
          key={i}
          type="button"
          onClick={() => onNavegar(t.valor)}
          className="inline-flex items-center gap-0.5 mx-0.5 px-2 py-0.5 rounded-full bg-[#f1ebf9] text-[#6b1e96] text-[12px] font-semibold hover:bg-[#e6daf5] align-baseline"
        >
          {nombreRuta(t.valor)}
          <span className="material-symbols-outlined text-[14px] leading-none" aria-hidden="true">arrow_forward</span>
        </button>
      );
    }
    return t.valor.split(/(\*\*[^*]+\*\*)/g).map((parte, j) =>
      parte.startsWith("**") && parte.endsWith("**") && parte.length > 4 ? (
        <strong key={`${i}-${j}`} className="font-semibold">{parte.slice(2, -2)}</strong>
      ) : (
        <span key={`${i}-${j}`}>{parte}</span>
      ),
    );
  });
}

export default function TextoBot({ texto, onNavegar }) {
  const bloques = [];
  // El modelo a veces pone la ruta en negrita («**/account/orders**») o entre comillas invertidas:
  // sin quitarlas no se reconocía y no salía el botón de acceso directo.
  const limpio = String(texto || "").replace(/(\*\*|`)(\/[a-z][\w\-/]*(?:\?[\w=&%+-]*)?)\1/gi, "$2");
  for (const cruda of limpio.split("\n")) {
    const linea = cruda.trimEnd();
    const item = linea.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
    const anterior = bloques[bloques.length - 1];
    if (item) {
      if (anterior?.tipo === "lista") anterior.items.push(item[1]);
      else bloques.push({ tipo: "lista", items: [item[1]] });
    } else if (linea.trim()) {
      bloques.push({ tipo: "parrafo", texto: linea.replace(/^#+\s*/, "") });
    }
  }

  return (
    <div className="space-y-1.5 break-words">
      {bloques.map((b, i) =>
        b.tipo === "lista" ? (
          <ul key={i} className="list-disc pl-5 space-y-0.5">
            {b.items.map((it, j) => (
              <li key={j}><Linea texto={it} onNavegar={onNavegar} /></li>
            ))}
          </ul>
        ) : (
          <p key={i}><Linea texto={b.texto} onNavegar={onNavegar} /></p>
        ),
      )}
    </div>
  );
}

TextoBot.propTypes = {
  texto: PropTypes.string,
  onNavegar: PropTypes.func.isRequired,
};

Linea.propTypes = {
  texto: PropTypes.string.isRequired,
  onNavegar: PropTypes.func.isRequired,
};
