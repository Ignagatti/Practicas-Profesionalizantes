import { useState, useEffect, useMemo, useRef } from "react";
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
  Database,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Loader2
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

import {
  parseMoney,
  roundMoney,
  formatMoney,
  formatDate
} from "../utils/currencyUtils";

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
export function Dashboard({ pagosPendientes: propPagosPendientes, onActualizarPendientes }) {
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

  // ── Estados para Respaldo y Restauración ─────────────────────────────────────
  const [exportandoBackup, setExportandoBackup] = useState(false);
  const [restaurandoBackup, setRestaurandoBackup] = useState(false);
  const [modalRestaurarAbierto, setModalRestaurarAbierto] = useState(false);
  const [archivoBackup, setArchivoBackup]   = useState(null);
  const [mensajeBackup, setMensajeBackup]   = useState(null); // { tipo: 'exito' | 'error', texto: '' }
  const fileInputRef                        = useRef(null);

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

  // ── Función para cargar datos del backend ──────────────────────────────────
  async function cargarDatos(esReintento = false) {
    setCargando(true);
    setError(null);
    try {
      // Llamadas en paralelo para mayor velocidad
      const [resProductos, resInsumos, resPedidos] = await Promise.all([
        fetch(`${API_URL}/productos`),
        fetch(`${API_URL}/insumos`),
        fetch(`${API_URL}/pedidos`),
      ]);

      if (!resProductos.ok || !resInsumos.ok || !resPedidos.ok) {
        throw new Error("Error de respuesta al sincronizar con el servidor.");
      }

      const [dataProductos, dataInsumos, dataPedidos] = await Promise.all([
        resProductos.json(),
        resInsumos.json(),
        resPedidos.json(),
      ]);

      setProductos(Array.isArray(dataProductos) ? dataProductos : []);
      setInsumos(Array.isArray(dataInsumos) ? dataInsumos : []);
      setPedidos(Array.isArray(dataPedidos) ? dataPedidos : []);

      // Notificar actualización de avisos pendientes a nivel global
      window.dispatchEvent(new CustomEvent('acuaber:actualizar_pendientes'));
      if (typeof onActualizarPendientes === 'function') {
        onActualizarPendientes();
      }
    } catch (err) {
      if (!esReintento) {
        // Reintentar automáticamente una vez tras breve pausa
        setTimeout(() => cargarDatos(true), 800);
        return;
      }
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
  }, []);

  // ── Descargar Backup SQL ────────────────────────────────────────────────────
  const handleDescargarBackup = async () => {
    setExportandoBackup(true);
    setMensajeBackup(null);
    try {
      const resp = await fetch(`${API_URL}/backup/exportar`);
      if (!resp.ok) {
        const dataErr = await resp.json().catch(() => ({}));
        throw new Error(dataErr.error || "No se pudo generar la copia de seguridad.");
      }

      const blob = await resp.blob();
      const disposition = resp.headers.get("Content-Disposition");
      let nombreArchivo = "backup_acuaber.sql";
      if (disposition && disposition.includes("filename=")) {
        nombreArchivo = disposition.split("filename=")[1].replace(/"/g, "").trim();
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nombreArchivo;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setMensajeBackup({
        tipo: "exito",
        texto: `¡Copia de seguridad "${nombreArchivo}" descargada correctamente!`
      });
      setTimeout(() => setMensajeBackup(null), 6000);
    } catch (err) {
      console.error("Error al exportar backup:", err);
      setMensajeBackup({
        tipo: "error",
        texto: "Error al exportar copia de seguridad: " + err.message
      });
    } finally {
      setExportandoBackup(false);
    }
  };

  // ── Seleccionar archivo para Restaurar ───────────────────────────────────────
  const handleSeleccionarArchivo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".sql")) {
      setMensajeBackup({
        tipo: "error",
        texto: "El archivo seleccionado debe tener extensión .sql"
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setArchivoBackup(file);
    setModalRestaurarAbierto(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Confirmar y Ejecutar Restauración ───────────────────────────────────────
  const handleConfirmarRestauracion = async () => {
    if (!archivoBackup) return;

    setRestaurandoBackup(true);
    setMensajeBackup(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const sqlContent = event.target?.result;
          const resp = await fetch(`${API_URL}/backup/restaurar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sqlContent })
          });

          const data = await resp.json();
          if (!resp.ok || !data.ok) {
            throw new Error(data.error || "No se pudo restaurar la base de datos.");
          }

          setModalRestaurarAbierto(false);
          setArchivoBackup(null);
          setMensajeBackup({
            tipo: "exito",
            texto: "¡Base de datos restaurada exitosamente! Los datos han sido actualizados."
          });

          // Recargar todos los datos del dashboard y tablas
          await cargarDatos();
          setTimeout(() => setMensajeBackup(null), 7000);
        } catch (subErr) {
          console.error("Error procesando restauración:", subErr);
          setMensajeBackup({
            tipo: "error",
            texto: "Error en la restauración: " + subErr.message
          });
        } finally {
          setRestaurandoBackup(false);
        }
      };

      reader.onerror = () => {
        setRestaurandoBackup(false);
        setMensajeBackup({
          tipo: "error",
          texto: "Error al leer el archivo desde tu computadora."
        });
      };

      reader.readAsText(archivoBackup);
    } catch (err) {
      console.error("Error al restaurar backup:", err);
      setRestaurandoBackup(false);
      setMensajeBackup({
        tipo: "error",
        texto: "Error: " + err.message
      });
    }
  };

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
          value={`$${formatMoney(totalFacturacion)}`}
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

      {/* ── Sección de Respaldo y Recuperación de Datos ────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-red-50 text-[#8b0000] rounded-xl border border-red-100">
              <Database size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Copia de Seguridad y Resguardo del Sistema</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Generá copias completas de seguridad en tu equipo o restaurá la base de datos desde un archivo SQL.
              </p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-3">
            {/* Input file invisible */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleSeleccionarArchivo}
              accept=".sql"
              className="hidden"
            />

            {/* Botón Descargar Backup */}
            <button
              onClick={handleDescargarBackup}
              disabled={exportandoBackup || restaurandoBackup}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm ${
                exportandoBackup
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 active:scale-[0.99]"
              }`}
              title="Descargar copia de seguridad en formato .sql"
            >
              {exportandoBackup ? (
                <>
                  <Loader2 size={16} className="animate-spin text-[#8b0000]" />
                  <span>Generando copia...</span>
                </>
              ) : (
                <>
                  <Download size={16} className="text-[#8b0000]" />
                  <span>Descargar Copia (.sql)</span>
                </>
              )}
            </button>

            {/* Botón Restaurar Backup */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={exportandoBackup || restaurandoBackup}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all shadow-sm ${
                restaurandoBackup
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#8b0000] hover:bg-[#6b0000] hover:shadow-md active:scale-[0.99]"
              }`}
              title="Restaurar base de datos a partir de un archivo .sql descargado"
            >
              {restaurandoBackup ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Restaurando...</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span>Restaurar Base de Datos</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mensaje de alerta / feedback */}
        {mensajeBackup && (
          <div
            className={`mt-4 p-3.5 rounded-xl text-sm flex items-center justify-between transition-all ${
              mensajeBackup.tipo === "exito"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {mensajeBackup.tipo === "exito" ? (
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle size={18} className="text-red-600 shrink-0" />
              )}
              <span className="font-medium">{mensajeBackup.texto}</span>
            </div>
            <button
              onClick={() => setMensajeBackup(null)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Modal Confirmación de Restauración */}
      {modalRestaurarAbierto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
                <AlertTriangle size={28} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">¿Confirmar restauración de datos?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Estás a punto de restaurar la base de datos con el archivo: <br />
                <strong className="text-gray-800 font-mono text-xs bg-gray-100 px-2 py-1 rounded inline-block mt-1">
                  {archivoBackup?.name}
                </strong>
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 text-left mb-6">
                <strong>Advertencia de Seguridad:</strong> Esta operación reemplazará los datos actuales por los contenidos en la copia seleccionada dentro de una transacción segura.
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setModalRestaurarAbierto(false);
                    setArchivoBackup(null);
                  }}
                  disabled={restaurandoBackup}
                  className="w-1/2 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarRestauracion}
                  disabled={restaurandoBackup}
                  className={`w-1/2 py-2.5 px-4 rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
                    restaurandoBackup
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-[#8b0000] hover:bg-[#6b0000]"
                  }`}
                >
                  {restaurandoBackup ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Restaurando...</span>
                    </>
                  ) : (
                    <span>Restaurar Datos</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
