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
  TrendingUp,
  FileText,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Calendar,
  Filter,
  RefreshCw,
  CreditCard,
  User,
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

  const [showMovimientosModal, setShowMovimientosModal] = useState(false);
  const [entidadMovimientos, setEntidadMovimientos] = useState(null);

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

  function handleVerMovimientos(entidad) {
    setEntidadMovimientos(entidad);
    setShowMovimientosModal(true);
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
                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase font-bold">
                    Contacto / Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase font-bold">
                    Razón Social
                  </th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase font-bold">
                    CUIT/CUIL
                  </th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase font-bold">
                    Teléfono
                  </th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase font-bold">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase font-bold">
                    Saldo
                  </th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase font-bold">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase font-bold">
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
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                      {entidad.nombre} {entidad.apellido}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {entidad.razonSocial || "—"}
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
                        title={`Visualizar ${obtenerNombreEntidad(tipoVista).toLowerCase()}`}
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
          tipoVista={tipoVista}
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
  setShowConfirmDeleteEntidadModal,
  tipoVista,
}) {
  const [activeTab, setActiveTab] = useState("info");
  const nombreTitulo = `${entidad.nombre} ${entidad.apellido}`.trim() || entidad.razonSocial || `ID #${entidad.id}`;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50/80">
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              {isEditando ? `Editar ${obtenerNombreEntidad(tipoVista)}` : `Visualizar ${obtenerNombreEntidad(tipoVista)}: ${nombreTitulo}`}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              CUIT/CUIL: {entidad.cuit || "—"} | Tel: {entidad.telefono || "—"} | Email: {entidad.email || "—"}
            </p>
          </div>
          <button onClick={cerrar} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        {!isEditando && (
          <div className="flex border-b border-gray-200 px-6 bg-gray-50/50 gap-2">
            <button
              onClick={() => setActiveTab("info")}
              className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "info"
                  ? "border-blue-600 text-blue-600 font-bold"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <User size={16} />
              Información General
            </button>
            <button
              onClick={() => setActiveTab("movimientos")}
              className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "movimientos"
                  ? "border-purple-600 text-purple-600 font-bold"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Ver movimientos
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-white">
          {activeTab === "movimientos" && !isEditando ? (
            <MovimientosContent entidad={entidad} tipoVista={tipoVista} />
          ) : (
            <>
              {errorForm && (
                <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-lg text-sm">
                  {errorForm}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
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
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Estado</p>

                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${
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
                        className={`px-3 py-1 rounded-xl text-xs font-semibold ${
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
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          {isEditando ? (
            <>
              <button
                onClick={() => {
                  setIsEditando(false);
                  cancelarEdicionDireccion();
                }}
                className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>

              <button
                onClick={guardar}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm"
              >
                Guardar cambios
              </button>
              
              <button
                type="button"
                onClick={() => setShowConfirmDeleteEntidadModal(true)}
                className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all shadow-sm flex items-center justify-center gap-2"
                title="Eliminar permanentemente"
              >
                <Trash2 size={16} />
                Eliminar
              </button>
            </>
          ) : (
            <div className="flex gap-3 w-full justify-between items-center">
              <button
                type="button"
                onClick={cerrar}
                className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cerrar
              </button>
              <div className="flex gap-3 items-center">
                {activeTab === "info" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveTab("movimientos")}
                      className="px-4 py-2.5 border border-purple-600 text-purple-600 rounded-xl text-sm font-semibold hover:bg-purple-50 transition-colors"
                    >
                      Ver movimientos
                    </button>
                    <button
                      onClick={() => setIsEditando(true)}
                      className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <Edit size={16} />
                      Editar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveTab("info")}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <User size={16} />
                    Ver Información General
                  </button>
                )}
              </div>
            </div>
          )}
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200 text-left">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/80 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">
            Agregar {obtenerNombreEntidad(tipoVista)}
          </h3>
          <button onClick={cerrar} className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={guardar} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 bg-white">
          {errorForm && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-3 py-1.5 rounded-xl text-xs font-medium">
              {errorForm}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-left">
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

          <div className="pt-2.5 border-t border-gray-200 space-y-2.5 text-left">
            <div>
              <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Dirección Principal</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
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

          <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-200 flex justify-end items-center gap-3 shrink-0 rounded-b-2xl -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 mt-3">
            <button
              type="button"
              onClick={cerrar}
              className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm"
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
      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">{label}</label>

      {editando ? (
        <input
          type={type}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3.5 py-1.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all"
        />
      ) : (
        <p className="text-sm font-medium text-gray-800 bg-gray-50 px-3.5 py-1.5 rounded-xl border border-gray-200">{value || "—"}</p>
      )}
    </div>
  );
}

function InputForm({ label, value, onChange, type = "text", required = false }) {
  const labelLimpio = label.replace(/\s*\*$/, '');
  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
        {labelLimpio} {required && <span className="text-red-600 font-bold">*</span>}
      </label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-1.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all"
        required={required}
      />
    </div>
  );
}

function MovimientosContent({ entidad, tipoVista }) {
  const [movimientos, setMovimientos] = useState([]);
  const [resumen, setResumen] = useState({
    total_facturado: 0,
    total_pagado: 0,
    saldo_pendiente: 0,
    saldo_a_favor: 0,
    cantidad_pedidos: 0,
    cantidad_facturas: 0,
    cantidad_pagos: 0,
  });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const esCliente = tipoVista === "cliente";
  const tituloEntidad = esCliente ? "Cliente" : "Proveedor";
  const nombreEntidad =
    entidad?.razonSocial ||
    `${entidad?.nombre || ""} ${entidad?.apellido || ""}`.trim() ||
    `ID #${entidad?.id}`;

  const cargarMovimientos = async () => {
    if (!entidad?.id) return;
    setCargando(true);
    setError(null);
    try {
      const resp = await fetch(`${API_URL}/movimientos/${tipoVista}/${entidad.id}`);
      if (!resp.ok) {
        throw new Error(`Error ${resp.status}: No se pudo cargar los movimientos`);
      }
      const data = await resp.json();
      setMovimientos(data.movimientos || []);
      if (data.resumen) {
        setResumen({
          total_facturado: Number(data.resumen.total_facturado || 0),
          total_pagado: Number(data.resumen.total_pagado || 0),
          saldo_pendiente: Number(data.resumen.saldo_pendiente || 0),
          saldo_a_favor: Number(data.resumen.saldo_a_favor || 0),
          cantidad_pedidos: Number(data.resumen.cantidad_pedidos || 0),
          cantidad_facturas: Number(data.resumen.cantidad_facturas || 0),
          cantidad_pagos: Number(data.resumen.cantidad_pagos || 0),
        });
      }
    } catch (err) {
      console.error("Error al obtener movimientos:", err);
      setError("Ocurrió un inconveniente al consultar los movimientos. Por favor reintente.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarMovimientos();
  }, [entidad?.id, tipoVista]);

  const formatearDinero = (val) =>
    Number(val || 0).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatearFecha = (f) => {
    if (!f) return "—";
    const fechaStr = String(f).split("T")[0];
    const partes = fechaStr.split("-");
    if (partes.length !== 3) return fechaStr;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} className="shrink-0" />
          <div className="flex-1 text-sm font-medium">{error}</div>
          <button
            onClick={cargarMovimientos}
            className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors flex items-center gap-1"
          >
            <RefreshCw size={12} /> Reintentar
          </button>
        </div>
      )}

      {/* Resumen Económico */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Facturado / Pedidos */}
        <div className="bg-blue-50/70 border border-blue-100 p-4 rounded-xl">
          <div className="flex items-center justify-between text-blue-700 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              Total {esCliente ? "Pedidos" : "Facturado"}
            </span>
            <FileText size={18} />
          </div>
          <p className="text-2xl font-black text-blue-900">
            ${formatearDinero(resumen.total_facturado)}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {esCliente ? `${resumen.cantidad_pedidos} pedido(s)` : `${resumen.cantidad_facturas} factura(s)`}
          </p>
        </div>

        {/* Total Pagado */}
        <div className="bg-green-50/70 border border-green-100 p-4 rounded-xl">
          <div className="flex items-center justify-between text-green-700 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              Total Pagado
            </span>
            <CheckCircle size={18} />
          </div>
          <p className="text-2xl font-black text-green-900">
            ${formatearDinero(resumen.total_pagado)}
          </p>
          <p className="text-xs text-green-600 mt-1">
            {resumen.cantidad_pagos} pago(s) registrado(s)
          </p>
        </div>

        {/* Saldo Pendiente */}
        <div className="bg-amber-50/70 border border-amber-100 p-4 rounded-xl">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              Saldo Pendiente
            </span>
            <AlertCircle size={18} />
          </div>
          <p className="text-2xl font-black text-amber-900">
            ${formatearDinero(resumen.saldo_pendiente)}
          </p>
          <p className="text-xs text-amber-600 mt-1">
            {resumen.saldo_pendiente > 0 ? "Monto adeudado" : "Sin deuda pendiente"}
          </p>
        </div>

        {/* Saldo a Favor */}
        <div className="bg-emerald-50/70 border border-emerald-100 p-4 rounded-xl">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              Saldo a Favor
            </span>
            <DollarSign size={18} />
          </div>
          <p className="text-2xl font-black text-emerald-900">
            ${formatearDinero(resumen.saldo_a_favor)}
          </p>
          <p className="text-xs text-emerald-600 mt-1">
            {resumen.saldo_a_favor > 0 ? "Crédito a favor" : "Sin saldo a favor"}
          </p>
        </div>
      </div>

      {/* Tabla de Movimientos */}
      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {cargando ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-2">
            <RefreshCw size={24} className="animate-spin text-red-600" />
            <span className="text-sm font-medium">Cargando historial de movimientos...</span>
          </div>
        ) : movimientos.length === 0 ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-2">
            <FileText size={32} className="text-gray-300" />
            <p className="text-sm font-semibold text-gray-600">
              No existen movimientos para mostrar.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-gray-600 uppercase text-[11px] font-bold tracking-wider border-b border-gray-200">
                <tr>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Tipo Movimiento</th>
                  <th className="p-3">Referencia</th>
                  <th className="p-3 text-right">Monto</th>
                  <th className="p-3 text-center">Estado Pago</th>
                  <th className="p-3">Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white text-sm">
                {movimientos.map((mov, idx) => {
                  const esPago = mov.tipo_movimiento === "pago";
                  return (
                    <tr key={mov.id_movimiento || idx} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-medium text-gray-700 whitespace-nowrap">
                        {formatearFecha(mov.fecha_movimiento)}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                            esPago
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {esPago ? <CreditCard size={12} /> : <FileText size={12} />}
                          {mov.tipo_movimiento}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-gray-800 whitespace-nowrap">
                        {mov.referencia || "—"}
                      </td>
                      <td className="p-3 text-right font-bold whitespace-nowrap">
                        <span className={esPago ? "text-green-600" : "text-gray-900"}>
                          {esPago ? "-" : "+"}${formatearDinero(mov.monto)}
                        </span>
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                            mov.estado_pago === "pagado"
                              ? "bg-green-100 text-green-700"
                              : mov.estado_pago === "parcial"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {mov.estado_pago || "—"}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-gray-500 max-w-xs truncate">
                        {mov.observaciones || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}