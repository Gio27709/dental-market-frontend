# DentalMarket Frontend MVP

Este es el Producto Mínimo Viable (MVP) para DentalMarket, diseñado con foco prioritario en funcionalidad y velocidad sobre estética. Esta aplicación se conecta a nuestro API robusto ya desplegado en Render.

## Características Incluidas

- ✅ **Home**: Vista de catálogo tipo grilla trayendo productos reales desde Supabase a través del API en Render.
- ✅ **Exploración (Fase 1.1)**: Los usuarios pueden buscar productos (búsqueda reactiva), aplicar filtros básicos, y entrar al Detalle Individual para elegir variaciones disponibles.
- ✅ **Autenticación (JWT)**: Login y Registro completos, persistiendo la sesión en localStorage.
- ✅ **Carrito de Compras (Fase 1.2)**: Sistema avanzado de carrito con persistencia local (`dental_market_cart`). Permite agregar, remover, cambiar cantidades (validando stock disponible) y observar los totales reactivamente en USD y Bolívares (VES) a través de un moderno Drawer lateral.
- ✅ **Checkout**: Procesamiento de órdenes enviando la compra al Backend.
- ✅ **Mi Perfil**: Ruta protegida que refleja la información de usuario y lista todas las órdenes previas.
- ✅ **Diseño Tailwind V4**: Estructuras limpias y responsivas (mobile-first).

### Endpoints implementados en MVP hasta ahora:

- `GET /api/products`: Catálogo general dinámico.
- `GET /api/products/:id`: Fetch individual para vista detallada.
- `GET /api/admin/settings`: Variables monetarias como el Dólar BCV en tiempo real.
- `POST /api/orders`: Encolamiento de Checkouts Escrow.

## Características Pendientes (Post-MVP)

- ⏳ Subida y validación imágenes / archivos (Licencias médicas).
- ⏳ Importación masiva de productos (Bulk via CSV).
- ⏳ Interfaz Administrativa completa.
- ⏳ Deseos / Wishlists.
- ⏳ Complejidad de variaciones (Tallas, colores, sabores) directamente en el Carrito.
- ⏳ Integración con pasarelas de pago (Stripe/PayPal), por ahora se guarda la orden contra el balance del sistema interno financiero de la V1.

---

## 💻 Desarrollo Local

Este proyecto requiere Node.js (preferible v20 o v22) y el manejador de paquetes de tu preferencia (usamos `npm`).

1. **Instalar Dependencias**

```bash
npm install
```

2. **Configurar Entorno**
   Asegúrate de tener tu archivo `.env` en la raíz de este directorio (`/frontend`) con la variable que apunta al servidor principal, por defecto en el MVP es el en vivo:

```env
VITE_API_URL=https://dental-market-backend.onrender.com/api
```

3. **Arrancar Servidor de Desarrollo**

```bash
npm run dev
```

La terminal te entregará un link (normalmente `http://localhost:5173`).

---

## 🚀 Despliegue en Vercel

Soporte nativo para plataformas Serverless de estáticos, idealmente Vercel.

1. Vincula tu repositorio de GitHub `Gio27709/dental-market-backend` (que ahora tiene la carpeta `/frontend` incluida) hacia un nuevo proyecto en Vercel.
2. En la configuración del proyecto (Build & Development Settings):
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend` (CRÍTICO: indícale a Vercel que el código fuente de UI está aquí, de lo contrario buscará e intentará desplegar el backend).
3. En la sección **Environment Variables**, añade:
   - Name: `VITE_API_URL`
   - Value: `https://dental-market-backend.onrender.com/api`
4. Presiona **Deploy**. Vercel se encargará de ejecutar `npm run build` y distribuir la UI a nivel mundial.
