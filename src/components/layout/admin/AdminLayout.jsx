import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout() {
  return (
    <div className="flex bg-gray-50">
      {/* Sidebar Estático de Administrador */}
      <AdminSidebar />
      
      {/* Contenido Principal Dinámico */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
