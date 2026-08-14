/**
 * Matriz de permisos analíticos por rol (RBAC), lado cliente.
 *
 * Copia deliberada de `backend/src/config/rolesPermissions.js`. Antes se importaba con una
 * ruta relativa que salía de esta carpeta (`../../../backend/...`); funciona en el layout
 * local, pero backend y frontend viven en repositorios distintos y el build falla en cuanto
 * este repo se clona solo.
 *
 * Esto solo decide qué pestañas se PINTAN. Quien concede o deniega el dato es
 * `authorizeAnalyticsArea` en el backend, así que una copia desfasada nunca abre acceso:
 * como mucho muestra una pestaña que responderá 403. Aun así, al tocar el mapa del backend
 * hay que replicarlo aquí.
 */

export const ROLE_PERMISSIONS_MAP = {
  owner: ["*"],
  admin: ["*"],
  finanzas: [
    "analytics:overview:view",
    "analytics:financials:view",
    "analytics:treasury:view",
    "analytics:export:csv",
    "analytics:export:excel"
  ],
  operaciones: [
    "analytics:overview:view",
    "analytics:sales:view",
    "analytics:funnel:view",
    "analytics:catalog:view",
    "analytics:demand:view",
    "analytics:onboarding:view",
    "analytics:b2b:view",
    "analytics:export:csv"
  ],
  logistica: [
    "analytics:overview:view",
    "analytics:logistics:view",
    "analytics:export:csv"
  ],
  marketing: [
    "analytics:overview:view",
    "analytics:growth:view",
    "analytics:audience:view",
    "analytics:funnel:view",
    "analytics:content:view",
    "analytics:notifications:view",
    "analytics:demand:view",
    "analytics:promotions:view",
    "analytics:export:csv"
  ],
  soporte: [
    "analytics:overview:view",
    "analytics:support:view",
    "analytics:reputation:view",
    "analytics:notifications:view",
    "analytics:export:csv"
  ],
  store: [],
  rider: [],
  dentist: [],
  client: [],
};
