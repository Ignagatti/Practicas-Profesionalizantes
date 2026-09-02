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
  Trash2,
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

const DIRECCION_VACIA = {
  id: 0,
  calle: "",
  numero: "",
  ciudad: "",
  provincia: "",
  codigoPostal: "",
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
    saldo: entidad.saldo || 0,
    total_a_favor: entidad.total_a_favor || 0,
    total_en_contra: entidad.total_en_contra || 0,
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

function mapDireccionDesdeBackend(direccion) {
  return {
    id: direccion.id_direccion,
    calle: direccion.calle || "",
    numero: direccion.numero || "",
    ciudad: direccion.ciudad || "",
    provincia: direccion.provincia || "",
    codigoPostal: direccion.codigo_postal || "",
  };
}

function mapDireccionParaBackend(direccion) {
  return {
    Calle: direccion.calle,
    Numero: direccion.numero,
    Ciudad: direccion.ciudad,
    Provincia: direccion.provincia,
    Codigo_Postal: direccion.codigoPostal,
  };
}

function obtenerRuta(tipoVista) {
  return tipoVista === "cliente" ? "/clientes" : "/proveedores";
}

function obtenerNombreEntidad(tipoVista) {
  return tipoVista === "cliente" ? "Cliente" : "Proveedor";
}

function obtenerNombrePlural(tipoVista) {
  return tipoVista === "cliente" ? "clientes" : "proveedores";
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

function validarDireccion(direccion) {
  if (
    !direccion.calle ||
    !direccion.numero ||
    !direccion.ciudad ||
    !direccion.provincia
  ) {
    return "Calle, número, ciudad y provincia son obligatorios.";
  }

  return null;
}

export function EntidadesPanel({
  tipoInicial = "cliente",
  mostrarSelector = false,
}) {
  const [tipoVista, setTipoVista] = useState(tipoInicial);
  const [entidades, setEntidades] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showConfirmDeleteEntidadModal, setShowConfirmDeleteEntidadModal] = useState(false);

  const [selectedEntidad, setSelectedEntidad] = useState(null);
  const [isEditando, setIsEditando] = useState(false);

  const [newEntidad, setNewEntidad] = useState(FORM_VACIO);
  const [direccionNuevaEntidad, setDireccionNuevaEntidad] =
    useState(DIRECCION_VACIA);

  const [direcciones, setDirecciones] = useState([]);
  const [cargandoDirecciones, setCargandoDirecciones] = useState(false);
  const [nuevaDireccion, setNuevaDireccion] = useState(DIRECCION_VACIA);
  const [direccionEditandoId, setDireccionEditandoId] = useState(null);

  const [errorForm, setErrorForm] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);

  useEffect(() => {
    setTipoVista(tipoInicial);
    setSearchTerm("");
    setShowAddModal(false);
    setShowViewModal(false);
    setSelectedEntidad(null);
    setIsEditando(false);
    setErrorForm(null);
    setDirecciones([]);
    setNuevaDireccion(DIRECCION_VACIA);
    setDireccionEditandoId(null);
  }, [tipoInicial]);

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
          data.error || `Error al cargar ${obtenerNombrePlural(tipoVista)}.`
        );
      }

      setEntidades(data.map((item) => mapEntidadDesdeBackend(item, tipoVista)));
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  async function cargarDirecciones(entidadId) {
    setCargandoDirecciones(true);

    try {
      const ruta = obtenerRuta(tipoVista);
      const res = await fetch(`${API_URL}${ruta}/${entidadId}/direcciones`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al cargar direcciones.");
      }

      setDirecciones(data.map(mapDireccionDesdeBackend));
    } catch (err) {
      setError(err.message);
    } finally {
      setCargandoDirecciones(false);
    }
  }

  const filtradas = entidades.filter((entidad) => {
    const termino = searchTerm.toLowerCase();

    return (
      entidad.nombre.toLowerCase().includes(termino) ||
      entidad.apellido.toLowerCase().includes(termino) ||
      entidad.razonSocial.toLowerCase().includes(termino) ||
      entidad.cuit.toLowerCase().includes(termino) ||
      entidad.email.toLowerCase().includes(termino)
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
    setDirecciones([]);
    setNuevaDireccion(DIRECCION_VACIA);
    setDireccionEditandoId(null);
    setShowViewModal(true);
    cargarDirecciones(entidad.id);
  }

  async function handleAddEntidad(e) {
    e.preventDefault();
    setErrorForm(null);

    const errorEntidad = validarCampos(newEntidad);
    if (errorEntidad) {
      setErrorForm(errorEntidad);
      return;
    }

    const errorDireccion = validarDireccion(direccionNuevaEntidad);
    if (errorDireccion) {
      setErrorForm(errorDireccion);
      return;
    }

    try {
      const ruta = obtenerRuta(tipoVista);
      const nombreEntidad = obtenerNombreEntidad(tipoVista);

      const resEntidad = await fetch(`${API_URL}${ruta}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mapEntidadParaBackend(newEntidad)),
      });

      const dataEntidad = await resEntidad.json();

      if (!resEntidad.ok) {
        setErrorForm(
          dataEntidad.error || `Error al agregar ${nombreEntidad.toLowerCase()}.`
        );
        return;
      }

      const entidadCreada = mapEntidadDesdeBackend(dataEntidad, tipoVista);

      const resDireccion = await fetch(
        `${API_URL}${ruta}/${entidadCreada.id}/direcciones`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mapDireccionParaBackend(direccionNuevaEntidad)),
        }
      );

      const dataDireccion = await resDireccion.json();

      if (!resDireccion.ok) {
        setEntidades((prev) => [...prev, entidadCreada]);
        setShowAddModal(false);
        setNewEntidad(FORM_VACIO);
        setDireccionNuevaEntidad(DIRECCION_VACIA);

        setError(
          `${nombreEntidad} creado, pero no se pudo guardar la dirección: ${
            dataDireccion.error || "error desconocido"
          }`
        );

        return;
      }

      setEntidades((prev) => [...prev, entidadCreada]);

      setShowAddModal(false);
      setNewEntidad(FORM_VACIO);
      setDireccionNuevaEntidad(DIRECCION_VACIA);
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
          ? `${API_URL}${ruta}/${entidad.id}/bloquear`
          : `${API_URL}${ruta}/${entidad.id}/desbloquear`;

      const metodo = "PUT";

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

    const accion = selectedEntidad.estado === "activo" ? "bloquear" : "activar";
    const nombreEntidad = obtenerNombreEntidad(tipoVista).toLowerCase();

    if (!confirm(`¿Está seguro que desea ${accion} este ${nombreEntidad}?`)) {
      return;
    }

    await handleToggleEstado(selectedEntidad);
  }

  async function handleEliminarEntidad() {
    if (!selectedEntidad) return;

    try {
      const ruta = obtenerRuta(tipoVista);
      const nombreEntidad = obtenerNombreEntidad(tipoVista);

      const res = await fetch(`${API_URL}${ruta}/${selectedEntidad.id}`, { 
        method: "DELETE" 
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo eliminar.");
      }

      // Si fue bloqueado en lugar de eliminado físicamente (por tener historial)
      if (data.bloqueado) {
        mostrarExito(data.mensaje || `${nombreEntidad} bloqueado por seguridad.`);
      } else {
        mostrarExito(data.mensaje || `${nombreEntidad} eliminado permanentemente.`);
      }

      setShowConfirmDeleteEntidadModal(false);
      setShowViewModal(false);
      cargarEntidades();

    } catch (err) {
      setErrorForm(err.message);
      setShowConfirmDeleteEntidadModal(false);
    }
  }

  async function guardarDireccion(e) {
    e.preventDefault();
    setErrorForm(null);

    if (!selectedEntidad) return;

    const errorDireccion = validarDireccion(nuevaDireccion);
    if (errorDireccion) {
      setErrorForm(errorDireccion);
      return;
    }

    try {
      const ruta = obtenerRuta(tipoVista);

      const url = direccionEditandoId
        ? `${API_URL}${ruta}/direcciones/${direccionEditandoId}`
        : `${API_URL}${ruta}/${selectedEntidad.id}/direcciones`;

      const method = direccionEditandoId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mapDireccionParaBackend(nuevaDireccion)),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorForm(data.error || "Error al guardar dirección.");
        return;
      }

      const direccionGuardada = mapDireccionDesdeBackend(data);

      if (direccionEditandoId) {
        setDirecciones((prev) =>
          prev.map((d) =>
            d.id === direccionGuardada.id ? direccionGuardada : d
          )
        );
        mostrarExito("Dirección actualizada correctamente.");
      } else {
        setDirecciones((prev) => [...prev, direccionGuardada]);
        mostrarExito("Dirección agregada correctamente.");
      }

      setNuevaDireccion(DIRECCION_VACIA);
      setDireccionEditandoId(null);
    } catch (err) {
      setErrorForm(err.message);
    }
  }

  function editarDireccion(direccion) {
    setNuevaDireccion({ ...direccion });
    setDireccionEditandoId(direccion.id);
  }

  function cancelarEdicionDireccion() {
    setNuevaDireccion(DIRECCION_VACIA);
    setDireccionEditandoId(null);
  }

  async function eliminarDireccion(idDireccion) {
    if (!confirm("¿Está seguro que desea eliminar esta dirección?")) return;

    try {
      const ruta = obtenerRuta(tipoVista);

      const res = await fetch(`${API_URL}${ruta}/direcciones/${idDireccion}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al eliminar dirección.");
      }

      setDirecciones((prev) => prev.filter((d) => d.id !== idDireccion));
      mostrarExito("Dirección eliminada correctamente.");

      if (direccionEditandoId === idDireccion) {
        cancelarEdicionDireccion();
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-8">
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
            Gestión de {obtenerNombrePlural(tipoVista)}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {filtradas.length} {obtenerNombrePlural(tipoVista)} registrados
          </p>
        </div>

        <div className="flex gap-2">
          {mostrarSelector && (
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
          )}

          <button
            onClick={() => {
              setNewEntidad(FORM_VACIO);
              setDireccionNuevaEntidad(DIRECCION_VACIA);
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
          <input
            type="text"
            placeholder={`Buscar ${obtenerNombrePlural(tipoVista)}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {cargando ? (
            <div className="p-8 text-center text-gray-500">Cargando...</div>
          ) : filtradas.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No hay {obtenerNombrePlural(tipoVista)} para mostrar.
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
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">
                    Saldo
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
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {entidad.email}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {(() => {
                        const totalCredito = Number(entidad.total_a_favor || 0);
                        const totalDeuda = Number(entidad.total_en_contra || 0);
                        const saldoNeto = totalCredito - totalDeuda;
                        
                        return (
                          <div className="flex flex-col gap-0.5 text-xs min-w-[130px]">
                            {totalCredito > 0 && (
                              <div className="flex justify-between gap-2 text-green-600 font-semibold">
                                <span>A Favor:</span>
                                <span>${totalCredito.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                            )}
                            {totalDeuda > 0 && (
                              <div className="flex justify-between gap-2 text-red-600 font-semibold">
                                <span>En Contra:</span>
                                <span>${totalDeuda.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                            )}
                            <div className="flex justify-between gap-2 border-t border-gray-200 pt-0.5 font-bold text-gray-800">
                              <span>Neto:</span>
                              <span className={saldoNeto > 0 ? "text-green-600" : saldoNeto < 0 ? "text-red-600" : "text-gray-500"}>
                                ${saldoNeto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
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
            setDirecciones([]);
            setNuevaDireccion(DIRECCION_VACIA);
            setDireccionEditandoId(null);
          }}
          errorForm={errorForm}
          guardar={handleSaveChanges}
          cambiarEstado={handleCambiarEstadoDesdeModal}
          direcciones={direcciones}
          cargandoDirecciones={cargandoDirecciones}
          nuevaDireccion={nuevaDireccion}
          setNuevaDireccion={setNuevaDireccion}
          direccionEditandoId={direccionEditandoId}
          guardarDireccion={guardarDireccion}
          editarDireccion={editarDireccion}
          cancelarEdicionDireccion={cancelarEdicionDireccion}
          eliminarDireccion={eliminarDireccion}
          setShowConfirmDeleteEntidadModal={setShowConfirmDeleteEntidadModal}
        />
      )}

      {showAddModal && (
        <AgregarEntidadModal
          tipoVista={tipoVista}
          entidad={newEntidad}
          setEntidad={setNewEntidad}
          direccion={direccionNuevaEntidad}
          setDireccion={setDireccionNuevaEntidad}
          cerrar={() => {
            setShowAddModal(false);
            setErrorForm(null);
            setDireccionNuevaEntidad(DIRECCION_VACIA);
          }}
          errorForm={errorForm}
          guardar={handleAddEntidad}
        />
      )}

      {/* Modal Confirmar Eliminación Entidad */}
      {showConfirmDeleteEntidadModal && selectedEntidad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 border-gray-100">
              Confirmar Eliminación
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              ¿Está seguro que desea eliminar este {obtenerNombreEntidad(tipoVista).toLowerCase()}? 
              <br /><br />
              <strong>Atención:</strong> Si el registro posee historial (pedidos, facturas o guita involucrada), el sistema impedirá el borrado para proteger la balanza.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirmDeleteEntidadModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminarEntidad}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                Confirmar
              </button>
            </div>
          </div>
        </div>
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
  direcciones,
  cargandoDirecciones,
  nuevaDireccion,
  setNuevaDireccion,
  direccionEditandoId,
  guardarDireccion,
  editarDireccion,
  cancelarEdicionDireccion,
  eliminarDireccion,
  setShowConfirmDeleteEntidadModal
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
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

          <DireccionesPanel
            isEditando={isEditando}
            direcciones={direcciones}
            cargandoDirecciones={cargandoDirecciones}
            nuevaDireccion={nuevaDireccion}
            setNuevaDireccion={setNuevaDireccion}
            direccionEditandoId={direccionEditandoId}
            guardarDireccion={guardarDireccion}
            editarDireccion={editarDireccion}
            cancelarEdicionDireccion={cancelarEdicionDireccion}
            eliminarDireccion={eliminarDireccion}
          />

          <div className="flex gap-4 pt-4 border-t border-gray-200">
            {isEditando ? (
              <>
                <button
                  onClick={() => {
                    setIsEditando(false);
                    cancelarEdicionDireccion();
                  }}
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
                
                <button
                  type="button"
                  onClick={() => setShowConfirmDeleteEntidadModal(true)}
                  className="flex-1 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 flex items-center justify-center gap-2"
                  title="Eliminar permanentemente"
                >
                  <Trash2 size={16} />
                  Eliminar
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

function DireccionesPanel({
  isEditando,
  direcciones,
  cargandoDirecciones,
  nuevaDireccion,
  setNuevaDireccion,
  direccionEditandoId,
  guardarDireccion,
  editarDireccion,
  cancelarEdicionDireccion,
  eliminarDireccion,
}) {
  return (
    <div className="pt-4 border-t border-gray-200 space-y-4">
      <div>
        <h4 className="text-base text-gray-800">Direcciones</h4>
        <p className="text-sm text-gray-500">
          Direcciones asociadas a este registro.
        </p>
      </div>

      {cargandoDirecciones ? (
        <p className="text-sm text-gray-400">Cargando direcciones...</p>
      ) : direcciones.length === 0 ? (
        <p className="text-sm text-gray-400">No hay direcciones cargadas.</p>
      ) : (
        <div className="space-y-2">
          {direcciones.map((direccion) => (
            <div
              key={direccion.id}
              className="border border-gray-200 rounded-lg p-3 flex items-start justify-between gap-3"
            >
              <div>
                <p className="text-sm text-gray-800">
                  {direccion.calle} {direccion.numero}
                </p>
                <p className="text-xs text-gray-500">
                  {direccion.ciudad}, {direccion.provincia}
                  {direccion.codigoPostal
                    ? ` - CP ${direccion.codigoPostal}`
                    : ""}
                </p>
              </div>

              {isEditando && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => editarDireccion(direccion)}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => eliminarDireccion(direccion.id)}
                    className="text-red-600 text-sm hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isEditando && (
        <form
          onSubmit={guardarDireccion}
          className="bg-gray-50 rounded-lg p-4 space-y-3"
        >
          <h5 className="text-sm text-gray-700">
            {direccionEditandoId ? "Editar dirección" : "Agregar dirección"}
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InputForm
              label="Calle *"
              value={nuevaDireccion.calle}
              required
              onChange={(v) =>
                setNuevaDireccion({ ...nuevaDireccion, calle: v })
              }
            />

            <InputForm
              label="Número *"
              value={nuevaDireccion.numero}
              required
              onChange={(v) =>
                setNuevaDireccion({ ...nuevaDireccion, numero: v })
              }
            />

            <InputForm
              label="Ciudad *"
              value={nuevaDireccion.ciudad}
              required
              onChange={(v) =>
                setNuevaDireccion({ ...nuevaDireccion, ciudad: v })
              }
            />

            <InputForm
              label="Provincia *"
              value={nuevaDireccion.provincia}
              required
              onChange={(v) =>
                setNuevaDireccion({ ...nuevaDireccion, provincia: v })
              }
            />

            <div className="sm:col-span-2">
              <InputForm
                label="Código Postal"
                value={nuevaDireccion.codigoPostal}
                onChange={(v) =>
                  setNuevaDireccion({
                    ...nuevaDireccion,
                    codigoPostal: v,
                  })
                }
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800"
            >
              {direccionEditandoId ? "Guardar dirección" : "Agregar dirección"}
            </button>

            {direccionEditandoId && (
              <button
                type="button"
                onClick={cancelarEdicionDireccion}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar edición
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

function AgregarEntidadModal({
  tipoVista,
  entidad,
  setEntidad,
  direccion,
  setDireccion,
  cerrar,
  errorForm,
  guardar,
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
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
                onChange={(v) => setEntidad({ ...entidad, razonSocial: v })}
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
              onChange={(v) => setEntidad({ ...entidad, telefono: v })}
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

          <div className="pt-4 border-t border-gray-200 space-y-4">
            <div>
              <h4 className="text-base text-gray-800">Dirección principal</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputForm
                label="Calle *"
                value={direccion.calle}
                required
                onChange={(v) => setDireccion({ ...direccion, calle: v })}
              />

              <InputForm
                label="Número *"
                value={direccion.numero}
                required
                onChange={(v) => setDireccion({ ...direccion, numero: v })}
              />

              <InputForm
                label="Ciudad *"
                value={direccion.ciudad}
                required
                onChange={(v) => setDireccion({ ...direccion, ciudad: v })}
              />

              <InputForm
                label="Provincia *"
                value={direccion.provincia}
                required
                onChange={(v) => setDireccion({ ...direccion, provincia: v })}
              />

              <div className="sm:col-span-2">
                <InputForm
                  label="Código Postal"
                  value={direccion.codigoPostal}
                  onChange={(v) =>
                    setDireccion({ ...direccion, codigoPostal: v })
                  }
                />
              </div>
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