import { useRef, useState } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";

// Adjuntos de los tickets de soporte: el selector (antes de enviar) y la lista (en el hilo).
// El archivo sube directo a Storage con URL firmada al bucket privado `support_attachments`;
// al backend solo viajan las rutas, que él valida contra el bucket antes de registrarlas.

const MAX_FILES = 5;
const MAX_BYTES = 10 * 1024 * 1024;
const TIPOS = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];

const fmtBytes = (n) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** Botón «Adjuntar» + miniaturas de lo elegido, con quitar. Controlado: `files` / `onChange`. */
export function AttachmentPicker({ files, onChange, disabled = false, compact = false }) {
  const inputRef = useRef(null);
  const [previews, setPreviews] = useState({});

  const agregar = (lista) => {
    const nuevos = [];
    for (const f of Array.from(lista || [])) {
      if (!TIPOS.includes(f.type)) {
        toast.error(`«${f.name}»: solo imágenes (JPG, PNG, WebP, GIF) o PDF.`);
        continue;
      }
      if (f.size > MAX_BYTES) {
        toast.error(`«${f.name}» pesa más de 10 MB.`);
        continue;
      }
      nuevos.push(f);
    }
    const total = [...files, ...nuevos].slice(0, MAX_FILES);
    if (files.length + nuevos.length > MAX_FILES) toast.error(`Máximo ${MAX_FILES} archivos por mensaje.`);
    for (const f of total) {
      if (f.type.startsWith("image/") && !previews[keyOf(f)]) {
        const url = URL.createObjectURL(f);
        setPreviews((p) => ({ ...p, [keyOf(f)]: url }));
      }
    }
    onChange(total);
    if (inputRef.current) inputRef.current.value = "";
  };

  const quitar = (idx) => onChange(files.filter((_, i) => i !== idx));

  return (
    <div className={compact ? "flex items-center gap-2 flex-wrap" : "space-y-2"}>
      <input
        ref={inputRef}
        type="file"
        accept={TIPOS.join(",")}
        multiple
        hidden
        onChange={(e) => agregar(e.target.files)}
      />
      <button
        type="button"
        disabled={disabled || files.length >= MAX_FILES}
        onClick={() => inputRef.current?.click()}
        title="Adjuntar imágenes o PDF (máx. 5, 10 MB cada uno)"
        className={`inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:border-[#6b1e96] hover:text-[#6b1e96] transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          compact ? "px-3 py-2.5 text-xs" : "px-3 py-2 text-xs font-semibold"
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">attach_file</span>
        {compact ? (files.length ? `${files.length}/${MAX_FILES}` : "") : "Adjuntar captura o PDF"}
      </button>
      {files.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {files.map((f, i) => (
            <li key={keyOf(f)} className="relative group">
              {f.type.startsWith("image/") ? (
                <img src={previews[keyOf(f)]} alt={f.name} className="w-14 h-14 object-cover rounded-lg border border-slate-200" />
              ) : (
                <div className="w-14 h-14 rounded-lg border border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-500">
                  <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                  <span className="text-[9px]">PDF</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => quitar(i)}
                aria-label={`Quitar ${f.name}`}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-800 text-white text-[11px] leading-none flex items-center justify-center shadow"
              >
                ×
              </button>
              <span className="sr-only">{fmtBytes(f.size)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
AttachmentPicker.propTypes = {
  files: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  compact: PropTypes.bool,
};

/** Adjuntos ya guardados de un mensaje: miniaturas que abren el archivo (URL firmada, 1 h). */
export function AttachmentList({ items, onDark = false }) {
  if (!items?.length) return null;
  return (
    <ul className="flex flex-wrap gap-2 mt-2">
      {items.map((a) => (
        <li key={a.id || a.path}>
          <a
            href={a.url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            title={a.original_name || "Adjunto"}
            className={`block rounded-lg overflow-hidden border ${onDark ? "border-white/30" : "border-slate-200"} ${a.url ? "" : "opacity-50 pointer-events-none"}`}
          >
            {a.is_image && a.url ? (
              <img src={a.url} alt={a.original_name || "Imagen adjunta"} className="w-24 h-24 object-cover" loading="lazy" />
            ) : (
              <div className={`w-24 h-24 flex flex-col items-center justify-center gap-1 ${onDark ? "bg-white/10 text-white" : "bg-slate-50 text-slate-600"}`}>
                <span className="material-symbols-outlined text-[26px]">picture_as_pdf</span>
                <span className="text-[10px] font-semibold">PDF</span>
                {a.size_bytes ? <span className="text-[9px] opacity-70">{fmtBytes(a.size_bytes)}</span> : null}
              </div>
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}
AttachmentList.propTypes = {
  items: PropTypes.array,
  onDark: PropTypes.bool,
};

const keyOf = (f) => `${f.name}_${f.size}_${f.lastModified}`;
