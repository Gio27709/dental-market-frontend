import { useState, useCallback, useMemo } from "react";

/**
 * Gestiona la apertura del modal de drill-down desde cualquier tab.
 *
 * Uso:
 *   const drilldown = useDrilldown();
 *   <KpiCard onDrilldown={() => drilldown.open("notifications", {
 *     title: "Notificaciones sin leer",
 *     filters: { is_read: false }
 *   })} />
 *   <DrilldownModal {...drilldown.props} period={period} />
 */
export default function useDrilldown() {
  const [state, setState] = useState(null);

  const open = useCallback((dataset, options = {}) => {
    setState({ dataset, ...options });
  }, []);

  const close = useCallback(() => setState(null), []);

  const props = useMemo(
    () => ({
      isOpen: Boolean(state),
      onClose: close,
      // El modal exige `dataset`; mientras está cerrado se le pasa un valor inerte
      // para no violar el contrato de propTypes en el render inicial.
      dataset: state?.dataset || "orders",
      title: state?.title,
      subtitle: state?.subtitle,
      filters: state?.filters || {}
    }),
    [state, close]
  );

  return { open, close, props };
}
