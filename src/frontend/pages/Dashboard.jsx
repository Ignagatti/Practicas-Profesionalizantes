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

// Helper para convertir fechas a string ISO (YYYY-MM-DD) de forma segura
function obtenerFechaISO(val) {
  if (!val) return "";
  const s = String(val);
  if (s.includes("T")) return s.split("T")[0];
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ─────────────────────────────────────────────────────────────────────────────
export function Dashboard({ pagosPendientes: propPagosPendientes }) {
  const [periodo, setPeriodo]               = useState("mensual");

  // ── Estado ──────────────────────────────────────────────────────────────────
  const [productos, setProductos]           = useState([]);
  const [insumos, setInsumos]               = useState([]);
  const [pedidos, setPedidos]               = useState([]);
  const [localPagosPendientes]              = useState([]);

  const pagosPendientes = propPagosPendientes !== undefined ? propPagosPendientes : localPagosPendientes;

  const [cargando, setCargando]             = useState(true);
  const [error, setError]                   = useState(null);
  const [fechaDesde, setFechaDesde]         = useState("");
  const [fechaHasta, setFechaHasta]         = useState("");
  const [selectedPago, setSelectedPago]     = useState(null);

  // ── Al montar, verificar si se solicitó hacer scroll a pagos pendientes ─────
  useEffect(() => {
    if (sessionStorage.getItem('scroll_to_payments') === 'true') {
      sessionStorage.removeItem('scroll_to_payments');
      setTimeout(() => {
        const target = document.getElementById('section-pagos-pendientes');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, []);

  // ── Cargar datos del backend al montar ──────────────────────────────────────
  useEffect(() => {
    async function cargarDatos() {
      setCargando(true);
      setError(null);
      try {
        // Llamadas en paralelo para mayor velocidad
        const [resProductos, resInsumos, resPedidos] = await Promise.all([
          fetch(`${API_URL}/productos`),
          fetch(`${API_URL}/insumos`),
          fetch(`${API_URL}/pedidos`),
        ]);

        if (!resProductos.ok) throw new Error("Error al cargar productos.");
        if (!resInsumos.ok)   throw new Error("Error al cargar insumos.");
        if (!resPedidos.ok)   throw new Error("Error al cargar pedidos.");

        const [dataProductos, dataInsumos, dataPedidos] = await Promise.all([
          resProductos.json(),
          resInsumos.json(),
          resPedidos.json(),
        ]);

        setProductos(Array.isArray(dataProductos) ? dataProductos : []);
        setInsumos(Array.isArray(dataInsumos) ? dataInsumos : []);
        setPedidos(Array.isArray(dataPedidos) ? dataPedidos : []);
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

  // ── Filtrar productos por rango de fechas ────────────────────────────────────
  const productosFiltrados = useMemo(() => {
    return productos.filter((producto) => {
      const fechaStr = obtenerFechaISO(producto.fecha_pedido || producto.Fecha_Pedido);
      if (fechaDesde && (!fechaStr || fechaStr < fechaDesde)) return false;
      if (fechaHasta && (!fechaStr || fechaStr > fechaHasta)) return false;
      return true;
    });
  }, [productos, fechaDesde, fechaHasta]);

  // ── Filtrar pedidos por rango de fechas ──────────────────────────────────────
  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter((pedido) => {
      const fechaStr = obtenerFechaISO(pedido.fecha_generacion || pedido.Fecha_Generacion);
      if (fechaDesde && (!fechaStr || fechaStr < fechaDesde)) return false;
      if (fechaHasta && (!fechaStr || fechaStr > fechaHasta)) return false;
      return true;
    });
  }, [pedidos, fechaDesde, fechaHasta]);

  // ── Estadísticas de productos (dinámicas según filtros) ──────────────────────
  const productosPendientes = useMemo(() => {
    return productosFiltrados.filter(
      (p) => (p.estado || p.Estado || "").toLowerCase() === "pendiente"
    ).length;
  }, [productosFiltrados]);

  const productosTerminados = useMemo(() => {
    return productosFiltrados.filter(
      (p) => (p.estado || p.Estado || "").toLowerCase() === "terminado"
    ).length;
  }, [productosFiltrados]);

  const productosEnProduccion = useMemo(() => {
    return productosFiltrados.filter(
      (p) => (p.estado || p.Estado || "").toLowerCase() === "en_produccion"
    ).length;
  }, [productosFiltrados]);

  const pedidosFacturados = useMemo(() => {
    return pedidosFiltrados.filter(
      (p) => (p.estado_facturacion ?? p.Estado_Facturacion) === "se_factura"
    );
  }, [pedidosFiltrados]);

  const totalFacturacion = useMemo(() => {
    return pedidosFacturados.reduce(
      (sum, p) => sum + Number(p.precio_total ?? p.Precio_Total ?? 0),
      0
    );
  }, [pedidosFacturados]);

  // ── Histograma de modelos más vendidos ───────────────────────────────────────
  const histogramaModelos = useMemo(() => {
    const modelosMap = new Map();
    productosFiltrados.forEach((producto) => {
      const nombreModelo = producto.modelo || producto.Modelo || "Desconocido";
      const cantidad = modelosMap.get(nombreModelo) || 0;
      modelosMap.set(nombreModelo, cantidad + (Number(producto.cantidad || producto.Cantidad) || 1));
    });
    return Array.from(modelosMap.entries())
      .map(([modeloName, cantidad]) => ({
        name: modeloName,
        modelo: modeloName,
        cantidad,
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [productosFiltrados]);

  // ── Productos por período (Día, Mes, Año) ────────────────────────────────────
  const productosPorMes = useMemo(() => {
    const mesesMap = new Map();
    productosFiltrados.forEach((producto) => {
      const fechaISO = obtenerFechaISO(producto.fecha_pedido || producto.Fecha_Pedido);
      if (!fechaISO) return;
      const parts = fechaISO.split("-");
      if (parts.length < 3) return;

      let key;
      if (periodo === "mensual") {
        key = `${parts[0]}-${parts[1]}`;
      } else {
        key = parts[0];
      }
      const cantidad = mesesMap.get(key) || 0;
      mesesMap.set(key, cantidad + (Number(producto.cantidad || producto.Cantidad) || 1));
    });

    return Array.from(mesesMap.entries())
      .map(([periodoKey, cantidad]) => ({
        periodo: periodoKey,
        productos: cantidad,
      }))
      .sort((a, b) => a.periodo.localeCompare(b.periodo));
  }, [productosFiltrados, periodo]);

  // ── Formatear etiqueta del período ──────────────────────────────────────────
  function formatPeriodoLabel(periodoStr) {
    if (!periodoStr) return "";
    if (periodo === "mensual") {
      const parts = periodoStr.split("-");
      if (parts.length >= 2) {
        const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
        const monthIdx = parseInt(parts[1], 10) - 1;
        return `${meses[monthIdx] || parts[1]} ${parts[0]}`;
      }
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
          icon={Package}
          color="bg-blue-500"
        />
        <StatCard
          title="Facturación Total"
          value={`$ ${totalFacturacion.toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          change={`${pedidosFacturados.length} pedido(s) facturado(s)`}
          icon={DollarSign}
          color="bg-purple-500"
        />
      </div>

      {/* Filtros de fecha */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">Filtrar por fecha:</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 font-medium">Desde:</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 font-medium">Hasta:</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all bg-white"
              />
            </div>
            {(fechaDesde || fechaHasta) && (
              <button
                onClick={() => { setFechaDesde(""); setFechaHasta(""); }}
                className="text-sm text-red-700 hover:text-red-800 font-medium underline transition-all"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Modelos más vendidos */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Modelos Más Vendidos</h3>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
            <h3 className="text-lg font-semibold text-gray-800">
              Productos Pedidos por {periodo === "mensual" ? "Mes" : "Año"}
            </h3>
            <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-semibold text-gray-600 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setPeriodo("mensual")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  periodo === "mensual"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "hover:text-gray-900"
                }`}
              >
                Mes
              </button>
              <button
                type="button"
                onClick={() => setPeriodo("anual")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  periodo === "anual"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "hover:text-gray-900"
                }`}
              >
                Año
              </button>
            </div>
          </div>
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
      <div id="section-pagos-pendientes" className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Avisos de Pagos Pendientes</h3>

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
                    <p className="text-sm text-gray-800 font-medium">{pago.nombre}</p>
                    <p className="text-xs text-gray-500">
                      {pago.tipo === "cliente" ? "Cliente" : "Proveedor"} — Vence: {pago.fecha_vencimiento}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-base font-bold text-red-700">
                      ${Number(pago.monto_adeudado).toLocaleString("es-AR")}
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
              <h3 className="text-xl text-gray-800 font-bold">Detalle del Aviso</h3>
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
                  <p className="text-lg font-bold text-gray-800">{selectedPago.nombre}</p>
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
                  <p className="text-xl font-bold text-red-700">
                    ${Number(selectedPago.monto_adeudado).toLocaleString("es-AR")}
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setSelectedPago(null)}
                  className="w-full px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors font-medium"
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
          <p className="text-3xl font-bold mb-2 text-gray-800">{value}</p>
          <p className="text-xs text-gray-400">{change}</p>
        </div>
        <div className={`${color} text-white p-3 rounded-xl`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}
