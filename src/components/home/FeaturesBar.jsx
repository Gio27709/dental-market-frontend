import useHomeSections from "../../hooks/useHomeSections";

export default function FeaturesBar() {
  const { sections } = useHomeSections();
  const data = sections?.features_bar || {};
  
  const features = data.features || [
    { icon: "support_agent", title: "Soporte 24/7", description: "Asistencia especializada" },
    { icon: "payments", title: "Pago Seguro", description: "Transacciones protegidas" },
    { icon: "local_shipping", title: "Envío Gratis", description: "En pedidos mayores a $500" },
    { icon: "assignment_return", title: "Garantía FORCEPX", description: "30 días de satisfacción" }
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
        
        {features.map((feature, idx) => (
          <div key={idx} className="flex items-center gap-4 p-6 hover:bg-slate-50 transition-colors cursor-default">
            <div className="flex-shrink-0 text-primary-600">
              <span className="material-symbols-outlined text-4xl">{feature.icon}</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm md:text-base uppercase tracking-wide">
                {feature.title}
              </h3>
              <p className="text-gray-500 text-xs md:text-sm mt-0.5">{feature.description}</p>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}
