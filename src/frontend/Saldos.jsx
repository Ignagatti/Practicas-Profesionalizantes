import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Eye,
  DollarSign,
  TrendingUp,
  Truck,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  FileText,
  Calendar,
} from "lucide-react";


// =====================================================
// CONFIGURACIÓN
// =====================================================

const API_URL = "http://localhost:4000/api";

const estadoConfig = {
  pendiente: {
    label: "Pendiente",
    color: "bg-yellow-100 text-yellow-700",
  },

  parcial: {
    label: "Pago parcial",
    color: "bg-blue-100 text-blue-700",
  },

  pagado: {
    label: "Pagada",
    color: "bg-green-100 text-green-700",
  },
};


// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function obtenerNombreProveedor(proveedor) {
  if (!proveedor) {
    return "Proveedor no disponible";
  }

  const razonSocial =
    proveedor.razon_social ??
    proveedor.Razon_Social ??
    "";

  if (String(razonSocial).trim()) {
    return String(razonSocial).trim();
  }

  const nombre =
    proveedor.nombre ??
    proveedor.Nombre ??
    "";

  const apellido =
    proveedor.apellido ??
    proveedor.Apellido ??
    "";

  const nombreCompleto =
    `${nombre} ${apellido}`.trim();

  return nombreCompleto || "Proveedor sin nombre";
}


function normalizarSaldo(proveedor) {
  return {
    ...proveedor,

    id_proveedor:
      proveedor.id_proveedor ??
      proveedor.Id_Proveedor ??
      proveedor.id,

    nombre:
      proveedor.nombre ??
      proveedor.Nombre ??
      "",

    apellido:
      proveedor.apellido ??
      proveedor.Apellido ??
      "",

    razon_social:
      proveedor.razon_social ??
      proveedor.Razon_Social ??
      "",

    proveedor: obtenerNombreProveedor(proveedor),

    saldo_guardado: Number(
      proveedor.saldo_guardado ??
      proveedor.Saldo_Guardado ??
      proveedor.saldo ??
      proveedor.Saldo ??
      0
    ),

    saldo_calculado: Number(
      proveedor.saldo_calculado ??
      proveedor.Saldo_Calculado ??
      0
    ),

    cantidad_facturas_pendientes: Number(
      proveedor.cantidad_facturas_pendientes ??
      proveedor.Cantidad_Facturas_Pendientes ??
      0
    ),
  };
}


function normalizarFactura(factura) {
  return {
    ...factura,

    id_factura_proveedor:
      factura.id_factura_proveedor ??
      factura.Id_Factura_Proveedor ??
      factura.id,

    nro_factura_proveedor:
      factura.nro_factura_proveedor ??
      factura.Nro_Factura_Proveedor ??
      "",

    fecha_emision:
      factura.fecha_emision ??
      factura.Fecha_Emision ??
      "",

    vencimiento:
      factura.vencimiento ??
      factura.Vencimiento ??
      "",

    precio_total: Number(
      factura.precio_total ??
      factura.Precio_Total ??
      0
    ),

    monto_adeudado: Number(
      factura.monto_adeudado ??
      factura.Monto_Adeudado ??
      0
    ),

    estado_pago:
      factura.estado_pago ??
      factura.Estado_Pago ??
      "pendiente",

    observaciones:
      factura.observaciones ??
      factura.Observaciones ??
      "",
  };
}


function fechaParaInput(fecha) {
  if (!fecha) {
    return "";
  }

  return String(fecha).split("T")[0];
}


function formatearFecha(fecha) {
  const fechaNormalizada = fechaParaInput(fecha);

  if (!fechaNormalizada) {
    return "—";
  }

  const partes = fechaNormalizada.split("-");

  if (partes.length !== 3) {
    return fechaNormalizada;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}


function formatearDinero(valor) {
  return Number(valor || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}


async function leerRespuesta(respuesta) {
  const tipoContenido =
    respuesta.headers.get("content-type") || "";

  if (tipoContenido.includes("application/json")) {
    return respuesta.json();
  }

  const texto = await respuesta.text();

  return {
    mensaje: texto,
  };
}


// =====================================================
// COMPONENTE
// =====================================================

export function Saldos() {
  const [saldos, setSaldos] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [cargandoDetalle, setCargandoDetalle] =
    useState(false);

  const [recalculandoTodos, setRecalculandoTodos] =
    useState(false);

  const [recalculandoProveedor, setRecalculandoProveedor] =
    useState(false);

  const [error, setError] = useState("");
  const [errorDetalle, setErrorDetalle] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filtroSaldo, setFiltroSaldo] = useState("todos");

  const [showDetalleModal, setShowDetalleModal] =
    useState(false);

  const [proveedorDetalle, setProveedorDetalle] =
    useState(null);

  const [facturasDetalle, setFacturasDetalle] =
    useState([]);


  // =====================================================
  // CARGA INICIAL
  // =====================================================

  useEffect(() => {
    cargarSaldos();
  }, []);


  async function cargarSaldos() {
    setCargando(true);
    setError("");

    try {
      const respuesta = await fetch(
        `${API_URL}/saldos`
      );

      const datos =
        await leerRespuesta(respuesta);

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje ||
          datos.error ||
          "No se pudieron cargar los saldos."
        );
      }

      const listaSaldos = Array.isArray(datos)
        ? datos
        : datos.proveedores || [];

      setSaldos(
        listaSaldos.map(normalizarSaldo)
      );
    } catch (err) {
      console.error(
        "Error al cargar saldos:",
        err
      );

      setError(
        err.message ||
        "No se pudo conectar con el servidor."
      );
    } finally {
      setCargando(false);
    }
  }


  // =====================================================
  // FILTROS
  // =====================================================

  const saldosFiltrados = useMemo(() => {
    const termino =
      searchTerm.trim().toLowerCase();

    return saldos.filter((saldo) => {
      const coincideBusqueda =
        !termino ||
        saldo.proveedor
          .toLowerCase()
          .includes(termino) ||
        String(saldo.id_proveedor)
          .includes(termino);

      let coincideSaldo = true;

      if (filtroSaldo === "con-deuda") {
        coincideSaldo =
          saldo.saldo_calculado > 0;
      }

      if (filtroSaldo === "al-dia") {
        coincideSaldo =
          saldo.saldo_calculado === 0;
      }

      if (filtroSaldo === "diferencias") {
        coincideSaldo =
          saldo.saldo_guardado !==
          saldo.saldo_calculado;
      }

      return (
        coincideBusqueda &&
        coincideSaldo
      );
    });
  }, [
    saldos,
    searchTerm,
    filtroSaldo,
  ]);


  // =====================================================
  // TOTALES
  // =====================================================

  const totalSaldoCalculado =
    saldosFiltrados.reduce(
      (total, saldo) =>
        total + saldo.saldo_calculado,
      0
    );


  const totalSaldoGuardado =
    saldosFiltrados.reduce(
      (total, saldo) =>
        total + saldo.saldo_guardado,
      0
    );


  const totalFacturasPendientes =
    saldosFiltrados.reduce(
      (total, saldo) =>
        total +
        saldo.cantidad_facturas_pendientes,
      0
    );


  const proveedoresConDeuda =
    saldosFiltrados.filter(
      (saldo) =>
        saldo.saldo_calculado > 0
    ).length;


  const proveedoresConDiferencia =
    saldosFiltrados.filter(
      (saldo) =>
        saldo.saldo_guardado !==
        saldo.saldo_calculado
    ).length;


  // =====================================================
  // MENSAJES
  // =====================================================

  function mostrarExito(mensaje) {
    setMensajeExito(mensaje);

    setTimeout(() => {
      setMensajeExito("");
    }, 3000);
  }


  // =====================================================
  // DETALLE DE PROVEEDOR
  // =====================================================

  async function abrirDetalle(proveedor) {
    setProveedorDetalle(proveedor);
    setFacturasDetalle([]);
    setErrorDetalle("");
    setCargandoDetalle(true);
    setShowDetalleModal(true);

    try {
      const respuesta = await fetch(
        `${API_URL}/saldos/${proveedor.id_proveedor}`
      );

      const datos =
        await leerRespuesta(respuesta);

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje ||
          datos.error ||
          "No se pudo cargar el detalle del proveedor."
        );
      }

      setProveedorDetalle(
        normalizarSaldo(
          datos.proveedor || proveedor
        )
      );

      const facturas = Array.isArray(
        datos.facturas
      )
        ? datos.facturas
        : [];

      setFacturasDetalle(
        facturas.map(normalizarFactura)
      );
    } catch (err) {
      console.error(
        "Error al cargar detalle:",
        err
      );

      setErrorDetalle(err.message);
    } finally {
      setCargandoDetalle(false);
    }
  }


  function cerrarDetalle() {
    if (
      recalculandoProveedor
    ) {
      return;
    }

    setShowDetalleModal(false);
    setProveedorDetalle(null);
    setFacturasDetalle([]);
    setErrorDetalle("");
  }


  // =====================================================
  // RECALCULAR UN PROVEEDOR
  // =====================================================

  async function recalcularProveedor() {
    if (!proveedorDetalle) {
      return;
    }

    setRecalculandoProveedor(true);
    setErrorDetalle("");

    try {
      const respuesta = await fetch(
        `${API_URL}/saldos/${proveedorDetalle.id_proveedor}/recalcular`,
        {
          method: "PUT",
        }
      );

      const datos =
        await leerRespuesta(respuesta);

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje ||
          datos.error ||
          "No se pudo recalcular el saldo."
        );
      }

      mostrarExito(
        datos.mensaje ||
        "Saldo recalculado correctamente."
      );

      await cargarSaldos();

      await abrirDetalle(
        proveedorDetalle
      );
    } catch (err) {
      console.error(
        "Error al recalcular saldo:",
        err
      );

      setErrorDetalle(err.message);
    } finally {
      setRecalculandoProveedor(false);
    }
  }


  // =====================================================
  // RECALCULAR TODOS
  // =====================================================

  async function recalcularTodos() {
    const confirmar = window.confirm(
      "¿Desea recalcular los saldos de todos los proveedores?"
    );

    if (!confirmar) {
      return;
    }

    setRecalculandoTodos(true);
    setError("");

    try {
      const respuesta = await fetch(
        `${API_URL}/saldos/recalcular-todos`,
        {
          method: "PUT",
        }
      );

      const datos =
        await leerRespuesta(respuesta);

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje ||
          datos.error ||
          "No se pudieron recalcular los saldos."
        );
      }

      mostrarExito(
        datos.mensaje ||
        "Todos los saldos fueron recalculados."
      );

      await cargarSaldos();
    } catch (err) {
      console.error(
        "Error al recalcular todos los saldos:",
        err
      );

      setError(err.message);
    } finally {
      setRecalculandoTodos(false);
    }
  }


  // =====================================================
  // CÁLCULOS DEL DETALLE
  // =====================================================

  const totalFacturadoDetalle =
    facturasDetalle.reduce(
      (total, factura) =>
        total + factura.precio_total,
      0
    );


  const totalAdeudadoDetalle =
    facturasDetalle.reduce(
      (total, factura) =>
        total + factura.monto_adeudado,
      0
    );


  const totalPagadoDetalle =
    facturasDetalle.reduce(
      (total, factura) =>
        total +
        (
          factura.precio_total -
          factura.monto_adeudado
        ),
      0
    );


  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-6">

      {/* MENSAJE DE ÉXITO */}

      {mensajeExito && (
        <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle size={18} />

          <span>{mensajeExito}</span>
        </div>
      )}


      {/* ERROR GLOBAL */}

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg flex justify-between items-center">
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


      {/* HEADER */}

      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h2 className="text-2xl text-gray-800">
            Saldos de proveedores
          </h2>

          <p className="text-gray-500 text-sm mt-1">
            Control y verificación de las deudas con proveedores
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-200">
            <Truck size={18} />

            Proveedores
          </div>

          <button
            type="button"
            onClick={recalcularTodos}
            disabled={
              recalculandoTodos ||
              cargando
            }
            className="flex items-center justify-center gap-2 bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              size={18}
              className={
                recalculandoTodos
                  ? "animate-spin"
                  : ""
              }
            />

            {recalculandoTodos
              ? "Recalculando..."
              : "Recalcular todos"}
          </button>
        </div>
      </div>


      {/* RESUMEN */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign
              className="text-red-600"
              size={20}
            />

            <span className="text-sm text-red-700">
              Deuda calculada
            </span>
          </div>

          <p className="text-2xl text-red-800">
            $
            {formatearDinero(
              totalSaldoCalculado
            )}
          </p>
        </div>


        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp
              className="text-blue-600"
              size={20}
            />

            <span className="text-sm text-blue-700">
              Saldo guardado
            </span>
          </div>

          <p className="text-2xl text-blue-800">
            $
            {formatearDinero(
              totalSaldoGuardado
            )}
          </p>
        </div>


        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText
              className="text-yellow-600"
              size={20}
            />

            <span className="text-sm text-yellow-700">
              Facturas pendientes
            </span>
          </div>

          <p className="text-2xl text-yellow-800">
            {totalFacturasPendientes}
          </p>
        </div>


        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Truck
              className="text-purple-600"
              size={20}
            />

            <span className="text-sm text-purple-700">
              Proveedores con deuda
            </span>
          </div>

          <p className="text-2xl text-purple-800">
            {proveedoresConDeuda}
          </p>
        </div>

      </div>


      {/* AVISO DE DIFERENCIAS */}

      {proveedoresConDiferencia > 0 && (
        <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-lg flex items-start gap-2">
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-medium">
              Se encontraron diferencias de saldo
            </p>

            <p className="text-sm mt-1">
              Hay {proveedoresConDiferencia} proveedor
              {proveedoresConDiferencia !== 1
                ? "es"
                : ""}{" "}
              cuyo saldo guardado no coincide con el saldo
              calculado a partir de sus facturas.
            </p>
          </div>
        </div>
      )}


      {/* FILTROS */}

      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">

          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />

            <input
              type="text"
              placeholder="Buscar proveedor..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>


          <select
            value={filtroSaldo}
            onChange={(event) =>
              setFiltroSaldo(
                event.target.value
              )
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">
              Todos los proveedores
            </option>

            <option value="con-deuda">
              Con deuda
            </option>

            <option value="al-dia">
              Al día
            </option>

            <option value="diferencias">
              Con diferencias
            </option>
          </select>

        </div>
      </div>


      {/* TABLA */}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">

          {cargando ? (
            <div className="p-8 text-center text-gray-500">
              Cargando saldos...
            </div>
          ) : saldosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No hay saldos para mostrar.
            </div>
          ) : (
            <table className="w-full">

              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>

                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">
                    Proveedor
                  </th>

                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">
                    Facturas pendientes
                  </th>

                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">
                    Saldo guardado
                  </th>

                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">
                    Saldo calculado
                  </th>

                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">
                    Verificación
                  </th>

                  <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase">
                    Acciones
                  </th>

                </tr>
              </thead>


              <tbody className="divide-y divide-gray-200">

                {saldosFiltrados.map((saldo) => {
                  const coincide =
                    saldo.saldo_guardado ===
                    saldo.saldo_calculado;

                  return (
                    <tr
                      key={saldo.id_proveedor}
                      className="hover:bg-gray-50 transition-colors"
                    >

                      <td className="px-4 py-3 text-sm text-gray-800">
                        {saldo.proveedor}
                      </td>


                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {saldo.cantidad_facturas_pendientes >
                        0 ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                            {
                              saldo.cantidad_facturas_pendientes
                            }{" "}
                            pendiente
                            {saldo.cantidad_facturas_pendientes !==
                            1
                              ? "s"
                              : ""}
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                            Al día
                          </span>
                        )}
                      </td>


                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        $
                        {formatearDinero(
                          saldo.saldo_guardado
                        )}
                      </td>


                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div
                          className={`flex items-center gap-1 ${
                            saldo.saldo_calculado > 0
                              ? "text-red-700"
                              : "text-green-700"
                          }`}
                        >
                          <DollarSign size={16} />

                          <span className="font-medium">
                            {formatearDinero(
                              saldo.saldo_calculado
                            )}
                          </span>
                        </div>
                      </td>


                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {coincide ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                            <CheckCircle size={13} />

                            Correcto
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                            <AlertCircle size={13} />

                            Recalcular
                          </span>
                        )}
                      </td>


                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                        <button
                          type="button"
                          onClick={() =>
                            abrirDetalle(saldo)
                          }
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                          title="Ver detalle"
                        >
                          <Eye size={17} />
                        </button>
                      </td>

                    </tr>
                  );
                })}

              </tbody>
            </table>
          )}

        </div>
      </div>


      {/* NOTA */}

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <p className="text-sm text-gray-600">
          <strong>Saldo calculado:</strong>{" "}
          suma de los montos adeudados de todas las facturas
          del proveedor.
        </p>

        <p className="text-sm text-gray-600 mt-1">
          <strong>Saldo guardado:</strong>{" "}
          saldo almacenado actualmente en la tabla de
          proveedores. Ambos valores deberían coincidir.
        </p>
      </div>


      {/* MODAL DETALLE */}

      {showDetalleModal && proveedorDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between p-6 border-b border-gray-200">

              <div>
                <h3 className="text-xl text-gray-800">
                  Detalle de saldo
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  {proveedorDetalle.proveedor}
                </p>
              </div>


              <button
                type="button"
                onClick={cerrarDetalle}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>

            </div>


            <div className="p-6 space-y-6">

              {errorDetalle && (
                <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <AlertCircle size={18} />

                  <span>{errorDetalle}</span>
                </div>
              )}


              {/* RESUMEN DETALLE */}

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700 mb-1">
                    Total facturado
                  </p>

                  <p className="text-xl text-blue-800">
                    $
                    {formatearDinero(
                      totalFacturadoDetalle
                    )}
                  </p>
                </div>


                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-700 mb-1">
                    Total pagado
                  </p>

                  <p className="text-xl text-green-800">
                    $
                    {formatearDinero(
                      totalPagadoDetalle
                    )}
                  </p>
                </div>


                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700 mb-1">
                    Total adeudado
                  </p>

                  <p className="text-xl text-red-800">
                    $
                    {formatearDinero(
                      totalAdeudadoDetalle
                    )}
                  </p>
                </div>


                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-700 mb-1">
                    Facturas pendientes
                  </p>

                  <p className="text-xl text-purple-800">
                    {
                      proveedorDetalle.cantidad_facturas_pendientes
                    }
                  </p>
                </div>

              </div>


              {/* COMPARACIÓN DE SALDOS */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-500">
                    Saldo guardado
                  </p>

                  <p className="text-xl text-gray-800 mt-1">
                    $
                    {formatearDinero(
                      proveedorDetalle.saldo_guardado
                    )}
                  </p>
                </div>


                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-500">
                    Saldo calculado
                  </p>

                  <p className="text-xl text-gray-800 mt-1">
                    $
                    {formatearDinero(
                      proveedorDetalle.saldo_calculado
                    )}
                  </p>
                </div>

              </div>


              {/* FACTURAS */}

              <div>

                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-3">

                  <div>
                    <h4 className="text-lg text-gray-800">
                      Facturas del proveedor
                    </h4>

                    <p className="text-sm text-gray-500">
                      Historial completo de facturación y saldos.
                    </p>
                  </div>


                  <button
                    type="button"
                    onClick={recalcularProveedor}
                    disabled={
                      recalculandoProveedor ||
                      cargandoDetalle
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw
                      size={17}
                      className={
                        recalculandoProveedor
                          ? "animate-spin"
                          : ""
                      }
                    />

                    {recalculandoProveedor
                      ? "Recalculando..."
                      : "Recalcular saldo"}
                  </button>

                </div>


                {cargandoDetalle ? (
                  <div className="p-8 text-center text-gray-500">
                    Cargando detalle...
                  </div>
                ) : facturasDetalle.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 border border-dashed border-gray-300 rounded-lg">
                    Este proveedor no tiene facturas registradas.
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">

                    <div className="overflow-x-auto">

                      <table className="w-full">

                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>

                            <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">
                              Factura
                            </th>

                            <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">
                              Emisión
                            </th>

                            <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">
                              Vencimiento
                            </th>

                            <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">
                              Total
                            </th>

                            <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">
                              Adeudado
                            </th>

                            <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">
                              Estado
                            </th>

                          </tr>
                        </thead>


                        <tbody className="divide-y divide-gray-200">

                          {facturasDetalle.map(
                            (factura) => (
                              <tr
                                key={
                                  factura.id_factura_proveedor
                                }
                                className="hover:bg-gray-50 transition-colors"
                              >

                                <td className="px-4 py-3 text-sm text-gray-800">
                                  {
                                    factura.nro_factura_proveedor
                                  }
                                </td>


                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Calendar size={14} />

                                    {formatearFecha(
                                      factura.fecha_emision
                                    )}
                                  </div>
                                </td>


                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                  {formatearFecha(
                                    factura.vencimiento
                                  )}
                                </td>


                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                                  $
                                  {formatearDinero(
                                    factura.precio_total
                                  )}
                                </td>


                                <td className="px-4 py-3 whitespace-nowrap text-sm text-red-700">
                                  $
                                  {formatearDinero(
                                    factura.monto_adeudado
                                  )}
                                </td>


                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs ${
                                      estadoConfig[
                                        factura.estado_pago
                                      ]?.color ||
                                      "bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    {estadoConfig[
                                      factura.estado_pago
                                    ]?.label ||
                                      factura.estado_pago}
                                  </span>
                                </td>

                              </tr>
                            )
                          )}

                        </tbody>
                      </table>

                    </div>
                  </div>
                )}

              </div>


              {/* BOTÓN CERRAR */}

              <div className="flex justify-end pt-4 border-t border-gray-200">

                <button
                  type="button"
                  onClick={cerrarDetalle}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cerrar
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}