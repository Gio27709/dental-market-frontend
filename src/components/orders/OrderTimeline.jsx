import PropTypes from "prop-types";

const STEPS = [
  {
    key: "pending",
    label: "Pedido creado",
    icon: "📝",
    description: "Tu pedido fue registrado",
  },
  {
    key: "approved",
    label: "Pago aprobado",
    icon: "✅",
    description: "El pago fue verificado",
  },
  {
    key: "shipped",
    label: "Enviado",
    icon: "🚚",
    description: "Tu producto está en camino",
  },
  {
    key: "delivered",
    label: "Entregado",
    icon: "📦",
    description: "Producto recibido",
  },
];

// Map various statuses to their step index
const STATUS_TO_STEP = {
  pending: 0,
  pending_approval: 0,
  under_review: 0,
  approved: 1,
  processing: 1,
  shipped: 2,
  delivered: 3,
  cancelled: -1,
  rejected: -1,
};

export default function OrderTimeline({ status }) {
  const currentStep = STATUS_TO_STEP[status] ?? 0;
  const isCancelled = status === "cancelled" || status === "rejected";

  return (
    <div className="w-full py-4">
      {/* Desktop: horizontal */}
      <div className="hidden sm:flex items-start justify-between relative">
        {/* Connecting line */}
        <div
          className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 z-0"
          style={{ left: "10%", right: "10%" }}
        />
        <div
          className="absolute top-5 h-0.5 bg-primary-500 z-0 transition-all duration-500"
          style={{
            left: "10%",
            width: isCancelled
              ? "0%"
              : `${Math.min(currentStep / (STEPS.length - 1), 1) * 80}%`,
          }}
        />

        {STEPS.map((step, idx) => {
          const isCompleted =
            !isCancelled &&
            (idx < currentStep ||
              (status === "delivered" && idx === currentStep));
          const isActive =
            !isCancelled && idx === currentStep && status !== "delivered";
          const isFuture = isCancelled || idx > currentStep;

          return (
            <div
              key={step.key}
              className="flex flex-col items-center z-10 flex-1"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all duration-300 ${
                  isCompleted
                    ? "bg-primary-500 border-primary-500 text-white"
                    : isActive
                      ? "bg-white border-primary-500 text-primary-600 shadow-md ring-4 ring-primary-100"
                      : "bg-gray-100 border-gray-300 text-gray-400"
                }`}
              >
                {isCompleted ? "✓" : step.icon}
              </div>
              <p
                className={`mt-2 text-xs font-semibold text-center ${
                  isActive
                    ? "text-primary-700"
                    : isCompleted
                      ? "text-primary-600"
                      : "text-gray-400"
                }`}
              >
                {step.label}
              </p>
              <p
                className={`text-[10px] text-center mt-0.5 ${isFuture ? "text-gray-300" : "text-gray-500"}`}
              >
                {step.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical */}
      <div className="sm:hidden space-y-4">
        {STEPS.map((step, idx) => {
          const isCompleted =
            !isCancelled &&
            (idx < currentStep ||
              (status === "delivered" && idx === currentStep));
          const isActive =
            !isCancelled && idx === currentStep && status !== "delivered";

          return (
            <div key={step.key} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-all ${
                    isCompleted
                      ? "bg-primary-500 border-primary-500 text-white"
                      : isActive
                        ? "bg-white border-primary-500 text-primary-600 shadow-sm"
                        : "bg-gray-100 border-gray-300 text-gray-400"
                  }`}
                >
                  {isCompleted ? "✓" : step.icon}
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`w-0.5 h-6 mt-1 ${isCompleted ? "bg-primary-500" : "bg-gray-200"}`}
                  />
                )}
              </div>
              <div className="pt-1">
                <p
                  className={`text-sm font-semibold ${
                    isActive
                      ? "text-primary-700"
                      : isCompleted
                        ? "text-primary-600"
                        : "text-gray-400"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cancelled/Rejected message */}
      {isCancelled && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <p className="text-sm font-medium text-red-700">
            {status === "cancelled"
              ? "❌ Orden cancelada"
              : "❌ Pago rechazado"}
          </p>
        </div>
      )}
    </div>
  );
}

OrderTimeline.propTypes = {
  status: PropTypes.string.isRequired,
};
