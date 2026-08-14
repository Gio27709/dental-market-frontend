import {
  Bell,
  DoorOpen,
  FileText,
  Filter,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  Magnet,
  Map,
  MessagesSquare,
  Puzzle,
  ShoppingCart,
  Star,
  Tags,
  Ticket,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from "lucide-react";

/**
 * Registro único de las áreas de analíticas, agrupadas por departamento.
 *
 * `permissionKey` es la clave que consulta `useAnalyticsPermissions`, y `key`
 * es tanto el valor de `?tab=` en la URL como la clave del componente en
 * `AdminAnalytics.jsx`. Para añadir un área hay que tocar además
 * `useAnalyticsPermissions.js` y el mapa `TAB_COMPONENTS`.
 */
export const TAB_GROUPS = [
  {
    label: "Negocio",
    tabs: [
      { key: "executive", label: "Resumen ejecutivo", icon: LayoutDashboard, permissionKey: "executive" },
      { key: "financials", label: "Finanzas y escrow", icon: Wallet, permissionKey: "financials" },
      { key: "sales", label: "Ventas y operaciones", icon: ShoppingCart, permissionKey: "sales" },
      { key: "treasury", label: "Tesorería y divisas", icon: Landmark, permissionKey: "treasury" },
    ],
  },
  {
    label: "Catálogo y oferta",
    tabs: [
      { key: "catalog", label: "Catálogo y márgenes", icon: Tags, permissionKey: "catalog" },
      { key: "promotions", label: "Promociones y cupones", icon: Ticket, permissionKey: "promotions" },
      { key: "demand", label: "Demanda latente", icon: Magnet, permissionKey: "demand" },
    ],
  },
  {
    label: "Clientes",
    tabs: [
      { key: "audience", label: "Audiencia y tráfico", icon: Users, permissionKey: "audience" },
      { key: "funnel", label: "Embudo y búsqueda", icon: Filter, permissionKey: "funnel" },
      { key: "growth", label: "Growth y comunidad", icon: TrendingUp, permissionKey: "growth" },
      { key: "content", label: "Contenido", icon: FileText, permissionKey: "content" },
      { key: "reputation", label: "Reputación y reseñas", icon: Star, permissionKey: "reputation" },
    ],
  },
  {
    label: "Operaciones",
    tabs: [
      { key: "logistics", label: "Logística y envíos", icon: Truck, permissionKey: "logistics" },
      { key: "logisticsDeep", label: "Trazabilidad y geografía", icon: Map, permissionKey: "logisticsDeep" },
      { key: "onboarding", label: "Onboarding y altas", icon: DoorOpen, permissionKey: "onboarding" },
      { key: "b2b", label: "Módulos B2B", icon: Puzzle, permissionKey: "b2b" },
    ],
  },
  {
    label: "Servicio",
    tabs: [
      { key: "support", label: "Soporte y calidad", icon: LifeBuoy, permissionKey: "support" },
      { key: "supportDeep", label: "Conversaciones", icon: MessagesSquare, permissionKey: "supportDeep" },
      { key: "notifications", label: "Notificaciones", icon: Bell, permissionKey: "notifications" },
    ],
  },
];

/** Metadatos planos por clave, para que la cabecera sepa qué título mostrar. */
export const TAB_INDEX = Object.fromEntries(
  TAB_GROUPS.flatMap((group) =>
    group.tabs.map((tab) => [tab.key, { ...tab, group: group.label }])
  )
);
