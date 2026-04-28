import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    const adminUser = localStorage.getItem("adminUser");

    if (!adminToken) {
      navigate("/admin");
      return;
    }

    setUser(adminUser);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Panel de Administración UXIA
            </h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Bienvenido, {user}!
          </h2>
          <p className="text-gray-600">
            Has iniciado sesión correctamente en el panel de administración de
            UXIA.
          </p>
        </div>

        {/* Grid de Opciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card: Gestionar Exposiciones */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
            <div className="text-3xl mb-3">📸</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Exposiciones
            </h3>
            <p className="text-gray-600">
              Gestiona las exposiciones y sus contenidos.
            </p>
          </div>

          {/* Card: Gestionar Items */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
            <div className="text-3xl mb-3">🖼️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ítems</h3>
            <p className="text-gray-600">
              Administra los ítems y sus atributos.
            </p>
          </div>

          {/* Card: Gestionar Usuarios */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
            <div className="text-3xl mb-3">👥</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Usuarios
            </h3>
            <p className="text-gray-600">
              Controla los usuarios y sus permisos.
            </p>
          </div>

          {/* Card: Estadísticas */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Estadísticas
            </h3>
            <p className="text-gray-600">
              Visualiza las estadísticas del sistema.
            </p>
          </div>

          {/* Card: Configuración */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
            <div className="text-3xl mb-3">⚙️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Configuración
            </h3>
            <p className="text-gray-600">
              Ajusta la configuración del sistema.
            </p>
          </div>

          {/* Card: Ir al Django Admin */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
            <div className="text-3xl mb-3">🔐</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Django Admin
            </h3>
            <p className="text-gray-600">Accede al administrador de Django.</p>
            <a
              href="/admin/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 text-blue-600 hover:text-blue-700 font-semibold"
            >
              Ir al Django Admin →
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
