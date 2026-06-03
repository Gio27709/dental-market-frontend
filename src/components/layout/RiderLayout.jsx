import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RiderLayout() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
        {user?.role === "owner" ? (
          <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4 animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 bg-[#c3ff00]/10 rounded-full flex items-center justify-center mb-6 border-8 border-white shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-[#6b1e96]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">Acceso de Propietario</h2>
            <p className="text-gray-500 max-w-md mx-auto text-lg mb-8 leading-relaxed">
              Las funciones operativas de <span className="font-semibold text-[#6b1e96]">Delivery</span> están deshabilitadas para tu rol de Owner.
            </p>
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#6b1e96] hover:bg-[#531575] text-white font-bold rounded-xl shadow-lg shadow-[#6b1e96]/30 transition-all duration-200"
            >
              Ir al Panel Administrativo
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}
