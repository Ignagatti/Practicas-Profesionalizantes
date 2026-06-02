import { useState } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  Mail,
  Phone,
  MapPin,
  Building,
  Lock,
  Unlock,
} from "lucide-react";

// Datos iniciales de ejemplo
const CLIENTES_INICIALES = [
  {
    id: 1,
    nombre: "Juan",
    apellido: "Pérez",
    razonSocial: "Mueblería Del Sur SA",
    cuit: "30-12345678-9",
    provincia: "Santa Fe",
    direccion: "Av. San Martín 1234, Esperanza",
    telefono: "+54 3496 123456",
    email: "juan.perez@muebleriadelsur.com",
    estado: "activo",
  },
  {
    id: 2,
    nombre: "María",
    apellido: "López",
    razonSocial: "Carpintería López",
    cuit: "27-98765432-1",
    provincia: "Santa Fe",
    direccion: "Calle 25 de Mayo 567, Santa Fe",
    telefono: "+54 342 987654",
    email: "maria.lopez@carpinteria.com",
    estado: "activo",
  },
  {
    id: 3,
    nombre: "Carlos",
    apellido: "Rodríguez",
    razonSocial: "Diseño Interior SA",
    cuit: "30-55566677-8",
    provincia: "Santa Fe",
    direccion: "Bv. Pellegrini 890, Rosario",
    telefono: "+54 341 555666",
    email: "carlos@diseniointerior.com",
    estado: "activo",
  },
  {
    id: 4,
    nombre: "Ana",
    apellido: "Martínez",
    razonSocial: "Muebles Modernos",
    cuit: "27-44455566-7",
    provincia: "Córdoba",
    direccion: "Av. Colón 456, Córdoba Capital",
    telefono: "+54 351 444555",
    email: "ana@mueblesmodernos.com",
    estado: "bloqueado",
  },
];

const CLIENTE_VACIO = {
  nombre: "",
  apellido: "",
  razonSocial: "",
  cuit: "",
  provincia: "",
  direccion: "",
  telefono: "",
  email: "",
  estado: "activo",
};

export function Clientes() {
  const [clientes, setClientes] = useState(CLIENTES_INICIALES);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [isEditingCliente, setIsEditingCliente] = useState(false);
  const [newCliente, setNewCliente] = useState(CLIENTE_VACIO);

  // ── Filtrado ──────────────────────────────────────────────
  const filteredClientes = clientes.filter(
    (cliente) =>
      cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.cuit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Handlers ──────────────────────────────────────────────
  const handleView = (cliente) => {
    setSelectedCliente({ ...cliente });
    setIsEditingCliente(false);
    setShowViewModal(true);
  };

  const handleAddCliente = (e) => {
    e.preventDefault();

    if (clientes.some((c) => c.cuit === newCliente.cuit)) {
      alert("Ya existe un cliente con el mismo CUIT/CUIL. Verifique los datos ingresados.");
      return;
    }

    const newId = Math.max(...clientes.map((c) => c.id), 0) + 1;
    const clienteCompleto = {
      id: newId,
      nombre: newCliente.nombre || "",
      apellido: newCliente.apellido || "",
      razonSocial: newCliente.razonSocial || "",
      cuit: newCliente.cuit || "",
      provincia: newCliente.provincia || "",
      direccion: newCliente.direccion || "",
      telefono: newCliente.telefono || "",
      email: newCliente.email || "",
      estado: "activo",
    };

    setClientes([...clientes, clienteCompleto]);
    alert("Cliente agregado correctamente.");
    setShowAddModal(false);
    setNewCliente(CLIENTE_VACIO);
  };

  const handleSaveClientChanges = () => {
    if (!selectedCliente) return;

    const duplicateCuit = clientes.some(
      (c) => c.cuit === selectedCliente.cuit && c.id !== selectedCliente.id
    );

    if (duplicateCuit) {
      alert("Ya existe un cliente con el mismo CUIT/CUIL. Verifique los datos ingresados.");
      return;
    }

    setClientes((prev) =>
      prev.map((c) => (c.id === selectedCliente.id ? selectedCliente : c))
    );
    alert("Cliente actualizado correctamente.");
    setIsEditingCliente(false);
  };

  const handleToggleEstado = () => {
    if (!selectedCliente) return;
    const nuevoEstado = selectedCliente.estado === "activo" ? "bloqueado" : "activo";
    setSelectedCliente({ ...selectedCliente, estado: nuevoEstado });
  };

  const handleDeleteCliente = () => {
    if (!selectedCliente) return;

    if (
      confirm(
        `¿Está seguro que desea eliminar al cliente ${selectedCliente.nombre} ${selectedCliente.apellido}? Esta acción no se puede deshacer.`
      )
    ) {
      setClientes((prev) => prev.filter((c) => c.id !== selectedCliente.id));
      setShowViewModal(false);
      setSelectedCliente(null);
      alert("Cliente eliminado correctamente.");
    }
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setIsEditingCliente(false);
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl text-gray-800">Gestión de Clientes</h2>
          <p className="text-gray-500 text-sm mt-1">
            {filteredClientes.length} clientes registrados
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors"
        >
          <Plus size={20} />
          Agregar Cliente
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
            placeholder="Buscar por nombre, apellido, razón social o CUIT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tabla de Clientes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Nombre Completo
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  CUIT/CUIL
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Provincia
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
              {filteredClientes.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-400 text-sm"
                  >
                    No se encontraron clientes
                  </td>
                </tr>
              ) : (
                filteredClientes.map((cliente) => (
                  <tr
                    key={cliente.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm text-gray-800">
                          {cliente.nombre} {cliente.apellido}
                        </p>
                        <p className="text-xs text-gray-500">{cliente.razonSocial}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {cliente.cuit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {cliente.provincia}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          cliente.estado === "activo"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {cliente.estado === "activo" ? "Activo" : "Bloqueado"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleView(cliente)}
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

      {/* ── Modal: Agregar Cliente ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl text-gray-800">Agregar Nuevo Cliente</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddCliente} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2 text-gray-700">Nombre *</label>
                  <input
                    type="text"
                    value={newCliente.nombre}
                    onChange={(e) =>
                      setNewCliente({ ...newCliente, nombre: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Juan"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-gray-700">Apellido *</label>
                  <input
                    type="text"
                    value={newCliente.apellido}
                    onChange={(e) =>
                      setNewCliente({ ...newCliente, apellido: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Pérez"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm mb-2 text-gray-700">Razón Social *</label>
                  <input
                    type="text"
                    value={newCliente.razonSocial}
                    onChange={(e) =>
                      setNewCliente({ ...newCliente, razonSocial: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Mueblería SA"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-gray-700">CUIT/CUIL *</label>
                  <input
                    type="text"
                    value={newCliente.cuit}
                    onChange={(e) =>
                      setNewCliente({ ...newCliente, cuit: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="20-12345678-9"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-gray-700">Provincia *</label>
                  <input
                    type="text"
                    value={newCliente.provincia}
                    onChange={(e) =>
                      setNewCliente({ ...newCliente, provincia: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Santa Fe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-gray-700">Teléfono *</label>
                  <input
                    type="tel"
                    value={newCliente.telefono}
                    onChange={(e) =>
                      setNewCliente({ ...newCliente, telefono: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+54 3496 123456"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm mb-2 text-gray-700">Email *</label>
                  <input
                    type="email"
                    value={newCliente.email}
                    onChange={(e) =>
                      setNewCliente({ ...newCliente, email: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="cliente@email.com"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm mb-2 text-gray-700">Dirección *</label>
                  <input
                    type="text"
                    value={newCliente.direccion}
                    onChange={(e) =>
                      setNewCliente({ ...newCliente, direccion: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Calle 123, Ciudad"
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
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Ver / Editar Cliente ── */}
      {showViewModal && selectedCliente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl text-gray-800">
                {isEditingCliente ? "Editar Cliente" : "Detalle del Cliente"}
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
                {/* Nombre */}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Nombre *</p>
                  {isEditingCliente ? (
                    <input
                      type="text"
                      value={selectedCliente.nombre}
                      onChange={(e) =>
                        setSelectedCliente({ ...selectedCliente, nombre: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-base text-gray-800">{selectedCliente.nombre}</p>
                  )}
                </div>

                {/* Apellido */}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Apellido *</p>
                  {isEditingCliente ? (
                    <input
                      type="text"
                      value={selectedCliente.apellido}
                      onChange={(e) =>
                        setSelectedCliente({ ...selectedCliente, apellido: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-base text-gray-800">{selectedCliente.apellido}</p>
                  )}
                </div>

                {/* Razón Social */}
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Razón Social</p>
                  {isEditingCliente ? (
                    <input
                      type="text"
                      value={selectedCliente.razonSocial}
                      onChange={(e) =>
                        setSelectedCliente({ ...selectedCliente, razonSocial: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-base text-gray-800">{selectedCliente.razonSocial}</p>
                  )}
                </div>

                {/* CUIT */}
                <div>
                  <p className="text-sm text-gray-500 mb-1">CUIT/CUIL *</p>
                  {isEditingCliente ? (
                    <input
                      type="text"
                      value={selectedCliente.cuit}
                      onChange={(e) =>
                        setSelectedCliente({ ...selectedCliente, cuit: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-base text-gray-800">{selectedCliente.cuit}</p>
                  )}
                </div>

                {/* Provincia */}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Provincia *</p>
                  {isEditingCliente ? (
                    <input
                      type="text"
                      value={selectedCliente.provincia}
                      onChange={(e) =>
                        setSelectedCliente({ ...selectedCliente, provincia: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-base text-gray-800">{selectedCliente.provincia}</p>
                  )}
                </div>

                {/* Dirección */}
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Dirección *</p>
                  {isEditingCliente ? (
                    <input
                      type="text"
                      value={selectedCliente.direccion}
                      onChange={(e) =>
                        setSelectedCliente({ ...selectedCliente, direccion: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-base text-gray-800">{selectedCliente.direccion}</p>
                  )}
                </div>

                {/* Teléfono */}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Teléfono *</p>
                  {isEditingCliente ? (
                    <input
                      type="tel"
                      value={selectedCliente.telefono}
                      onChange={(e) =>
                        setSelectedCliente({ ...selectedCliente, telefono: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-base text-gray-800">{selectedCliente.telefono}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email *</p>
                  {isEditingCliente ? (
                    <input
                      type="email"
                      value={selectedCliente.email}
                      onChange={(e) =>
                        setSelectedCliente({ ...selectedCliente, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-base text-gray-800">{selectedCliente.email}</p>
                  )}
                </div>

                {/* Estado */}
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Estado</p>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs ${
                        selectedCliente.estado === "activo"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {selectedCliente.estado === "activo" ? "Activo" : "Bloqueado"}
                    </span>
                    {isEditingCliente && (
                      <button
                        onClick={handleToggleEstado}
                        className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                          selectedCliente.estado === "activo"
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-green-50 text-green-600 hover:bg-green-100"
                        }`}
                      >
                        {selectedCliente.estado === "activo" ? (
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
                {isEditingCliente ? (
                  <>
                    <button
                      onClick={() => setIsEditingCliente(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDeleteCliente}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Eliminar
                    </button>
                    <button
                      onClick={handleSaveClientChanges}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Guardar Cambios
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditingCliente(true)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit size={16} />
                    Editar Cliente
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
