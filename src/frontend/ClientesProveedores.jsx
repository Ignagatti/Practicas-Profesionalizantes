import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  Lock,
  Unlock,
  Users,
  Truck,
} from "lucide-react";

// ── URL base de tu backend ────────────────────────────────────────────────────
const API_URL = "http://localhost:4000/api";

// ── Validaciones locales (igual que en el backend, para feedback inmediato) ───
function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validarCampos({ nombre, apellido, cuit, email }) {
  if (!nombre || !apellido || !cuit) {
    return "Nombre, apellido y CUIT son obligatorios.";
  }
  if (email && !validarEmail(email)) {
    return "El email no tiene un formato válido.";
  }
  return null;
}

// ── Estado inicial del formulario ─────────────────────────────────────────────
const FORM_VACIO = {
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

// ─────────────────────────────────────────────────────────────────────────────
export function ClientesProveedores() {
  const [tipoVista, setTipoVista]           = useState("cliente");
  const [entidades, setEntidades]           = useState([]);
  const [cargando, setCargando]             = useState(false);
  const [error, setError]                   = useState(null);
  const [searchTerm, setSearchTerm]         = useState("");
  const [showAddModal, setShowAddModal]     = useState(false);
  const [showViewModal, setShowViewModal]   = useState(false);
  const [selectedEntidad, setSelectedEntidad] = useState(null);
  const [isEditando, setIsEditando]         = useState(false);
  const [newEntidad, setNewEntidad]         = useState(FORM_VACIO);
  const [errorForm, setErrorForm]           = useState(null);
  const [mensajeExito, setMensajeExito]     = useState(null);

  // ── Cargar datos del backend al montar y al cambiar de vista ────────────────
  useEffect(() => {
    cargarEntidades();
  }, [tipoVista]);

  async function cargarEntidades() {
    setCargando(true);
    setError(null);
    try {
      // Cada tipo tiene su propia ruta
      const ruta = tipoVista === "cliente" ? "/clientes" : "/proveedores";
      const res  = await fetch(`${API_URL}${ruta}`);
      if (!res.ok) throw new Error("Error al cargar los datos.");
      const data = await res.json();
      setEntidades(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  // ── Filtro local de búsqueda ─────────────────────────────────────────────────
  const filtradas = entidades.filter((e) => {
    const termino = searchTerm.toLowerCase();
    return (
      (e.razon_social || "").toLowerCase().includes(termino) ||
      (e.nombre      || "").toLowerCase().includes(termino) ||
      (e.apellido    || "").toLowerCase().includes(termino) ||
      (e.cuit        || "").includes(termino)
    );
  });

  // ── Mostrar mensaje de éxito por 3 segundos ──────────────────────────────────
  function mostrarExito(msg) {
    setMensajeExito(msg);
    setTimeout(() => setMensajeExito(null), 3000);
  }

  // ── Ver detalle ──────────────────────────────────────────────────────────────
  function handleView(entidad) {
    setSelectedEntidad({ ...entidad });
    setIsEditando(false);
    setErrorForm(null);
    setShowViewModal(true);
  }

  // ── Cambiar estado (activo / bloqueado) ──────────────────────────────────────
  async function handleToggleEstado(entidad) {
    const nuevoEstado = entidad.estado === "activo" ? "bloqueado" : "activo";
    const ruta = tipoVista === "cliente" ? "/clientes" : "/proveedores";
    try {
      const res = await fetch(`${API_URL}${ruta}/${entidad.id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...entidad, estado: nuevoEstado }),
      });
      if (!res.ok) throw new Error("No se pudo cambiar el estado.");
      const actualizado = await res.json();
      setEntidades((prev) =>
        prev.map((e) => (e.id === entidad.id ? actualizado : e))
      );
    } catch (err) {
      setError(err.message);
    }
  }

  // ── Eliminar ─────────────────────────────────────────────────────────────────
  async function handleDelete(id) {
    const label = tipoVista === "cliente" ? "cliente" : "proveedor";
    if (!confirm(`¿Está seguro que desea eliminar este ${label}?`)) return;

    const ruta = tipoVista === "cliente" ? "/clientes" : "/proveedores";
    try {
      const res = await fetch(`${API_URL}${ruta}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("No se pudo eliminar.");
      setEntidades((prev) => prev.filter((e) => e.id !== id));
      setShowViewModal(false);
      setSelectedEntidad(null);
      mostrarExito(`${label.charAt(0).toUpperCase() + label.slice(1)} eliminado correctamente.`);
    } catch (err) {
      setError(err.message);
    }
  }

  // ── Guardar edición ──────────────────────────────────────────────────────────
  async function handleSaveChanges() {
    if (!selectedEntidad) return;

    const errorValidacion = validarCampos(selectedEntidad);
    if (errorValidacion) {
      setErrorForm(errorValidacion);
      return;
    }

    const ruta = tipoVista === "cliente" ? "/clientes" : "/proveedores";
    try {
      const res = await fetch(`${API_URL}${ruta}/${selectedEntidad.id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(selectedEntidad),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorForm(data.error || "Error al guardar.");
        return;
      }
      setEntidades((prev) =>
        prev.map((e) => (e.id === selectedEntidad.id ? data : e))
      );
      setIsEditando(false);
      mostrarExito("Datos actualizados correctamente.");
    } catch (err) {
      setErrorForm(err.message);
    }
  }

  // ── Agregar nuevo ────────────────────────────────────────────────────────────
  async function handleAddEntidad(e) {
    e.preventDefault();
    setErrorForm(null);

    const errorValidacion = validarCampos(newEntidad);
    if (errorValidacion) {
      setErrorForm(errorValidacion);
      return;
    }

    const ruta = tipoVista === "cliente" ? "/clientes" : "/proveedores";
    try {
      const res = await fetch(`${API_URL}${ruta}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(newEntidad),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorForm(data.error || "Error al agregar.");
        return;
      }
      setEntidades((prev) => [...prev, data]);
      setShowAddModal(false);
      setNewEntidad(FORM_VACIO);
      mostrarExito(
        `${tipoVista === "cliente" ? "Cliente" : "Proveedor"} agregado correctamente.`
      );
    } catch (err) {
      setErrorForm(err.message);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Mensaje de éxito */}
      {mensajeExito && (
        <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg">
          {mensajeExito}
        </div>
      )}

      {/* Mensaje de error global */}
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X size={16} /></button>
        </div>
      )}

      {/* Header con Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl text-gray-800">
            {tipoVista === "cliente" ? "Clientes" : "Proveedores"}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {filtradas.length}{" "}
            {tipoVista === "cliente" ? "clientes" : "proveedores"} registrados
          </p>
        </div>

        <div className="flex gap-2">
          {/* Toggle Clientes / Proveedores */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => { setTipoVista("cliente"); setSearchTerm(""); }}
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
              onClick={() => { setTipoVista("proveedor"); setSearchTerm(""); }}
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

          {/* Botón agregar */}
          <button
            onClick={() => { setNewEntidad(FORM_VACIO); setErrorForm(null); setShowAddModal(true); }}
            className="flex items-center gap-2 bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors"
          >
            <Plus size={20} />
            Agregar {tipoVista === "cliente" ? "Cliente" : "Proveedor"}
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder={`Buscar ${tipoVista === "cliente" ? "clientes" : "proveedores"}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {cargando ? (
            <div className="p-8 text-center text-gray-500">Cargando...</div>
          ) : filtradas.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No hay {tipoVista === "cliente" ? "clientes" : "proveedores"} para mostrar.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Razón Social</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Contacto</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">CUIT</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Teléfono</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtradas.map((entidad) => (
                  <tr key={entidad.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-800">{entidad.razon_social}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {entidad.nombre} {entidad.apellido}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{entidad.cuit}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{entidad.telefono}</td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleToggleEstado(entidad)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                          entidad.estado === "activo"
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                        }`}
                      >
                        {entidad.estado === "activo" ? (
                          <><Unlock size={12} /> Activo</>
                        ) : (
                          <><Lock size={12} /> Bloqueado</>
                        )}
                      </button>
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

      {/* ── Modal Ver / Editar ────────────────────────────────────────────────── */}
      {showViewModal && selectedEntidad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl text-gray-800">{selectedEntidad.razon_social}</h3>
              <button
                onClick={() => { setShowViewModal(false); setIsEditando(false); setErrorForm(null); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Error dentro del modal */}
              {errorForm && (
                <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-lg text-sm">
                  {errorForm}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Nombre */}
                <Campo label="Nombre" editando={isEditando}
                  value={selectedEntidad.nombre}
                  onChange={(v) => setSelectedEntidad({ ...selectedEntidad, nombre: v })}
                />
                {/* Apellido */}
                <Campo label="Apellido" editando={isEditando}
                  value={selectedEntidad.apellido}
                  onChange={(v) => setSelectedEntidad({ ...selectedEntidad, apellido: v })}
                />
                {/* Razón Social */}
                <div className="col-span-2">
                  <Campo label="Razón Social" editando={isEditando}
                    value={selectedEntidad.razon_social}
                    onChange={(v) => setSelectedEntidad({ ...selectedEntidad, razon_social: v })}
                  />
                </div>
                {/* CUIT */}
                <Campo label="CUIT" editando={isEditando}
                  value={selectedEntidad.cuit}
                  onChange={(v) => setSelectedEntidad({ ...selectedEntidad, cuit: v })}
                />
                {/* Provincia (solo clientes) */}
                {tipoVista === "cliente" && (
                  <Campo label="Provincia" editando={isEditando}
                    value={selectedEntidad.provincia || ""}
                    onChange={(v) => setSelectedEntidad({ ...selectedEntidad, provincia: v })}
                  />
                )}
                {/* Dirección */}
                <div className={tipoVista === "proveedor" ? "col-span-2" : ""}>
                  <Campo label="Dirección" editando={isEditando}
                    value={selectedEntidad.direccion}
                    onChange={(v) => setSelectedEntidad({ ...selectedEntidad, direccion: v })}
                  />
                </div>
                {/* Teléfono */}
                <Campo label="Teléfono" editando={isEditando}
                  value={selectedEntidad.telefono}
                  onChange={(v) => setSelectedEntidad({ ...selectedEntidad, telefono: v })}
                />
                {/* Email */}
                <Campo label="Email" editando={isEditando} type="email"
                  value={selectedEntidad.email}
                  onChange={(v) => setSelectedEntidad({ ...selectedEntidad, email: v })}
                />
              </div>

              {/* Botones */}
              <div className="flex gap-4 pt-4 border-t border-gray-200">
                {isEditando ? (
                  <>
                    <button
                      onClick={() => { setIsEditando(false); setErrorForm(null); }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Guardar Cambios
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditando(true)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <Edit size={16} /> Editar
                    </button>
                    <button
                      onClick={() => handleDelete(selectedEntidad.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                    >
                      <Trash2 size={16} /> Eliminar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Agregar ─────────────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl text-gray-800">
                Agregar {tipoVista === "cliente" ? "Cliente" : "Proveedor"}
              </h3>
              <button
                onClick={() => { setShowAddModal(false); setErrorForm(null); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddEntidad} className="p-6 space-y-4">
              {/* Error dentro del form */}
              {errorForm && (
                <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-lg text-sm">
                  {errorForm}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <InputForm label="Nombre *" value={newEntidad.nombre} required
                  onChange={(v) => setNewEntidad({ ...newEntidad, nombre: v })}
                />
                <InputForm label="Apellido *" value={newEntidad.apellido} required
                  onChange={(v) => setNewEntidad({ ...newEntidad, apellido: v })}
                />
                <div className="col-span-2">
                  <InputForm label="Razón Social *" value={newEntidad.razonSocial} required
                    onChange={(v) => setNewEntidad({ ...newEntidad, razonSocial: v })}
                  />
                </div>
                <InputForm label="CUIT *" value={newEntidad.cuit} required
                  onChange={(v) => setNewEntidad({ ...newEntidad, cuit: v })}
                />
                {tipoVista === "cliente" && (
                  <InputForm label="Provincia" value={newEntidad.provincia}
                    onChange={(v) => setNewEntidad({ ...newEntidad, provincia: v })}
                  />
                )}
                <div className={tipoVista === "proveedor" ? "col-span-2" : ""}>
                  <InputForm label="Dirección *" value={newEntidad.direccion} required
                    onChange={(v) => setNewEntidad({ ...newEntidad, direccion: v })}
                  />
                </div>
                <InputForm label="Teléfono *" value={newEntidad.telefono} required
                  onChange={(v) => setNewEntidad({ ...newEntidad, telefono: v })}
                />
                <InputForm label="Email *" type="email" value={newEntidad.email} required
                  onChange={(v) => setNewEntidad({ ...newEntidad, email: v })}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setErrorForm(null); }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Agregar {tipoVista === "cliente" ? "Cliente" : "Proveedor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Componentes auxiliares ────────────────────────────────────────────────────

// Campo en modo ver / editar
function Campo({ label, value, editando, onChange, type = "text" }) {
  return (
    <div>
      <label className="block text-sm mb-2 text-gray-500">{label}</label>
      {editando ? (
        <input
          type={type}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
      ) : (
        <p className="text-base text-gray-800">{value || "—"}</p>
      )}
    </div>
  );
}

// Input para el formulario de agregar
function InputForm({ label, value, onChange, type = "text", required = false }) {
  return (
    <div>
      <label className="block text-sm mb-2 text-gray-700">{label}</label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        required={required}
      />
    </div>
  );
}
