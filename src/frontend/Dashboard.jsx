import { useState, useEffect, useMemo } from "react";
import {
  Package,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Users,
  Building,
  Calendar,
  X,
  ChevronDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ── URL base de tu backend ────────────────────────────────────────────────────
const API_URL = "http://localhost:4000/api";

// ─────────────────────────────────────────────────────────────────────────────
export function Dashboard() {
  const periodo = "mensual";

  // ── Estado ──────────────────────────────────────────────────────────────────
  const [productos, setProductos]           = useState([]);
  const [insumos, setInsumos]               = useState([]);
  const [pagosPendientes, setPagosPendientes] = useState([]);
  const [cargando, setCargando]             = useState(true);
  const [error, setError]                   = useState(null);
  const [fechaDesde, setFechaDesde]         = useState("");
  const [fechaHasta, setFechaHasta]         = useState("");
  const [selectedPago, setSelectedPago]     = useState(null);

  // ── Cargar datos del backend al montar ──────────────────────────────────────
  useEffect(() => {
    async function cargarDatos() {
      setCargando(true);
      setError(null);
      try {
        // Llamadas en paralelo para mayor velocidad
        const [resProductos, resInsumos, resPagos] = await Promise.all([
          fetch(`${API_URL}/productos`),
          fetch(`${API_URL}/insumos`),
          // fetch(`${API_URL}/pagos-pendientes`),
        ]);

        if (!resProductos.ok) throw new Error("Error al cargar productos.");
        if (!resInsumos.ok)   throw new Error("Error al cargar insumos.");
        // if (!resPagos.ok)     throw new Error("Error al cargar pagos pendientes.");

        const [dataProductos, dataInsumos] = await Promise.all([
          resProductos.json(),
          resInsumos.json(),
          // resPagos.json(),
        ]);

        setProductos(dataProductos);
        setInsumos(dataInsumos);
        // setPagosPendientes(dataPagos || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    }

    cargarDatos();
  }, []);

  // ── Helper: obtener nombre de insumo por id ──────────────────────────────────
  function getInsumoNombre(id) {
    return insumos.find((i) => i.id === id)?.nombre || "Desconocido";
  }

  // ── Estadísticas de productos ────────────────────────────────────────────────
  const productosPendientes    = productos.filter((p) => p.estado === "pendiente").length;
  const productosTerminados    = productos.filter((p) => p.estado === "terminado").length;
  const productosEnProduccion  = productos.filter((p) => p.estado === "en-produccion").length;
  const totalFacturacion       = productos.reduce(
    (sum, p) => sum + p.precio_unitario * p.cantidad, 0
  );

  // ── Filtrar productos por rango de fechas ────────────────────────────────────
  const productosFiltrados = useMemo(() => {
    return productos.filter((producto) => {
      const fechaProducto = new Date(producto.fecha_pedido);
      const desde = fechaDesde ? new Date(fechaDesde) : null;
      const hasta = fechaHasta ? new Date(fechaHasta) : null;
      if (desde && fechaProducto < desde) return false;
      if (hasta && fechaProducto > hasta) return false;
      return true;
    });
  }, [productos, fechaDesde, fechaHasta]);

  // ── Histograma de modelos más vendidos ───────────────────────────────────────
  const histogramaModelos = useMemo(() => {
    const modelosMap = new Map();
    productosFiltrados.forEach((producto) => {
      const cantidad = modelosMap.get(producto.modelo_id) || 0;
      modelosMap.set(producto.modelo_id, cantidad + producto.cantidad);
    });
    return Array.from(modelosMap.entries())
      .map(([modeloId, cantidad]) => ({
        name: `${getInsumoNombre(modeloId)}-${modeloId}`,
        modelo: getInsumoNombre(modeloId),
        cantidad,
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [productosFiltrados, insumos]);

  // ── Productos por período ────────────────────────────────────────────────────
  const productosPorMes = useMemo(() => {
    const mesesMap = new Map();
    productosFiltrados.forEach((producto) => {
      const fecha = new Date(producto.fecha_pedido);
      let key;
      if (periodo === "diario") {
        key = fecha.toISOString().split("T")[0];
      } else if (periodo === "mensual") {
        key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
      } else {
        key = String(fecha.getFullYear());
      }
      const cantidad = mesesMap.get(key) || 0;
      mesesMap.set(key, cantidad + producto.cantidad);
    });
    return Array.from(mesesMap.entries())
      .map(([periodoKey, cantidad], index) => ({
        name: `${periodoKey}-${index}`,
        periodo: periodoKey,
        productos: cantidad,
      }))
      .sort((a, b) => a.periodo.localeCompare(b.periodo));
  }, [productosFiltrados, periodo]);

  // ── Formatear etiqueta del período ──────────────────────────────────────────
  function formatPeriodoLabel(periodoStr) {
    if (periodo === "diario") {
      const date = new Date(periodoStr);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    } else if (periodo === "mensual") {
      const [year, month] = periodoStr.split("-");
      const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
      return meses[parseInt(month) - 1];
    }
    return periodoStr;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Cargando dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg flex justify-between items-center">
        <span>⚠️ {error}</span>
        <button onClick={() => setError(null)}><X size={16} /></button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Cards Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Productos Pendientes"
          value={productosPendientes.toString()}
          change={`${productosEnProduccion} en producción`}
          icon={AlertCircle}
          color="bg-red-700"
        />
        <StatCard
          title="Productos Terminados"
          value={productosTerminados.toString()}
          change="Listos para envío"
          icon={CheckCircle}
          color="bg-green-500"
        />
        <StatCard
          title="Productos en Producción"
          value={productosEnProduccion.toString()}
          change={`${productosPendientes} pendientes`}
          icon={Package}
          color="bg-blue-500"
        />
        <StatCard
          title="Facturación Total"
          value={`$${(totalFacturacion / 1000).toFixed(0)}K`}
          change={`${productos.length} productos`}
          icon={DollarSign}
          color="bg-purple-500"
        />
      </div>

      {/* Filtros de fecha */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-gray-400" />
            <span className="text-sm text-gray-600">Filtrar por fecha:</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Desde:</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Hasta:</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {(fechaDesde || fechaHasta) && (
            <button
              onClick={() => { setFechaDesde(""); setFechaHasta(""); }}
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Modelos más vendidos */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg mb-4 text-gray-800">Modelos Más Vendidos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={histogramaModelos} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis dataKey="modelo" type="category" width={150} stroke="#6b7280" />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
              />
              <Bar dataKey="cantidad" name="Cantidad" fill="#b91c1c" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Productos por período */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg mb-4 text-gray-800">
            Productos Pedidos por {periodo === "diario" ? "Día" : periodo === "mensual" ? "Mes" : "Año"}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productosPorMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="periodo" stroke="#6b7280" tickFormatter={formatPeriodoLabel} />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                labelFormatter={formatPeriodoLabel}
              />
              <Legend />
              <Bar dataKey="productos" name="Productos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Avisos de Pagos Pendientes */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg mb-4 text-gray-800">Avisos de Pagos Pendientes</h3>

        {pagosPendientes.length === 0 ? (
          <p className="text-gray-400 text-sm">No hay pagos pendientes.</p>
        ) : (
          <div className="space-y-3">
            {pagosPendientes.map((pago) => (
              <div
                key={pago.id}
                onClick={() => setSelectedPago(pago)}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  {pago.tipo === "cliente" ? (
                    <Users size={20} className="text-blue-600" />
                  ) : (
                    <Building size={20} className="text-orange-600" />
                  )}
                  <div>
                    <p className="text-sm text-gray-800">{pago.nombre}</p>
                    <p className="text-xs text-gray-500">
                      {pago.tipo === "cliente" ? "Cliente" : "Proveedor"} — Vence: {pago.fecha_vencimiento}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-base text-red-700">
                      ${Number(pago.monto_adeudado).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Pendiente</p>
                  </div>
                  <ChevronDown size={16} className="text-gray-400 -rotate-90" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Detalle de Pago */}
      {selectedPago && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl text-gray-800">Detalle del Aviso</h3>
              <button
                onClick={() => setSelectedPago(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Encabezado */}
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                {selectedPago.tipo === "cliente" ? (
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users size={24} className="text-blue-600" />
                  </div>
                ) : (
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Building size={24} className="text-orange-600" />
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">
                    {selectedPago.tipo === "cliente" ? "Cliente" : "Proveedor"}
                  </p>
                  <p className="text-lg text-gray-800">{selectedPago.nombre}</p>
                </div>
              </div>

              {/* Concepto */}
              <div>
                <p className="text-sm text-gray-500 mb-1">Concepto</p>
                <p className="text-base text-gray-800">{selectedPago.concepto}</p>
              </div>

              {/* Fecha */}
              <div>
                <p className="text-sm text-gray-500 mb-1">Fecha de Vencimiento</p>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400" />
                  <p className="text-base text-gray-800">{selectedPago.fecha_vencimiento}</p>
                </div>
              </div>

              {/* Monto */}
              <div>
                <p className="text-sm text-gray-500 mb-1">Monto Adeudado</p>
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <DollarSign size={20} className="text-red-600" />
                  <p className="text-xl text-red-700">
                    ${Number(selectedPago.monto_adeudado).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setSelectedPago(null)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

// ── Componente auxiliar StatCard ──────────────────────────────────────────────
function StatCard({ title, value, change, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm mb-1">{title}</p>
          <p className="text-3xl mb-2 text-gray-800">{value}</p>
          <p className="text-xs text-gray-400">{change}</p>
        </div>
        <div className={`${color} text-white p-3 rounded-xl`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}
