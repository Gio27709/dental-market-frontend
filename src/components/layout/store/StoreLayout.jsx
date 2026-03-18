import { Outlet } from "react-router-dom";
import StoreSidebar from "./StoreSidebar";

export default function StoreLayout() {
  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Sidebar Estático de la Tienda */}
      <StoreSidebar />
      
      {/* Contenido Principal Dinámico */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
