import PropTypes from "prop-types";

export default function AccessDeniedView({ requiredArea = "este departamento" }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[420px] bg-fx-panel border border-fx-neg/20 rounded-xl p-8 text-center shadow-2xl relative overflow-hidden">
      {/* Background glow accent */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-fx-neg/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-fx-inset rounded-full blur-3xl pointer-events-none" />

      {/* Icon Shield Lock */}
      <div className="w-20 h-20 rounded-xl bg-fx-neg/10 border border-fx-neg/30 flex items-center justify-center mb-6 text-fx-neg relative">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      </div>

      <h3 className="text-2xl font-semibold text-fx-text mb-2 tracking-tight">Acceso Restringido por Departamento</h3>
      
      <p className="text-fx-muted text-sm max-w-md mb-6 leading-relaxed">
        Tu rol actual no cuenta con los permisos requeridos para consultar el departamento de{" "}
        <span className="text-fx-faint font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-fx-raised border border-fx-line-strong">
          {requiredArea}
        </span>
        . Contacta a Dirección o al Administrador si necesitas acceso.
      </p>

      <div className="inline-flex items-center gap-2 text-xs font-semibold text-fx-neg/80 bg-fx-neg/5 px-4 py-2 rounded-full border border-fx-neg/10">
        <span>🛡️ Código de Error: 403_FORBIDDEN_RBAC</span>
      </div>
    </div>
  );
}

AccessDeniedView.propTypes = {
  requiredArea: PropTypes.string
};
