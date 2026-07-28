import { useState } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Building,
  Mail,
  Phone,
  MapPin,
  X,
  Lock,
  Unlock,
} from "lucide-react";

// Datos iniciales de ejemplo
const PROVEEDORES_INICIALES = [
  {
    id: 1,
    razonSocial: "Maderería Guatambú SA",
    nombre: "Roberto",
    apellido: "Martínez",
    cuit: "30-11222333-4",
    direccion: "Ruta 70 Km 12, Esperanza",
    telefono: "+54 3496 444555",
    email: "ventas@madereria-guatambu.com",
    estado: "activo",
  },
  {
    id: 2,
    razonSocial: "Textiles Premium SRL",
    nombre: "Laura",
    apellido: "Fernández",
    cuit: "30-99888777-6",
    direccion: "Av. Industrial 567, Rafaela",
    telefono: "+54 3492 666777",
    email: "info@textilespremium.com",
    estado: "activo",
  },
  {
    id: 3,
    razonSocial: "Herrajes del Norte",
    nombre: "Martín",
    apellido: "Gómez",
    cuit: "30-55544433-2",
    direccion: "Calle Comercio 890, Santa Fe",
    telefono: "+54 342 888999",
    email: "martin@herrajesdelnorte.com",
    estado: "activo",
  },
];

const PROVEEDOR_VACIO = {
  razonSocial: "",
  nombre: "",
  apellido: "",
  cuit: "",
  direccion: "",
  telefono: "",
  email: "",
  estado: "activo",
};

export function Proveedores() {
  const [proveedores, setProveedores] = useState(PROVEEDORES_INICIALES);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingProveedor, setViewingProveedor] = useState(null);
  const [isEditingView, setIsEditingView] = useState(false);
  const [newProveedor, setNewProveedor] = useState(PROVEEDOR_VACIO);

  // ── Filtrado ──────────────────────────────────────────────
  const filteredProveedores = proveedores.filter(
    (proveedor) =>
      proveedor.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proveedor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proveedor.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proveedor.cuit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Handlers ──────────────────────────────────────────────
  const handleAddProveedor = (e) => {
    e.preventDefault();

    if (proveedores.some((p) => p.cuit === newProveedor.cuit)) {
      alert("Ya existe un proveedor con el mismo CUIT. Verifique los datos ingresados.");
      return;
    }

    const newId = Math.max(...proveedores.map((p) => p.id), 0) + 1;
    const proveedorCompleto = {
      id: newId,
      razonSocial: newProveedor.razonSocial || "",
      nombre: newProveedor.nombre || "",
      apellido: newProveedor.apellido || "",
      cuit: newProveedor.cuit || "",
      direccion: newProveedor.direccion || "",
      telefono: newProveedor.telefono || "",
      email: newProveedor.email || "",
      estado: "activo",
    };

    setProveedores([...proveedores, proveedorCompleto]);
    alert("Proveedor agregado correctamente.");
    setShowAddModal(false);
    setNewProveedor(PROVEEDOR_VACIO);
  };

  const handleView = (proveedor) => {
    setViewingProveedor({ ...proveedor });
    setIsEditingView(false);
    setShowViewModal(true);
  };

  const handleSaveChanges = () => {
    if (!viewingProveedor) return;

    const duplicateCuit = proveedores.some(
      (p) => p.cuit === viewingProveedor.cuit && p.id !== viewingProveedor.id
    );

    if (duplicateCuit) {
      alert("Ya existe un proveedor con el mismo CUIT. Verifique los datos ingresados.");
      return;
    }

    setProveedores((prev) =>
      prev.map((p) => (p.id === viewingProveedor.id ? viewingProveedor : p))
    );
    alert("Proveedor actualizado correctamente.");
    setIsEditingView(false);
  };

  const handleToggleEstado = () => {
    if (!viewingProveedor) return;
    const nuevoEstado = viewingProveedor.estado === "activo" ? "bloqueado" : "activo";
    setViewingProveedor({ ...viewingProveedor, estado: nuevoEstado });
  };

  const handleDeleteProveedor = () => {
    if (!viewingProveedor) return;
    if (
      confirm(
        "¿Está seguro que desea eliminar este proveedor? Esta acción no se puede deshacer."
      )
    ) {
      setProveedores((prev) => prev.filter((p) => p.id !== viewingProveedor.id));
      setShowViewModal(false);
      setViewingProveedor(null);
      alert("Proveedor eliminado correctamente.");
    }
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setIsEditingView(false);
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl text-gray-800">Gestión de Proveedores</h2>
          <p className="text-gray-500 text-sm mt-1">
            {filteredProveedores.length} proveedores registrados
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors"
        >
          <Plus size={20} />
          Agregar Proveedor
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Buscar por razón social, nombre o apellido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tabla de Proveedores */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Razón Social
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  CUIT
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProveedores.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-400 text-sm"
                  >
                    No se encontraron proveedores
                  </td>
                </tr>
              ) : (
                filteredProveedores.map((proveedor) => (
                  <tr
                    key={proveedor.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm text-gray-800">{proveedor.razonSocial}</p>
                        <p className="text-xs text-gray-500">{proveedor.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {proveedor.nombre} {proveedor.apellido}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {proveedor.cuit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          proveedor.estado === "activo"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {proveedor.estado === "activo" ? "Activo" : "Bloqueado"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleView(proveedor)}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                        title="Ver detalles"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal: Agregar Proveedor ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl text-gray-800">Agregar Nuevo Proveedor</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddProveedor} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm mb-2 text-gray-700">
                    Razón Social / Nombre del Proveedor *
                  </label>
                  <input
                    type="text"
                    value={newProveedor.razonSocial}
                    onChange={(e) =>
                      setNewProveedor({ ...newProveedor, razonSocial: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Maderería Del Sur SA"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700">Nombre *</label>
                  <input
                    type="text"
                    value={newProveedor.nombre}
                    onChange={(e) =>
                      setNewProveedor({ ...newProveedor, nombre: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre de contacto"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700">Apellido *</label>
                  <input
                    type="text"
                    value={newProveedor.apellido}
                    onChange={(e) =>
                      setNewProveedor({ ...newProveedor, apellido: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Apellido de contacto"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700">CUIT *</label>
                  <input
                    type="text"
                    value={newProveedor.cuit}
                    onChange={(e) =>
                      setNewProveedor({ ...newProveedor, cuit: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="XX-XXXXXXXX-X"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700">Teléfono *</label>
                  <input
                    type="tel"
                    value={newProveedor.telefono}
                    onChange={(e) =>
                      setNewProveedor({ ...newProveedor, telefono: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+54 XXX XXXXXX"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm mb-2 text-gray-700">Email *</label>
                  <input
                    type="email"
                    value={newProveedor.email}
                    onChange={(e) =>
                      setNewProveedor({ ...newProveedor, email: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="contacto@proveedor.com"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm mb-2 text-gray-700">Dirección *</label>
                  <input
                    type="text"
                    value={newProveedor.direccion}
                    onChange={(e) =>
                      setNewProveedor({ ...newProveedor, direccion: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Calle, número, localidad"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Agregar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Ver / Editar Proveedor ── */}
      {showViewModal && viewingProveedor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl text-gray-800">
                {isEditingView ? "Editar Proveedor" : "Detalle del Proveedor"}
              </h3>
              <button
                onClick={handleCloseViewModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">

                {/* Razón Social */}
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Razón Social *</p>
                  {isEditingView ? (
                    <input
                      type="text"
                      value={viewingProveedor.razonSocial}
                      onChange={(e) =>
                        setViewingProveedor({ ...viewingProveedor, razonSocial: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-base text-gray-800">{viewingProveedor.razonSocial}</p>
                  )}
                </div>

                {/* Nombre */}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Nombre *</p>
                  {isEditingView ? (
                    <input
                      type="text"
                      value={viewingProveedor.nombre}
                      onChange={(e) =>
                        setViewingProveedor({ ...viewingProveedor, nombre: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-base text-gray-800">{viewingProveedor.nombre}</p>
                  )}
                </div>

                {/* Apellido */}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Apellido *</p>
                  {isEditingView ? (
                    <input
                      type="text"
                      value={viewingProveedor.apellido}
                      onChange={(e) =>
                        setViewingProveedor({ ...viewingProveedor, apellido: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-base text-gray-800">{viewingProveedor.apellido}</p>
                  )}
                </div>

                {/* CUIT */}
                <div>
                  <p className="text-sm text-gray-500 mb-1">CUIT *</p>
                  {isEditingView ? (
                    <input
                      type="text"
                      value={viewingProveedor.cuit}
                      onChange={(e) =>
                        setViewingProveedor({ ...viewingProveedor, cuit: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-base text-gray-800">{viewingProveedor.cuit}</p>
                  )}
                </div>

                {/* Teléfono */}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Teléfono *</p>
                  {isEditingView ? (
                    <input
                      type="tel"
                      value={viewingProveedor.telefono}
                      onChange={(e) =>
                        setViewingProveedor({ ...viewingProveedor, telefono: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-base text-gray-800">{viewingProveedor.telefono}</p>
                  )}
                </div>

                {/* Email */}
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Email *</p>
                  {isEditingView ? (
                    <input
                      type="email"
                      value={viewingProveedor.email}
                      onChange={(e) =>
                        setViewingProveedor({ ...viewingProveedor, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-base text-gray-800">{viewingProveedor.email}</p>
                  )}
                </div>

                {/* Dirección */}
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Dirección *</p>
                  {isEditingView ? (
                    <input
                      type="text"
                      value={viewingProveedor.direccion}
                      onChange={(e) =>
                        setViewingProveedor({ ...viewingProveedor, direccion: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-base text-gray-800">{viewingProveedor.direccion}</p>
                  )}
                </div>

                {/* Estado */}
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Estado</p>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs ${
                        viewingProveedor.estado === "activo"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {viewingProveedor.estado === "activo" ? "Activo" : "Bloqueado"}
                    </span>
                    {isEditingView && (
                      <button
                        onClick={handleToggleEstado}
                        className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                          viewingProveedor.estado === "activo"
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-green-50 text-green-600 hover:bg-green-100"
                        }`}
                      >
                        {viewingProveedor.estado === "activo" ? (
                          <>
                            <Lock size={14} />
                            Bloquear
                          </>
                        ) : (
                          <>
                            <Unlock size={14} />
                            Activar
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-4 pt-4 border-t border-gray-200">
                {isEditingView ? (
                  <>
                    <button
                      onClick={() => setIsEditingView(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Guardar Cambios
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditingView(true)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit size={16} />
                      Editar Proveedor
                    </button>
                    <button
                      onClick={handleDeleteProveedor}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} />
                      Eliminar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
