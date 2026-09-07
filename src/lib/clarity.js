// Microsoft Clarity (mapas de calor y grabaciones de sesión). Se carga solo si hay
// VITE_CLARITY_ID y el build es de producción: en desarrollo no queremos grabar nada ni
// ensuciar las métricas. El enmascarado de textos («Strict») se configura en el panel de
// Clarity, no aquí. Es el mismo snippet oficial, sin depender de que index.html lo lleve.

export function instalarClarity() {
  const id = import.meta.env.VITE_CLARITY_ID;
  if (!id || !import.meta.env.PROD || typeof window === "undefined") return;
  if (window.clarity) return; // ya cargado (HMR / doble llamada)

  window.clarity =
    window.clarity ||
    function () {
      (window.clarity.q = window.clarity.q || []).push(arguments);
    };
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.clarity.ms/tag/${encodeURIComponent(id)}`;
  document.head.appendChild(s);
}
