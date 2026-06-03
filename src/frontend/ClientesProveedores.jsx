import { useEffect, useState } from "react";
import {
  Search, Plus, Edit, Trash2, Eye, X, Lock, Unlock, Users, Truck,
} from "lucide-react";

const API_URL = "http://localhost:4000/api";

const FORM_VACIO = {
  id: 0,
  nombre: "",
  apellido: "",
  razonSocial: "",
  cuit: "",
  telefono: "",
  email: "",
  estado: "activo",
};

function mapClienteDesdeBackend(cliente) {
  return {
    id: cliente.id_cliente,
    nombre: cliente.nombre || "",
    apellido: cliente.apellido || "",
    razonSocial: cliente.razon_social || "",
    cuit: cliente.cuit_cuil || "",
    telefono: cliente.telefono || "",
    email: cliente.email || "",
    estado: cliente.estado || "activo",
  };
}

function mapClienteParaBackend(cliente) {
  return {
    Nombre: cliente.nombre,
    Apellido: cliente.apellido,
    Telefono: cliente.telefono,
    CUIT_CUIL: cliente.cuit,
    Email: cliente.email,
    Razon_Social: cliente.razonSocial,
  };
}

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validarCampos(entidad) {
  if (!entidad.nombre || !entidad.apellido || !entidad.cuit || !entidad.telefono || !entidad.email) {
    return "Nombre, apellido, CUIT/CUIL, teléfono y email son obligatorios.";
  }

  if (!validarEmail(entidad.email)) {
    return "El email no tiene un formato válido.";
  }

  return null;
}

export function ClientesProveedores() {
  const [tipoVista, setTipoVista] = useState("cliente");
  const [entidades, setEntidades] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEntidad, setSelectedEntidad] = useState(null);
  const [isEditando, setIsEditando] = useState(false);
  const [newEntidad, setNewEntidad] = useState(FORM_VACIO);
  const [errorForm, setErrorForm] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);

  useEffect(() => {
    cargarEntidades();
  }, [tipoVista]);

  async function cargarEntidades() {
    setCargando(true);
    setError(null);

    try {
      if (tipoVista === "proveedor") {
        setEntidades([]);
        return;
      }

      const res = await fetch(`${API_URL}/clientes`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al cargar clientes.");
      }

      setEntidades(data.map(mapClienteDesdeBackend));
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  const filtradas = entidades.filter((entidad) => {
    const termino = searchTerm.toLowerCase();

    return (
      entidad.nombre.toLowerCase().includes(termino) ||
      entidad.apellido.toLowerCase().includes(termino) ||
      entidad.razonSocial.toLowerCase().includes(termino) ||
      entidad.cuit.toLowerCase().includes(termino)
    );
  });

  function mostrarExito(msg) {
    setMensajeExito(msg);
    setTimeout(() => setMensajeExito(null), 3000);
  }

  function handleView(entidad) {
    setSelectedEntidad({ ...entidad });
    setIsEditando(false);
    setErrorForm(null);
    setShowViewModal(true);
  }

  async function handleAddEntidad(e) {
    e.preventDefault();
    setErrorForm(null);

    const errorValidacion = validarCampos(newEntidad);

    if (errorValidacion) {
      setErrorForm(errorValidacion);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/clientes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mapClienteParaBackend(newEntidad)),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorForm(data.error || "Error al agregar cliente.");
        return;
      }

      setEntidades((prev) => [...prev, mapClienteDesdeBackend(data)]);
      setShowAddModal(false);
      setNewEntidad(FORM_VACIO);
      mostrarExito("Cliente agregado correctamente.");
    } catch (err) {
      setErrorForm(err.message);
    }
  }

  async function handleSaveChanges() {
    if (!selectedEntidad) return;

    const errorValidacion = validarCampos(selectedEntidad);

    if (errorValidacion) {
      setErrorForm(errorValidacion);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/clientes/${selectedEntidad.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mapClienteParaBackend(selectedEntidad)),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorForm(data.error || "Error al guardar cambios.");
        return;
      }

      const actualizado = mapClienteDesdeBackend(data);

      setEntidades((prev) =>
        prev.map((entidad) =>
          entidad.id === actualizado.id ? actualizado : entidad
        )
      );

      setSelectedEntidad(actualizado);
      setIsEditando(false);
      mostrarExito("Cliente actualizado correctamente.");
    } catch (err) {
      setErrorForm(err.message);
    }
  }

  async function handleToggleEstado(entidad) {
    try {
      const endpoint =
        entidad.estado === "activo"
          ? `${API_URL}/clientes/${entidad.id}`
          : `${API_URL}/clientes/${entidad.id}/desbloquear`;

      const metodo = entidad.estado === "activo" ? "DELETE" : "PUT";

      const res = await fetch(endpoint, { method: metodo });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo cambiar el estado.");
      }

      const clienteActualizado = mapClienteDesdeBackend(data.cliente || data);

      setEntidades((prev) =>
        prev.map((item) =>
          item.id === clienteActualizado.id ? clienteActualizado : item
        )
      );

      if (selectedEntidad?.id === clienteActualizado.id) {
        setSelectedEntidad(clienteActualizado);
      }

      mostrarExito(
        clienteActualizado.estado === "activo"
          ? "Cliente desbloqueado correctamente."
          : "Cliente bloqueado correctamente."
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete() {
    if (!selectedEntidad) return;
    if (!confirm("¿Está seguro que desea bloquear este cliente?")) return;

    await handleToggleEstado(selectedEntidad);
    setShowViewModal(false);
    setSelectedEntidad(null);
  }

  return (
      <div className="space-y-8 px-8 py-6">
      {mensajeExito && (
        <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg">
          {mensajeExito}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl text-gray-800">
            {tipoVista === "cliente" ? "Clientes" : "Proveedores"}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {filtradas.length} {tipoVista === "cliente" ? "clientes" : "proveedores"} registrados
          </p>
        </div>

        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => {
                setTipoVista("cliente");
                setSearchTerm("");
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                tipoVista === "cliente"
                  ? "bg-white text-red-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Users size={18} />
              Clientes
            </button>

            <button
              onClick={() => {
                setTipoVista("proveedor");
                setSearchTerm("");
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                tipoVista === "proveedor"
                  ? "bg-white text-red-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Truck size={18} />
              Proveedores
            </button>
          </div>

          {tipoVista === "cliente" && (
            <button
              onClick={() => {
                setNewEntidad(FORM_VACIO);
                setErrorForm(null);
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors"
            >
              <Plus size={20} />
              Agregar Cliente
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={`Buscar ${tipoVista === "cliente" ? "clientes" : "proveedores"}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {cargando ? (
            <div className="p-8 text-center text-gray-500">Cargando...</div>
          ) : tipoVista === "proveedor" ? (
            <div className="p-8 text-center text-gray-400">
              El módulo Proveedores todavía no está conectado al backend.
            </div>
          ) : filtradas.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No hay clientes para mostrar.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Razón Social</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Contacto</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">CUIT/CUIL</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Teléfono</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {filtradas.map((entidad) => (
                  <tr key={entidad.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-800">{entidad.razonSocial || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{entidad.nombre} {entidad.apellido}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{entidad.cuit}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{entidad.telefono}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                          entidad.estado === "activo"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {entidad.estado === "activo" ? (
                          <>
                            <Unlock size={12} /> Activo
                          </>
                        ) : (
                          <>
                            <Lock size={12} /> Bloqueado
                          </>
                        )}
                      </span>
                        {entidad.estado === "activo" ? (
                          <>
                            <Unlock size={12} /> Activo
                          </>
                        ) : (
                          <>
                            <Lock size={12} /> Bloqueado
                          </>
                        )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <button
                        onClick={() => handleView(entidad)}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                        title="Ver detalles"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showViewModal && selectedEntidad && (
        <ClienteModal
          entidad={selectedEntidad}
          setEntidad={setSelectedEntidad}
          isEditando={isEditando}
          setIsEditando={setIsEditando}
          cerrar={() => {
            setShowViewModal(false);
            setIsEditando(false);
            setErrorForm(null);
          }}
          errorForm={errorForm}
          guardar={handleSaveChanges}
          bloquear={handleDelete}
        />
      )}

      {showAddModal && (
        <AgregarClienteModal
          entidad={newEntidad}
          setEntidad={setNewEntidad}
          cerrar={() => {
            setShowAddModal(false);
            setErrorForm(null);
          }}
          errorForm={errorForm}
          guardar={handleAddEntidad}
        />
      )}
    </div>
  );
}

function AgregarClienteModal({ entidad, setEntidad, cerrar, errorForm, guardar }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl text-gray-800">Agregar Cliente</h3>
          <button onClick={cerrar} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={guardar} className="p-6 space-y-5">
          {errorForm && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-lg text-sm">
              {errorForm}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputForm label="Nombre *" value={entidad.nombre} required onChange={(v) => setEntidad({ ...entidad, nombre: v })} />
            <InputForm label="Apellido *" value={entidad.apellido} required onChange={(v) => setEntidad({ ...entidad, apellido: v })} />

            <div className="sm:col-span-2">
              <InputForm label="Razón Social" value={entidad.razonSocial} onChange={(v) => setEntidad({ ...entidad, razonSocial: v })} />
            </div>

            <InputForm label="CUIT/CUIL *" value={entidad.cuit} required onChange={(v) => setEntidad({ ...entidad, cuit: v })} />
            <InputForm label="Teléfono *" value={entidad.telefono} required onChange={(v) => setEntidad({ ...entidad, telefono: v })} />

            <div className="sm:col-span-2">
              <InputForm label="Email *" type="email" value={entidad.email} required onChange={(v) => setEntidad({ ...entidad, email: v })} />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={cerrar} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800">
              Guardar Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InputForm({ label, value, onChange, type = "text", required = false }) {
  return (
    <div>
      <label className="block text-sm mb-2 text-gray-700">{label}</label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700"
        required={required}
      />
    </div>
  );
}