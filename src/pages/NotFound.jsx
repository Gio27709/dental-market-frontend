import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
      <div className="text-center">
        <h1 className="text-9xl font-extrabold text-gray-200 tracking-widest">
          404
        </h1>
        <div className="bg-primary-600 px-2 text-sm rounded rotate-12 absolute transform -translate-y-1/2 -translate-x-1/2 left-1/2 text-white shadow-lg">
          Página no encontrada
        </div>
        
        <h2 className="mt-8 text-3xl font-bold text-gray-900 tracking-tight sm:text-4xl">
          ¡Ups! Te has perdido en la tienda.
        </h2>
        
        <p className="mt-4 text-gray-500 max-w-lg mx-auto text-lg">
          La página que buscas no existe, posiblemente fue eliminada o el enlace es incorrecto.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5 mr-2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            Volver al Catálogo
          </Link>
          <Link
            to="/account/orders"
            className="text-sm font-semibold text-gray-900 px-6 py-3.5 hover:bg-gray-50 rounded-xl transition-colors"
          >
            Mis Órdenes <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
