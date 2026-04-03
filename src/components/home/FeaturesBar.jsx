export default function FeaturesBar() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
        
        {/* Support 24/7 */}
        <div className="flex items-center gap-4 p-6 hover:bg-slate-50 transition-colors cursor-default">
          <div className="flex-shrink-0 text-primary-600">
            <span className="material-symbols-outlined text-4xl">support_agent</span>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm md:text-base uppercase tracking-wide">
              Soporte 24/7
            </h3>
            <p className="text-gray-500 text-xs md:text-sm mt-0.5">Asistencia especializada</p>
          </div>
        </div>

        {/* Pagos Seguros */}
        <div className="flex items-center gap-4 p-6 hover:bg-slate-50 transition-colors cursor-default">
          <div className="flex-shrink-0 text-primary-600">
            <span className="material-symbols-outlined text-4xl">payments</span>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm md:text-base uppercase tracking-wide">
              Pago Seguro
            </h3>
            <p className="text-gray-500 text-xs md:text-sm mt-0.5">Transacciones protegidas</p>
          </div>
        </div>

        {/* Envío Gratis */}
        <div className="flex items-center gap-4 p-6 hover:bg-slate-50 transition-colors cursor-default">
          <div className="flex-shrink-0 text-primary-600">
            <span className="material-symbols-outlined text-4xl">local_shipping</span>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm md:text-base uppercase tracking-wide">
              Envío Gratis
            </h3>
            <p className="text-gray-500 text-xs md:text-sm mt-0.5">En pedidos mayores a $500</p>
          </div>
        </div>

        {/* Garantía */}
        <div className="flex items-center gap-4 p-6 hover:bg-slate-50 transition-colors cursor-default">
          <div className="flex-shrink-0 text-primary-600">
            <span className="material-symbols-outlined text-4xl">assignment_return</span>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm md:text-base uppercase tracking-wide">
              Garantía DENTIX
            </h3>
            <p className="text-gray-500 text-xs md:text-sm mt-0.5">30 días de satisfacción</p>
          </div>
        </div>

      </div>
    </div>
  );
}
