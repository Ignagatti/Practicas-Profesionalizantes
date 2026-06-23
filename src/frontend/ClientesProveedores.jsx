import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Edit,
  Eye,
  X,
  Lock,
  Unlock,
  Users,
  Truck,
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

function mapEntidadDesdeBackend(entidad, tipoVista) {
  return {
    id: tipoVista === "cliente" ? entidad.id_cliente : entidad.id_proveedor,
    nombre: entidad.nombre || "",
    apellido: entidad.apellido || "",
    razonSocial: entidad.razon_social || "",
    cuit: entidad.cuit_cuil || "",
    telefono: entidad.telefono || "",
    email: entidad.email || "",
    estado: entidad.estado || "activo",
  };
}

function mapEntidadParaBackend(entidad) {
  return {
    Nombre: entidad.nombre,
    Apellido: entidad.apellido,
    Telefono: entidad.telefono,
    CUIT_CUIL: entidad.cuit,
    Email: entidad.email,
    Razon_Social: entidad.razonSocial,
  };
}

function obtenerRuta(tipoVista) {
  return tipoVista === "cliente" ? "/clientes" : "/proveedores";
}

function obtenerNombreEntidad(tipoVista) {
  return tipoVista === "cliente" ? "Cliente" : "Proveedor";
}

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validarCampos(entidad) {
  if (
    !entidad.nombre ||
    !entidad.apellido ||
    !entidad.cuit ||
    !entidad.telefono ||
    !entidad.email
  ) {
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
      const ruta = obtenerRuta(tipoVista);

      const res = await fetch(`${API_URL}${ruta}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            `Error al cargar ${
              tipoVista === "cliente" ? "clientes" : "proveedores"
            }.`
        );
      }

      setEntidades(data.map((item) => mapEntidadDesdeBackend(item, tipoVista)));
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
      const ruta = obtenerRuta(tipoVista);
      const nombreEntidad = obtenerNombreEntidad(tipoVista);

      const res = await fetch(`${API_URL}${ruta}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mapEntidadParaBackend(newEntidad)),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorForm(
          data.error || `Error al agregar ${nombreEntidad.toLowerCase()}.`
        );
        return;
      }

      setEntidades((prev) => [
        ...prev,
        mapEntidadDesdeBackend(data, tipoVista),
      ]);

      setShowAddModal(false);
      setNewEntidad(FORM_VACIO);
      mostrarExito(`${nombreEntidad} agregado correctamente.`);
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
      const ruta = obtenerRuta(tipoVista);
      const nombreEntidad = obtenerNombreEntidad(tipoVista);

      const res = await fetch(`${API_URL}${ruta}/${selectedEntidad.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mapEntidadParaBackend(selectedEntidad)),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorForm(
          data.error || `Error al guardar ${nombreEntidad.toLowerCase()}.`
        );
        return;
      }

      const actualizado = mapEntidadDesdeBackend(data, tipoVista);

      setEntidades((prev) =>
        prev.map((entidad) =>
          entidad.id === actualizado.id ? actualizado : entidad
        )
      );

      setSelectedEntidad(actualizado);
      setIsEditando(false);
      mostrarExito(`${nombreEntidad} actualizado correctamente.`);
    } catch (err) {
      setErrorForm(err.message);
    }
  }

  async function handleToggleEstado(entidad) {
    try {
      const ruta = obtenerRuta(tipoVista);
      const nombreEntidad = obtenerNombreEntidad(tipoVista);

      const endpoint =
        entidad.estado === "activo"
          ? `${API_URL}${ruta}/${entidad.id}`
          : `${API_URL}${ruta}/${entidad.id}/desbloquear`;

      const metodo = entidad.estado === "activo" ? "DELETE" : "PUT";

      const res = await fetch(endpoint, { method: metodo });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo cambiar el estado.");
      }

      const respuestaEntidad =
        tipoVista === "cliente" ? data.cliente || data : data.proveedor || data;

      const actualizado = mapEntidadDesdeBackend(respuestaEntidad, tipoVista);

      setEntidades((prev) =>
        prev.map((item) => (item.id === actualizado.id ? actualizado : item))
      );

      if (selectedEntidad && selectedEntidad.id === actualizado.id) {
        setSelectedEntidad(actualizado);
      }

      mostrarExito(
        actualizado.estado === "activo"
          ? `${nombreEntidad} desbloqueado correctamente.`
          : `${nombreEntidad} bloqueado correctamente.`
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCambiarEstadoDesdeModal() {
    if (!selectedEntidad) return;

    const accion =
      selectedEntidad.estado === "activo" ? "bloquear" : "activar";

    const nombreEntidad = obtenerNombreEntidad(tipoVista).toLowerCase();

    if (
      !confirm(
        `¿Está seguro que desea ${accion} este ${nombreEntidad}?`
      )
    ) {
      return;
    }

    await handleToggleEstado(selectedEntidad);
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
            {filtradas.length}{" "}
            {tipoVista === "cliente" ? "clientes" : "proveedores"} registrados
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

          <button
            onClick={() => {
              setNewEntidad(FORM_VACIO);
              setErrorForm(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors"
          >
            <Plus size={20} />
            Agregar {obtenerNombreEntidad(tipoVista)}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder={`Buscar ${
              tipoVista === "cliente" ? "clientes" : "proveedores"
            }...`}
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
          ) : filtradas.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No hay{" "}
              {tipoVista === "cliente" ? "clientes" : "proveedores"} para
              mostrar.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">
                    Razón Social
                  </th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">
                    Contacto
                  </th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">
                    CUIT/CUIL
                  </th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">
                    Teléfono
                  </th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {filtradas.map((entidad) => (
                  <tr
                    key={entidad.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {entidad.razonSocial || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {entidad.nombre} {entidad.apellido}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {entidad.cuit}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {entidad.telefono}
                    </td>
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
        <EntidadModal
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
          cambiarEstado={handleCambiarEstadoDesdeModal}
        />
      )}

      {showAddModal && (
        <AgregarEntidadModal
          tipoVista={tipoVista}
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

function EntidadModal({
  entidad,
  setEntidad,
  isEditando,
  setIsEditando,
  cerrar,
  errorForm,
  guardar,
  cambiarEstado,
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl text-gray-800">
            {isEditando ? "Editar registro" : "Detalle del registro"}
          </h3>
          <button onClick={cerrar} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {errorForm && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-lg text-sm">
              {errorForm}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo
              label="Nombre"
              value={entidad.nombre}
              editando={isEditando}
              onChange={(v) => setEntidad({ ...entidad, nombre: v })}
            />

            <Campo
              label="Apellido"
              value={entidad.apellido}
              editando={isEditando}
              onChange={(v) => setEntidad({ ...entidad, apellido: v })}
            />

            <div className="sm:col-span-2">
              <Campo
                label="Razón Social"
                value={entidad.razonSocial}
                editando={isEditando}
                onChange={(v) => setEntidad({ ...entidad, razonSocial: v })}
              />
            </div>

            <Campo
              label="CUIT/CUIL"
              value={entidad.cuit}
              editando={isEditando}
              onChange={(v) => setEntidad({ ...entidad, cuit: v })}
            />

            <Campo
              label="Teléfono"
              value={entidad.telefono}
              editando={isEditando}
              onChange={(v) => setEntidad({ ...entidad, telefono: v })}
            />

            <div className="sm:col-span-2">
              <Campo
                label="Email"
                value={entidad.email}
                type="email"
                editando={isEditando}
                onChange={(v) => setEntidad({ ...entidad, email: v })}
              />
            </div>

            <div className="sm:col-span-2">
              <p className="text-sm text-gray-500 mb-1">Estado</p>

              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${
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

                {isEditando && (
                  <button
                    type="button"
                    onClick={cambiarEstado}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      entidad.estado === "activo"
                        ? "bg-red-50 text-red-700 hover:bg-red-100"
                        : "bg-green-50 text-green-700 hover:bg-green-100"
                    }`}
                  >
                    {entidad.estado === "activo" ? "Bloquear" : "Activar"}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-200">
            {isEditando ? (
              <>
                <button
                  onClick={() => setIsEditando(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>

                <button
                  onClick={guardar}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Guardar cambios
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditando(true)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Edit size={16} />
                Editar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AgregarEntidadModal({
  tipoVista,
  entidad,
  setEntidad,
  cerrar,
  errorForm,
  guardar,
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl text-gray-800">
            Agregar {obtenerNombreEntidad(tipoVista)}
          </h3>
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
            <InputForm
              label="Nombre *"
              value={entidad.nombre}
              required
              onChange={(v) => setEntidad({ ...entidad, nombre: v })}
            />

            <InputForm
              label="Apellido *"
              value={entidad.apellido}
              required
              onChange={(v) => setEntidad({ ...entidad, apellido: v })}
            />

            <div className="sm:col-span-2">
              <InputForm
                label="Razón Social"
                value={entidad.razonSocial}
                onChange={(v) =>
                  setEntidad({ ...entidad, razonSocial: v })
                }
              />
            </div>

            <InputForm
              label="CUIT/CUIL *"
              value={entidad.cuit}
              required
              onChange={(v) => setEntidad({ ...entidad, cuit: v })}
            />

            <InputForm
              label="Teléfono *"
              value={entidad.telefono}
              required
              onChange={(v) =>
                setEntidad({ ...entidad, telefono: v })
              }
            />

            <div className="sm:col-span-2">
              <InputForm
                label="Email *"
                type="email"
                value={entidad.email}
                required
                onChange={(v) => setEntidad({ ...entidad, email: v })}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={cerrar}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800"
            >
              Guardar {obtenerNombreEntidad(tipoVista)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Campo({ label, value, editando, onChange, type = "text" }) {
  return (
    <div>
      <label className="block text-sm mb-2 text-gray-500">{label}</label>

      {editando ? (
        <input
          type={type}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700"
        />
      ) : (
        <p className="text-base text-gray-800">{value || "—"}</p>
      )}
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