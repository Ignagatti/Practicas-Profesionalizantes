import { useState, useMemo } from "react";
import {
  Search,
  Eye,
  Download,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Truck,
  X,
} from "lucide-react";

// Este componente consume facturas y pagos del contexto.
// Reemplazá estas líneas por: const { facturas, pagos } = useAppContext();
// y el import correspondiente de tu AppContext.
const FACTURAS_EJEMPLO = [];
const PAGOS_EJEMPLO = [];

export function Saldos({ facturas = FACTURAS_EJEMPLO, pagos = PAGOS_EJEMPLO }) {
  const [tipoVista, setTipoVista] = useState("cliente");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingDetalle, setViewingDetalle] = useState(null);
  const [showDetalleModal, setShowDetalleModal] = useState(false);

  // ── Helpers ───────────────────────────────────────────────

  // Calcular cuánto se ha pagado de cada factura
  const calcularMontoPagadoFactura = (facturaId) => {
    return pagos.reduce((total, pago) => {
      const allocation = pago.facturaAllocations.find((a) => a.facturaId === facturaId);
      return total + (allocation ? allocation.montoAsignado : 0);
    }, 0);
  };

  // ── Saldos calculados ─────────────────────────────────────
  const saldosCalculados = useMemo(() => {
    const entidadesMap = new Map();

    // Procesar facturas
    facturas.forEach((factura) => {
      if (!entidadesMap.has(factura.entidad)) {
        entidadesMap.set(factura.entidad, {
          entidad: factura.entidad,
          tipo: factura.tipo,
          saldoTotal: 0,
          facturasPendientes: 0,
          totalFacturas: 0,
          totalPagos: 0,
          ultimoMovimiento: factura.fecha,
        });
      }

      const saldo = entidadesMap.get(factura.entidad);
      saldo.totalFacturas += factura.monto;

      // Solo contar facturas pendientes o vencidas (NO pagadas)
      if (factura.estado === "pendiente" || factura.estado === "vencida") {
        saldo.facturasPendientes += 1;

        // Calcular cuánto falta pagar de esta factura
        const montoPagado = calcularMontoPagadoFactura(factura.id);
        const montoPendiente = factura.monto - montoPagado;

        // Sumar solo el monto pendiente al saldo
        saldo.saldoTotal += montoPendiente;
      }

      if (factura.fecha > saldo.ultimoMovimiento) {
        saldo.ultimoMovimiento = factura.fecha;
      }
    });

    // Procesar pagos para obtener el total de pagos y saldo a favor
    pagos.forEach((pago) => {
      const saldo = entidadesMap.get(pago.entidad);
      if (saldo) {
        saldo.totalPagos += pago.montoTotal;

        // Restar el saldo a favor del saldo total (dinero que sobró)
        saldo.saldoTotal -= pago.saldoAFavor;

        if (pago.fecha > saldo.ultimoMovimiento) {
          saldo.ultimoMovimiento = pago.fecha;
        }
      }
    });

    return Array.from(entidadesMap.values());
  }, [facturas, pagos]);

  // ── Filtrado ──────────────────────────────────────────────
  const filteredSaldos = saldosCalculados.filter((saldo) => {
    const matchesTipo = saldo.tipo === tipoVista;
    const matchesSearch = saldo.entidad.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTipo && matchesSearch;
  });

  // ── Totales ───────────────────────────────────────────────
  const totalSaldo = filteredSaldos.reduce((sum, s) => sum + s.saldoTotal, 0);
  const saldosPositivos = filteredSaldos
    .filter((s) => s.saldoTotal > 0)
    .reduce((sum, s) => sum + s.saldoTotal, 0);
  const saldosNegativos = filteredSaldos
    .filter((s) => s.saldoTotal < 0)
    .reduce((sum, s) => sum + s.saldoTotal, 0);

  const saldosClientes = saldosCalculados.filter((s) => s.tipo === "cliente");
  const totalCobradoClientes = saldosClientes.reduce((sum, s) => sum + s.totalPagos, 0);
  const totalAdeudadoClientes = saldosClientes.reduce(
    (sum, s) => sum + Math.max(s.saldoTotal, 0),
    0
  );

  // ── Movimientos detalle ───────────────────────────────────
  const getMovimientosDetalle = (entidad) => {
    const movimientos = [];

    facturas
      .filter((f) => f.entidad === entidad)
      .forEach((f) => {
        movimientos.push({
          fecha: f.fecha,
          tipo: "factura",
          numero: f.numeroFactura,
          monto: f.monto,
          estado: f.estado,
        });
      });

    pagos
      .filter((p) => p.entidad === entidad)
      .forEach((p) => {
        movimientos.push({
          fecha: p.fecha,
          tipo: "pago",
          numero: p.numeroPago,
          monto: p.montoTotal,
        });
      });

    return movimientos.sort((a, b) => b.fecha.localeCompare(a.fecha));
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header con Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl text-gray-800">Gestión de Saldos</h2>
          <p className="text-gray-500 text-sm mt-1">
            Control de saldos de{" "}
            {tipoVista === "cliente" ? "clientes" : "proveedores"}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setTipoVista("cliente")}
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
              onClick={() => setTipoVista("proveedor")}
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
        </div>
      </div>

      {/* Resumen de Saldos */}
      {tipoVista === "cliente" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="text-green-600" size={20} />
              <span className="text-sm text-green-700">Total Cobrado de Clientes</span>
            </div>
            <p className="text-2xl text-green-800">
              ${totalCobradoClientes.toLocaleString()}
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="text-red-600" size={20} />
              <span className="text-sm text-red-700">Total Adeudado por Clientes</span>
            </div>
            <p className="text-2xl text-red-800">
              ${totalAdeudadoClientes.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Filtros */}
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

      {/* Tabla de Saldos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-3 text-left text-xs text-gray-500 uppercase">
                  {tipoVista === "cliente" ? "Cliente" : "Proveedor"}
                </th>
                <th className="px-3 py-3 text-left text-xs text-gray-500 uppercase">
                  Facturas
                </th>
                <th className="px-3 py-3 text-left text-xs text-gray-500 uppercase">
                  Últ. Movimiento
                </th>
                <th className="px-3 py-3 text-left text-xs text-gray-500 uppercase">
                  Saldo Total
                </th>
                <th className="px-3 py-3 text-right text-xs text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSaldos.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-8 text-center text-gray-400 text-sm"
                  >
                    No hay saldos registrados
                  </td>
                </tr>
              ) : (
                filteredSaldos.map((saldo, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 text-sm text-gray-800">
                      {saldo.entidad}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm">
                      {saldo.facturasPendientes > 0 ? (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                          {saldo.facturasPendientes} pend.
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          Al día
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                      {saldo.ultimoMovimiento}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm">
                      <div
                        className={`flex items-center gap-1 ${
                          saldo.saldoTotal > 0
                            ? "text-red-700"
                            : saldo.saldoTotal < 0
                            ? "text-green-700"
                            : "text-gray-700"
                        }`}
                      >
                        {saldo.saldoTotal > 0 ? (
                          <TrendingUp size={16} />
                        ) : saldo.saldoTotal < 0 ? (
                          <TrendingDown size={16} />
                        ) : (
                          <DollarSign size={16} />
                        )}
                        <span className="font-medium">
                          ${Math.abs(saldo.saldoTotal).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => {
                          setViewingDetalle(saldo.entidad);
                          setShowDetalleModal(true);
                        }}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                        title="Ver detalle"
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

      {/* Nota explicativa */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <p className="text-sm text-gray-600">
          <strong>Nota:</strong>{" "}
          {tipoVista === "cliente"
            ? "Los saldos positivos indican dinero que el cliente debe. Los saldos negativos indican pagos adelantados o créditos a favor del cliente."
            : "Los saldos positivos indican dinero que debemos al proveedor. Los saldos negativos indican pagos adelantados o créditos a favor nuestro."}
        </p>
      </div>

      {/* ── Modal: Detalle de Movimientos ── */}
      {showDetalleModal && viewingDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl text-gray-800">
                Detalle de Movimientos - {viewingDetalle}
              </h3>
              <button
                onClick={() => setShowDetalleModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* Resumen */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700 mb-1">Total Facturas</p>
                  <p className="text-xl text-blue-800">
                    $
                    {saldosCalculados
                      .find((s) => s.entidad === viewingDetalle)
                      ?.totalFacturas.toLocaleString() ?? 0}
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-700 mb-1">Total Pagos</p>
                  <p className="text-xl text-green-800">
                    $
                    {saldosCalculados
                      .find((s) => s.entidad === viewingDetalle)
                      ?.totalPagos.toLocaleString() ?? 0}
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-700 mb-1">Saldo Actual</p>
                  <p
                    className={`text-xl ${
                      (saldosCalculados.find((s) => s.entidad === viewingDetalle)
                        ?.saldoTotal || 0) > 0
                        ? "text-red-800"
                        : "text-green-800"
                    }`}
                  >
                    $
                    {Math.abs(
                      saldosCalculados.find((s) => s.entidad === viewingDetalle)
                        ?.saldoTotal || 0
                    ).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Tabla de Movimientos */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                        Número
                      </th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider">
                        Monto
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {getMovimientosDetalle(viewingDetalle).length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-6 text-center text-gray-400 text-sm"
                        >
                          Sin movimientos registrados
                        </td>
                      </tr>
                    ) : (
                      getMovimientosDetalle(viewingDetalle).map((mov, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-800">{mov.fecha}</td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                mov.tipo === "factura"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {mov.tipo === "factura" ? "Factura" : "Pago"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800">{mov.numero}</td>
                          <td className="px-4 py-3 text-sm">
                            {mov.estado ? (
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  mov.estado === "pagada"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {mov.estado === "pagada" ? "Pagada" : "Pendiente"}
                              </span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <span
                              className={
                                mov.tipo === "factura"
                                  ? "text-red-700 font-medium"
                                  : "text-green-700 font-medium"
                              }
                            >
                              {mov.tipo === "factura" ? "+" : "-"}$
                              {mov.monto.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
