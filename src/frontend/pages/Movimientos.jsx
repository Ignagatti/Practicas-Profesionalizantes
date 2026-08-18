import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Eye,
  FileText,
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  X,
  AlertCircle,
  RefreshCw,
  Building2,
  CheckCircle,
} from "lucide-react";

const API_URL = "http://localhost:4000/api";


// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function formatearDinero(valor) {
  return Number(valor || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}


function obtenerFechaSimple(fecha) {
  if (!fecha) {
    return "";
  }

  return String(fecha).split("T")[0];
}


function formatearFecha(fecha) {
  const fechaSimple = obtenerFechaSimple(fecha);

  if (!fechaSimple) {
    return "—";
  }

  const partes = fechaSimple.split("-");

  if (partes.length !== 3) {
    return fechaSimple;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}


async function leerRespuesta(respuesta) {
  const contentType =
    respuesta.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return respuesta.json();
  }

  const texto = await respuesta.text();

  return {
    mensaje: texto,
  };
}


function normalizarMovimiento(movimiento) {
  return {
    ...movimiento,

    tipo_movimiento:
      movimiento.tipo_movimiento ??
      movimiento.Tipo_Movimiento ??
      "",

    id_movimiento:
      movimiento.id_movimiento ??
      movimiento.Id_Movimiento ??
      movimiento.id,

    fecha_movimiento:
      movimiento.fecha_movimiento ??
      movimiento.Fecha_Movimiento ??
      "",

    id_proveedor:
      movimiento.id_proveedor ??
      movimiento.Id_Proveedor ??
      null,

    proveedor:
      movimiento.proveedor ??
      movimiento.Proveedor ??
      "Proveedor no disponible",

    monto: Number(
      movimiento.monto ??
      movimiento.Monto ??
      0
    ),

    impacto_saldo: Number(
      movimiento.impacto_saldo ??
      movimiento.Impacto_Saldo ??
      0
    ),

    estado_pago:
      movimiento.estado_pago ??
      movimiento.Estado_Pago ??
      "",

    referencia:
      movimiento.referencia ??
      movimiento.Referencia ??
      "",

    observaciones:
      movimiento.observaciones ??
      movimiento.Observaciones ??
      "",

    id_medio_pago:
      movimiento.id_medio_pago ??
      movimiento.Id_Medio_Pago ??
      null,
  };
}


function normalizarResumen(resumen) {
  return {
    total_facturado: Number(
      resumen?.total_facturado ?? 0
    ),

    total_pagado: Number(
      resumen?.total_pagado ?? 0
    ),

    total_adeudado: Number(
      resumen?.total_adeudado ?? 0
    ),

    cantidad_facturas: Number(
      resumen?.cantidad_facturas ?? 0
    ),

    cantidad_pagos: Number(
      resumen?.cantidad_pagos ?? 0
    ),

    facturas_pendientes: Number(
      resumen?.facturas_pendientes ?? 0
    ),

    facturas_parciales: Number(
      resumen?.facturas_parciales ?? 0
    ),

    facturas_pagadas: Number(
      resumen?.facturas_pagadas ?? 0
    ),
  };
}


function obtenerEstadoConfig(estado) {
  const estados = {
    pendiente: {
      texto: "Pendiente",
      clase: "bg-yellow-100 text-yellow-700",
    },

    parcial: {
      texto: "Pago parcial",
      clase: "bg-blue-100 text-blue-700",
    },

    pagado: {
      texto: "Pagado",
      clase: "bg-green-100 text-green-700",
    },

    anulado: {
      texto: "Anulado",
      clase: "bg-red-100 text-red-700",
    },
  };

  return (
    estados[String(estado).toLowerCase()] || {
      texto: estado || "Sin estado",
      clase: "bg-gray-100 text-gray-700",
    }
  );
}


// =====================================================
// COMPONENTE
// =====================================================

export function Movimientos() {
  const [movimientos, setMovimientos] = useState([]);

  const [resumen, setResumen] = useState(
    normalizarResumen({})
  );

  const [cargando, setCargando] = useState(true);
  const [cargandoDetalle, setCargandoDetalle] =
    useState(false);

  const [error, setError] = useState("");
  const [errorDetalle, setErrorDetalle] =
    useState("");

  const [tipoFiltro, setTipoFiltro] = useState("");
  const [proveedorFiltro, setProveedorFiltro] =
    useState("");

  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [movimientoDetalle, setMovimientoDetalle] =
    useState(null);

  const [showDetalleModal, setShowDetalleModal] =
    useState(false);


  // =====================================================
  // CARGAR RESUMEN
  // =====================================================

  const cargarResumen = useCallback(async () => {
    try {
      const respuesta = await fetch(
        `${API_URL}/movimientos/resumen`
      );

      const datos = await leerRespuesta(respuesta);

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje ||
          "No se pudo cargar el resumen."
        );
      }

      setResumen(
        normalizarResumen(datos)
      );
    } catch (err) {
      console.error(
        "Error al cargar resumen:",
        err
      );

      throw err;
    }
  }, []);


  // =====================================================
  // CARGAR MOVIMIENTOS
  // =====================================================

  const cargarMovimientos = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const parametros = new URLSearchParams();

      if (tipoFiltro) {
        parametros.append("tipo", tipoFiltro);
      }

      if (proveedorFiltro.trim()) {
        parametros.append(
          "proveedor",
          proveedorFiltro.trim()
        );
      }

      if (fechaDesde) {
        parametros.append("desde", fechaDesde);
      }

      if (fechaHasta) {
        parametros.append("hasta", fechaHasta);
      }

      const query = parametros.toString();

      const url = query
        ? `${API_URL}/movimientos?${query}`
        : `${API_URL}/movimientos`;

      const respuesta = await fetch(url);
      const datos = await leerRespuesta(respuesta);

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje ||
          "No se pudo cargar el historial."
        );
      }

      const lista = Array.isArray(datos)
        ? datos
        : [];

      setMovimientos(
        lista.map(normalizarMovimiento)
      );
    } catch (err) {
      console.error(
        "Error al cargar movimientos:",
        err
      );

      setError(
        err.message ||
        "No se pudo conectar con el servidor."
      );

      setMovimientos([]);
    } finally {
      setCargando(false);
    }
  }, [
    tipoFiltro,
    proveedorFiltro,
    fechaDesde,
    fechaHasta,
  ]);


  // =====================================================
  // CARGA INICIAL
  // =====================================================

  useEffect(() => {
    async function cargarDatos() {
      try {
        await Promise.all([
          cargarMovimientos(),
          cargarResumen(),
        ]);
      } catch (err) {
        setError(
          err.message ||
          "No se pudieron cargar los movimientos."
        );
      }
    }

    cargarDatos();
  }, [cargarMovimientos, cargarResumen]);


  // =====================================================
  // FILTRADO LOCAL POR TEXTO
  // =====================================================

  const movimientosFiltrados = useMemo(() => {
    const termino =
      searchTerm.trim().toLowerCase();

    if (!termino) {
      return movimientos;
    }

    return movimientos.filter((movimiento) => {
      return (
        movimiento.proveedor
          .toLowerCase()
          .includes(termino) ||
        movimiento.referencia
          .toLowerCase()
          .includes(termino) ||
        movimiento.tipo_movimiento
          .toLowerCase()
          .includes(termino) ||
        String(movimiento.id_movimiento)
          .includes(termino)
      );
    });
  }, [movimientos, searchTerm]);


  // =====================================================
  // TOTALES DE LA LISTA FILTRADA
  // =====================================================

  const totalFacturasFiltradas =
    movimientosFiltrados
      .filter(
        (movimiento) =>
          movimiento.tipo_movimiento === "factura"
      )
      .reduce(
        (total, movimiento) =>
          total + movimiento.monto,
        0
      );


  const totalPagosFiltrados =
    movimientosFiltrados
      .filter(
        (movimiento) =>
          movimiento.tipo_movimiento === "pago"
      )
      .reduce(
        (total, movimiento) =>
          total + movimiento.monto,
        0
      );


  const impactoTotalFiltrado =
    movimientosFiltrados.reduce(
      (total, movimiento) =>
        total + movimiento.impacto_saldo,
      0
    );


  // =====================================================
  // VER DETALLE
  // =====================================================

  async function verDetalle(movimiento) {
    setMovimientoDetalle(movimiento);
    setErrorDetalle("");
    setCargandoDetalle(true);
    setShowDetalleModal(true);

    try {
      const respuesta = await fetch(
        `${API_URL}/movimientos/${movimiento.tipo_movimiento}/${movimiento.id_movimiento}`
      );

      const datos = await leerRespuesta(respuesta);

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje ||
          "No se pudo obtener el movimiento."
        );
      }

      setMovimientoDetalle(
        normalizarMovimiento(datos)
      );
    } catch (err) {
      console.error(
        "Error al obtener detalle:",
        err
      );

      setErrorDetalle(
        err.message ||
        "No se pudo cargar el detalle."
      );
    } finally {
      setCargandoDetalle(false);
    }
  }


  function cerrarDetalle() {
    setShowDetalleModal(false);
    setMovimientoDetalle(null);
    setErrorDetalle("");
  }


  // =====================================================
  // LIMPIAR FILTROS
  // =====================================================

  function limpiarFiltros() {
    setTipoFiltro("");
    setProveedorFiltro("");
    setFechaDesde("");
    setFechaHasta("");
    setSearchTerm("");
  }


  const hayFiltros =
    tipoFiltro ||
    proveedorFiltro ||
    fechaDesde ||
    fechaHasta ||
    searchTerm;


  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Historial de movimientos
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Consulta de facturas y pagos realizados a proveedores
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            cargarMovimientos();
            cargarResumen();
          }}
          disabled={cargando}
          className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw
            size={18}
            className={
              cargando ? "animate-spin" : ""
            }
          />

          Actualizar
        </button>
      </div>


      {/* ERROR */}

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />

            <span>{error}</span>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
          >
            <X size={16} />
          </button>
        </div>
      )}


      {/* RESUMEN GENERAL */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText
              size={20}
              className="text-blue-600"
            />

            <span className="text-sm text-blue-700">
              Total facturado
            </span>
          </div>

          <p className="text-2xl text-blue-800">
            ${formatearDinero(resumen.total_facturado)}
          </p>

          <p className="text-xs text-blue-600 mt-1">
            {resumen.cantidad_facturas} facturas
          </p>
        </div>


        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard
              size={20}
              className="text-green-600"
            />

            <span className="text-sm text-green-700">
              Total pagado
            </span>
          </div>

          <p className="text-2xl text-green-800">
            ${formatearDinero(resumen.total_pagado)}
          </p>

          <p className="text-xs text-green-600 mt-1">
            {resumen.cantidad_pagos} pagos
          </p>
        </div>


        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp
              size={20}
              className="text-red-600"
            />

            <span className="text-sm text-red-700">
              Total adeudado
            </span>
          </div>

          <p className="text-2xl text-red-800">
            ${formatearDinero(resumen.total_adeudado)}
          </p>
        </div>


        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle
              size={20}
              className="text-purple-600"
            />

            <span className="text-sm text-purple-700">
              Estado de facturas
            </span>
          </div>

          <div className="text-sm text-purple-800 space-y-1">
            <p>
              Pendientes: {resumen.facturas_pendientes}
            </p>

            <p>
              Parciales: {resumen.facturas_parciales}
            </p>

            <p>
              Pagadas: {resumen.facturas_pagadas}
            </p>
          </div>
        </div>

      </div>


      {/* FILTROS */}

      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-gray-500" />

          <h3 className="text-gray-800">
            Filtros
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">

          <div className="relative">

            <input
              type="text"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Buscar proveedor o referencia"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>


          <select
            value={tipoFiltro}
            onChange={(event) =>
              setTipoFiltro(event.target.value)
            }
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">
              Todos los movimientos
            </option>

            <option value="factura">
              Facturas
            </option>

            <option value="pago">
              Pagos
            </option>
          </select>


          <input
            type="number"
            min="1"
            value={proveedorFiltro}
            onChange={(event) =>
              setProveedorFiltro(event.target.value)
            }
            placeholder="ID del proveedor"
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />


          <div className="relative">
            <Calendar
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="date"
              value={fechaDesde}
              onChange={(event) =>
                setFechaDesde(event.target.value)
              }
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Fecha desde"
            />
          </div>


          <div className="relative">
            <Calendar
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="date"
              value={fechaHasta}
              onChange={(event) =>
                setFechaHasta(event.target.value)
              }
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Fecha hasta"
            />
          </div>

        </div>


        {hayFiltros && (
          <div className="mt-3">
            <button
              type="button"
              onClick={limpiarFiltros}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>


      {/* RESUMEN DE RESULTADOS */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">
            Facturas del resultado
          </p>

          <p className="text-lg text-blue-700 mt-1">
            ${formatearDinero(totalFacturasFiltradas)}
          </p>
        </div>


        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">
            Pagos del resultado
          </p>

          <p className="text-lg text-green-700 mt-1">
            ${formatearDinero(totalPagosFiltrados)}
          </p>
        </div>


        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">
            Impacto neto en saldo
          </p>

          <p
            className={`text-lg mt-1 ${
              impactoTotalFiltrado > 0
                ? "text-red-700"
                : impactoTotalFiltrado < 0
                ? "text-green-700"
                : "text-gray-700"
            }`}
          >
            ${formatearDinero(
              Math.abs(impactoTotalFiltrado)
            )}
          </p>
        </div>

      </div>


      {/* TABLA */}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">

          {cargando ? (
            <div className="p-10 text-center text-gray-500">
              Cargando movimientos...
            </div>
          ) : movimientosFiltrados.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              No hay movimientos para mostrar.
            </div>
          ) : (
            <table className="w-full">

              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Proveedor
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Referencia
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Impacto
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>


              <tbody className="divide-y divide-gray-200">
                {movimientosFiltrados.map(
                  (movimiento) => {
                    const estado =
                      obtenerEstadoConfig(
                        movimiento.estado_pago
                      );

                    const esFactura =
                      movimiento.tipo_movimiento ===
                      "factura";

                    return (
                      <tr
                        key={`${movimiento.tipo_movimiento}-${movimiento.id_movimiento}-${movimiento.id_proveedor}`}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatearFecha(
                            movimiento.fecha_movimiento
                          )}
                        </td>


                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                              esFactura
                                ? "bg-blue-100 text-blue-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {esFactura ? (
                              <FileText size={13} />
                            ) : (
                              <CreditCard size={13} />
                            )}

                            {esFactura
                              ? "Factura"
                              : "Pago"}
                          </span>
                        </td>


                        <td className="px-6 py-4 text-sm text-gray-800">
                          <div className="flex items-center gap-2">
                            <Building2
                              size={15}
                              className="text-gray-400"
                            />

                            {movimiento.proveedor}
                          </div>
                        </td>


                        <td className="px-6 py-4 text-sm text-gray-700">
                          {movimiento.referencia || "—"}
                        </td>


                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${estado.clase}`}
                          >
                            {estado.texto}
                          </span>
                        </td>


                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-800">
                          $
                          {formatearDinero(
                            movimiento.monto
                          )}
                        </td>


                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <span
                            className={`inline-flex items-center justify-end gap-1 ${
                              movimiento.impacto_saldo > 0
                                ? "text-red-700"
                                : movimiento.impacto_saldo < 0
                                ? "text-green-700"
                                : "text-gray-700"
                            }`}
                          >
                            {movimiento.impacto_saldo > 0 ? (
                              <TrendingUp size={15} />
                            ) : movimiento.impacto_saldo < 0 ? (
                              <TrendingDown size={15} />
                            ) : (
                              <DollarSign size={15} />
                            )}

                            {movimiento.impacto_saldo > 0
                              ? "+"
                              : movimiento.impacto_saldo < 0
                              ? "-"
                              : ""}

                            $
                            {formatearDinero(
                              Math.abs(
                                movimiento.impacto_saldo
                              )
                            )}
                          </span>
                        </td>


                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            type="button"
                            onClick={() =>
                              verDetalle(movimiento)
                            }
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver detalle"
                          >
                            <Eye size={17} />
                          </button>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>

            </table>
          )}

        </div>
      </div>


      {/* NOTA */}

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <p className="text-sm text-gray-600">
          <strong>Facturas:</strong> aumentan el saldo
          adeudado al proveedor.
        </p>

        <p className="text-sm text-gray-600 mt-1">
          <strong>Pagos:</strong> disminuyen el saldo
          adeudado al proveedor.
        </p>
      </div>


      {/* MODAL DE DETALLE */}

      {showDetalleModal && movimientoDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">

            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl text-gray-800">
                  Detalle del movimiento
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  {movimientoDetalle.tipo_movimiento ===
                  "factura"
                    ? "Factura de proveedor"
                    : "Pago a proveedor"}
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarDetalle}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>


            <div className="p-6">

              {cargandoDetalle ? (
                <div className="py-10 text-center text-gray-500">
                  Cargando detalle...
                </div>
              ) : (
                <div className="space-y-5">

                  {errorDetalle && (
                    <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                      <AlertCircle size={18} />

                      {errorDetalle}
                    </div>
                  )}


                  <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                    <div
                      className={`p-3 rounded-lg ${
                        movimientoDetalle.tipo_movimiento ===
                        "factura"
                          ? "bg-blue-100"
                          : "bg-green-100"
                      }`}
                    >
                      {movimientoDetalle.tipo_movimiento ===
                      "factura" ? (
                        <FileText
                          size={24}
                          className="text-blue-600"
                        />
                      ) : (
                        <CreditCard
                          size={24}
                          className="text-green-600"
                        />
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        Proveedor
                      </p>

                      <p className="text-lg text-gray-800">
                        {movimientoDetalle.proveedor}
                      </p>
                    </div>
                  </div>


                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <DetalleCampo
                      etiqueta="Identificador"
                      valor={
                        movimientoDetalle.id_movimiento
                      }
                    />

                    <DetalleCampo
                      etiqueta="Fecha"
                      valor={formatearFecha(
                        movimientoDetalle.fecha_movimiento
                      )}
                    />

                    <DetalleCampo
                      etiqueta="Referencia"
                      valor={
                        movimientoDetalle.referencia ||
                        "Sin referencia"
                      }
                    />

                    <DetalleCampo
                      etiqueta="Estado"
                      valor={
                        obtenerEstadoConfig(
                          movimientoDetalle.estado_pago
                        ).texto
                      }
                    />

                    <DetalleCampo
                      etiqueta="Monto"
                      valor={`$${formatearDinero(
                        movimientoDetalle.monto
                      )}`}
                    />

                    <DetalleCampo
                      etiqueta="Impacto en saldo"
                      valor={`${
                        movimientoDetalle.impacto_saldo > 0
                          ? "+"
                          : movimientoDetalle.impacto_saldo <
                            0
                          ? "-"
                          : ""
                      }$${formatearDinero(
                        Math.abs(
                          movimientoDetalle.impacto_saldo
                        )
                      )}`}
                    />

                    {movimientoDetalle.tipo_movimiento ===
                      "pago" && (
                      <DetalleCampo
                        etiqueta="ID medio de pago"
                        valor={
                          movimientoDetalle.id_medio_pago ??
                          "No disponible"
                        }
                      />
                    )}

                  </div>


                  {movimientoDetalle.observaciones && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        Observaciones
                      </p>

                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800">
                        {
                          movimientoDetalle.observaciones
                        }
                      </div>
                    </div>
                  )}


                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={cerrarDetalle}
                      className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>

                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}


// =====================================================
// COMPONENTE AUXILIAR
// =====================================================

function DetalleCampo({ etiqueta, valor }) {
  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <p className="text-xs text-gray-500 mb-1">
        {etiqueta}
      </p>

      <p className="text-sm text-gray-800">
        {valor}
      </p>
    </div>
  );
}