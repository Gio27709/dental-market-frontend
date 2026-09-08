import { uploadFileDirectly } from "./upload";

// Sube los adjuntos de un ticket al bucket privado `support_attachments` y devuelve sus rutas.
// Va en lib/ (no en el componente) para que el fast refresh de Vite no se queje.
export async function subirAdjuntos(files) {
  const rutas = [];
  for (const f of files) {
    const { path } = await uploadFileDirectly(f, "support_attachments");
    rutas.push(path);
  }
  return rutas;
}
