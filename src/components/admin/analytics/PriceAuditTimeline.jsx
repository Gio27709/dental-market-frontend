import PropTypes from "prop-types";

export default function PriceAuditTimeline({ timeline = [] }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="bg-fx-panel border border-fx-line rounded-xl p-6 text-center text-fx-muted">
        Sin cambios de precio registrados recientemente.
      </div>
    );
  }

  return (
    <div className="fx-card">
      <h3 className="text-base font-bold text-fx-text mb-4">Timeline de Auditoría de Precios</h3>
      <div className="space-y-3">
        {timeline.map((item, idx) => {
          const oldP = parseFloat(item.old_price || 0);
          const newP = parseFloat(item.new_price || 0);
          const isIncrease = newP > oldP;

          return (
            <div key={idx} className="flex items-center justify-between bg-fx-inset p-3 rounded-2xl border border-fx-line text-xs">
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${isIncrease ? "bg-fx-neg" : "bg-fx-pos"}`} />
                <div>
                  <span className="text-fx-text font-semibold block">{item.product_name}</span>
                  <span className="text-fx-muted text-[11px]">Origen: {item.change_source || "Manual Admin"}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-2 font-bold">
                  <span className="line-through text-gray-500">${oldP.toFixed(2)}</span>
                  <span className="text-fx-muted">→</span>
                  <span className={isIncrease ? "text-fx-neg" : "text-fx-pos"}>${newP.toFixed(2)}</span>
                </div>
                <span className="text-[10px] text-fx-muted">
                  {new Date(item.created_at).toLocaleDateString("es-VE", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

PriceAuditTimeline.propTypes = {
  timeline: PropTypes.arrayOf(
    PropTypes.shape({
      product_name: PropTypes.string,
      old_price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      new_price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      change_source: PropTypes.string,
      created_at: PropTypes.string
    })
  )
};
