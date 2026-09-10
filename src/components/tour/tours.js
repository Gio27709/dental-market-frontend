/**
 * Definición de los recorridos guiados (tours) de la página.
 *
 * Cada paso apunta a un elemento real de la pantalla marcado con `data-tour="..."`.
 * Si el paso trae `route`, el tour navega hasta esa ruta antes de buscar el elemento.
 * Si el elemento no aparece en unos segundos, el paso se salta solo (por ejemplo,
 * un botón que solo existe para ciertos roles).
 *
 * `mobile` sobreescribe el paso en pantallas angostas (< 768 px): la cabecera se
 * colapsa en un menú ☰ y varios botones viven dentro de él. `mobile: false` oculta
 * el paso en móvil.
 */

export const TOUR_IDS = {
  COMPRADOR: "comprador",
  VENDEDOR: "vendedor",
  CLINICA: "clinica",
  REPARTIDOR: "repartidor",
  CHECKOUT: "checkout",
};

const comprador = {
  id: TOUR_IDS.COMPRADOR,
  nombre: "Guía de la página",
  pasos: [
    {
      target: "search",
      title: "Busca lo que necesitas",
      text: "Escribe el nombre del producto, la marca o la categoría y presiona la lupa. Encontrarás autoclaves, piezas de mano, instrumental y mucho más.",
      route: "/inicio",
      mobile: {
        target: "menu",
        title: "Todo empieza en este menú",
        text: "En el celular, el buscador, tu ubicación de envío y las categorías están dentro de este menú. Tócalo cuando quieras buscar o cambiar de sección.",
      },
    },
    {
      target: "location",
      title: "Tu ubicación de envío",
      text: "Aquí eliges el estado al que quieres recibir tus compras. Con eso te mostramos tiendas cercanas y calculamos el envío correcto.",
      mobile: false,
    },
    {
      target: "currency",
      title: "Precios en USD o en bolívares",
      text: "Cambia la moneda en la que ves los precios. Usamos la tasa oficial del BCV actualizada.",
      mobile: false,
    },
    {
      target: "categories",
      title: "Todas las categorías",
      text: "Abre el catálogo por categorías para explorar sin buscar. Al lado tienes las secciones principales: Tienda, Promociones, Cursos y Publicaciones.",
      mobile: false,
    },
    {
      target: "notifications",
      title: "Tus notificaciones",
      text: "Aquí llegan los avisos de tus pedidos, pagos, respuestas de soporte y novedades. El punto rojo indica que hay algo nuevo.",
    },
    {
      target: "cart",
      title: "Tu carrito",
      text: "Los productos que agregues se guardan aquí. Desde el carrito vas al pago, donde eliges dirección, método de envío y forma de pago.",
    },
    {
      target: "account",
      title: "Tu cuenta",
      text: "Entra o regístrate. Dentro encontrarás tus pedidos, favoritos, direcciones, métodos de pago y el soporte.",
    },
    {
      target: "product-card",
      title: "Así se ve un producto",
      text: "Cada tarjeta muestra el precio, la tienda y la valoración. Toca la imagen o el nombre para ver el detalle, o agrega directo al carrito.",
      placement: "top",
    },
    {
      target: "nav-afiliate",
      title: "¿Tienes una tienda o repartes?",
      text: "Si vendes insumos odontológicos o haces entregas, puedes afiliarte y abrir tu propio panel dentro de la plataforma.",
      mobile: {
        target: "menu",
        title: "¿Tienes una tienda o repartes?",
        text: "Dentro del menú está la opción «Afíliate con nosotros» para abrir tu tienda o unirte como repartidor.",
      },
    },
    {
      target: "help",
      title: "Repite esta guía cuando quieras",
      text: "Este botón vuelve a mostrar el recorrido paso a paso. Si algún día no recuerdas dónde estaba algo, tócalo.",
    },
  ],
};

const vendedor = {
  id: TOUR_IDS.VENDEDOR,
  nombre: "Guía del panel de tienda",
  pasos: [
    {
      target: "store-nav-/store",
      title: "Bienvenido a tu panel",
      text: "Este es el resumen de tu tienda: ventas del día, pedidos pendientes y avisos importantes. Vamos a recorrer cada sección.",
      route: "/store",
      mobile: {
        target: "store-menu",
        title: "Bienvenido a tu panel",
        text: "En el celular, todas las secciones del panel están dentro de este menú. Te contamos qué hace cada una.",
      },
    },
    {
      target: "store-nav-/store/profile",
      title: "Completa tu perfil primero",
      text: "Nombre, logo, ubicación y datos de contacto de tu tienda. Hasta que no esté completo, el resto del panel permanece bloqueado.",
      mobile: false,
    },
    {
      target: "store-nav-/store/products",
      title: "Tus productos",
      text: "Publica, edita y organiza tu catálogo. Cada producto pasa por una revisión rápida antes de salir a la venta.",
      mobile: {
        target: "store-menu",
        title: "Productos y órdenes",
        text: "En «Productos» publicas tu catálogo. En «Órdenes» ves cada pedido, lo preparas y lo marcas como enviado.",
      },
    },
    {
      target: "store-nav-/store/orders",
      title: "Órdenes de compra",
      text: "Aquí llegan los pedidos de tus clientes. Confirma, prepara y marca el envío desde esta pantalla. Un número indica los pendientes.",
      mobile: false,
    },
    {
      target: "store-nav-/store/wallet",
      title: "Tu billetera",
      text: "El dinero de cada venta se libera aquí cuando el comprador confirma la entrega. Desde la billetera solicitas tus retiros.",
      mobile: {
        target: "store-menu",
        title: "Billetera y estadísticas",
        text: "En «Mi Billetera» ves el dinero liberado y pides retiros. En «Estadísticas» sigues tus ventas y productos más vendidos.",
      },
    },
    {
      target: "store-nav-/store/analytics",
      title: "Estadísticas",
      text: "Ventas por día, productos más vistos y de dónde vienen tus clientes, para decidir qué publicar y promocionar.",
      mobile: false,
    },
    {
      target: "store-nav-/store/discounts",
      title: "Descuentos",
      text: "Crea cupones y rebajas por tiempo limitado para mover inventario o premiar a tus clientes frecuentes.",
      mobile: false,
    },
    {
      target: "store-nav-/store/riders",
      title: "Repartidores y sanciones",
      text: "Asigna repartidores de tu zona a tus entregas. En «Sanciones» ves si algún retraso generó una penalidad y cómo resolverla.",
      mobile: {
        target: "store-menu",
        title: "Repartidores y sanciones",
        text: "En «Repartidores» asignas quién entrega tus pedidos. En «Sanciones» ves si algún retraso generó una penalidad.",
      },
    },
    {
      target: "store-back-home",
      title: "Volver a la tienda pública",
      text: "Desde aquí regresas al marketplace como cualquier comprador. Puedes repetir esta guía cuando quieras desde el botón «Ver guía del panel».",
      placement: "top",
      mobile: false,
    },
  ],
};

/**
 * Panel clínico (odontólogos y estudiantes). Sin variantes móviles: el menú lateral
 * se ve siempre. Sin `route` estricta: la puerta de membresía redirige `/clinic` a
 * `/clinic/membership` cuando no hay membresía activa, y el menú existe en ambas.
 */
const clinica = {
  id: TOUR_IDS.CLINICA,
  nombre: "Guía del panel clínico",
  pasos: [
    {
      target: "clinic-brand",
      title: "Bienvenido a Gestión Clínica",
      text: "Este panel te ayuda a administrar los insumos de tu consultorio: qué tienes, qué se está acabando y cuánto gastas. Vamos a recorrer cada sección.",
      routePrefix: "/clinic",
      route: "/clinic",
    },
    {
      target: "clinic-nav-/clinic/membership",
      title: "Tu membresía",
      text: "El panel funciona con una membresía mensual. Aquí la activas subiendo tu comprobante de pago, ves los días que te quedan y la renuevas cuando venza.",
    },
    {
      target: "clinic-nav-/clinic",
      title: "Resumen ejecutivo",
      text: "Vista general de tu inventario: cuántos insumos monitoreas, cuáles están críticos o por agotarse y sugerencias de reposición.",
    },
    {
      target: "clinic-nav-/clinic/inventory",
      title: "Tu inventario clínico",
      text: "Registra cada insumo con su stock actual y su mínimo. Cuando baje de ese umbral, el panel te avisa para que compres a tiempo.",
    },
    {
      target: "clinic-nav-/clinic/subscriptions",
      title: "Suscripciones recurrentes",
      text: "Programa el reabastecimiento periódico de tus insumos esenciales para no tener que pedirlos a mano cada vez.",
    },
    {
      target: "clinic-nav-/clinic/profitability",
      title: "Rentabilidad y gastos",
      text: "Auditoría de compras, gasto por categoría y proyección de presupuesto. Puedes exportar los reportes a PDF o Excel.",
    },
    {
      target: "clinic-back-account",
      title: "Volver a tu cuenta",
      text: "Desde aquí regresas a tu cuenta y a la tienda. Puedes repetir esta guía cuando quieras con «Ver guía del panel».",
      placement: "top",
    },
  ],
};

/** Panel del repartidor (/delivery). Solo arranca cuando ya está afiliado a una tienda. */
const repartidor = {
  id: TOUR_IDS.REPARTIDOR,
  nombre: "Guía del panel de entregas",
  pasos: [
    {
      target: "rider-store",
      title: "Tu tienda asignada",
      text: "Trabajas para esta tienda. Aquí ves su dirección de recogida, cómo llegar y un botón para llamarla si algo no cuadra.",
    },
    {
      target: "rider-stats",
      title: "Tus números",
      text: "Entregas completadas, en curso y tu desempeño. Se actualizan solos con cada entrega que cierras.",
    },
    {
      target: "rider-tabs",
      title: "En curso, completadas y fallidas",
      text: "«En Curso» son las entregas que tienes hoy. Las que cierres pasan a «Completadas»; las que no se pudieron entregar, a «Fallidas» con su motivo.",
    },
    {
      target: "rider-job",
      title: "Aquí llegan tus entregas",
      text: "Cada pedido aparece como una tarjeta con dirección, cliente y botones para abrir el mapa o llamar. Marca «Recogido» al salir de la tienda, «Llegué» al llegar y «Entregado» cuando el cliente reciba.",
      placement: "top",
    },
    {
      target: "panel-notifications",
      title: "Avisos de nuevas entregas",
      text: "Cuando la tienda te asigne un pedido te llega aquí. Si no ves nada, toca «Actualizar» en la bandeja.",
    },
  ],
};

/** Primer pago (/checkout, paso 1). Sin variantes móviles: las tarjetas se apilan y el foco las sigue. */
const checkout = {
  id: TOUR_IDS.CHECKOUT,
  nombre: "Guía del pago",
  pasos: [
    {
      target: "checkout-delivery",
      title: "¿Cómo quieres recibirlo?",
      text: "Envío nacional por encomienda, delivery local si la tienda está en tu mismo estado, o retiro en tienda. El costo del envío cambia según lo que elijas.",
    },
    {
      target: "checkout-address",
      title: "Datos de destino y contacto",
      text: "Quién recibe, cédula, teléfono y la dirección exacta. Puedes elegir una dirección guardada o marcar el punto en el mapa.",
    },
    {
      target: "checkout-payment",
      title: "Método de pago",
      text: "Elige cómo vas a pagar. Al confirmar verás los datos de la cuenta y en el siguiente paso subes el comprobante.",
    },
    {
      target: "checkout-summary",
      title: "Resumen y cupón",
      text: "Revisa productos, envío y total en USD y bolívares. Si tienes un cupón del boletín, aplícalo aquí antes de confirmar.",
      placement: "top",
    },
    {
      target: "checkout-submit",
      title: "Confirmar el pedido",
      text: "Al confirmar se crea tu pedido y pasas a subir el comprobante. Tu dinero queda protegido hasta que confirmes que recibiste el pedido.",
      placement: "top",
    },
  ],
};

export const TOURS = {
  [TOUR_IDS.COMPRADOR]: comprador,
  [TOUR_IDS.VENDEDOR]: vendedor,
  [TOUR_IDS.CLINICA]: clinica,
  [TOUR_IDS.REPARTIDOR]: repartidor,
  [TOUR_IDS.CHECKOUT]: checkout,
};
