import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  X,
  Calendar,
  CheckCircle,
  AlertCircle,
  Users,
  Truck,
} from "lucide-react";

// ── URL base del backend ──────────────────────────────────────────────────────
const API_URL = "http://localhost:4000/api";

// ── Config de estados para badges ────────────────────────────────────────────
const estadoConfig = {
  pagada:    { label: "Pagada",    color: "bg-green-100 text-green-700" },
  pendiente: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700" },
  vencida:   { label: "Vencida",   color: "bg-red-100 text-red-700" },
};

// ── Formulario vacío ──────────────────────────────────────────────────────────
const FORM_VACIO = {
  entidad:       "",
  fecha:         new Date().toISOString().split("T")[0],
  vencimiento:   "",
  monto:         0,
  concepto:      "",
  observaciones: "",
  estado:        "pendiente",
  pedido_id:     null,
};

// ─────────────────────────────────────────────────────────────────────────────
export function Facturas() {
  // ── Estado principal ────────────────────────────────────────────────────────
  const [tipoVista, setTipoVista]       = useState("cliente");
  const [facturas, setFacturas]         = useState([]);
  const [clientes, setClientes]         = useState([]);
  const [proveedores, setProveedores]   = useState([]);
  const [pedidos, setPedidos]           = useState([]);
  const [cargando, setCargando]         = useState(true);
  const [error, setError]               = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);
  const [errorForm, setErrorForm]       = useState(null);

  // ── Filtros ─────────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm]     = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [fechaDesde, setFechaDesde]     = useState("");
  const [fechaHasta, setFechaHasta]     = useState("");

  // ── Modales ─────────────────────────────────────────────────────────────────
  const [showAddModal, setShowAddModal]       = useState(false);
  const [showViewModal, setShowViewModal]     = useState(false);
  const [viewingFactura, setViewingFactura]   = useState(null);
  const [isEditandoFactura, setIsEditandoFactura] = useState(false);
  const [newFactura, setNewFactura]           = useState(FORM_VACIO);

  // ── Buscador con sugerencias para entidad ───────────────────────────────────
  const [searchEntidad, setSearchEntidad]     = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // ── Cargar datos al montar y al cambiar de vista ────────────────────────────
  useEffect(() => {
    cargarFacturas();
  }, [tipoVista]);

  useEffect(() => {
    cargarDatosAuxiliares();
  }, []);

  async function cargarFacturas() {
    setCargando(true);
    setError(null);
    try {
      const ruta = tipoVista === "cliente" ? "/facturas/clientes" : "/facturas/proveedores";
      const res  = await fetch(`${API_URL}${ruta}`);
      if (!res.ok) throw new Error("Error al cargar las facturas.");
      setFacturas(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  async function cargarDatosAuxiliares() {
    try {
      const [resClientes, resProveedores, resPedidos] = await Promise.all([
        fetch(`${API_URL}/clientes`),
        fetch(`${API_URL}/proveedores`),
        fetch(`${API_URL}/pedidos`),
      ]);
      if (resClientes.ok)    setClientes(await resClientes.json());
      if (resProveedores.ok) setProveedores(await resProveedores.json());
      if (resPedidos.ok)     setPedidos(await resPedidos.json());
    } catch (err) {
      console.error("Error cargando datos auxiliares:", err);
    }
  }

  // ── Sugerencias según tipo de vista ─────────────────────────────────────────
  const entidadesDisponibles = tipoVista === "cliente"
    ? clientes.map((c) => `${c.nombre} ${c.apellido}`.trim() || c.razon_social)
    : proveedores.map((p) => p.razon_social || `${p.nombre} ${p.apellido}`.trim());

  const sugerenciasFiltradas = entidadesDisponibles.filter((e) =>
    e.toLowerCase().includes(searchEntidad.toLowerCase())
  );

  // ── Pedidos disponibles para asociar (solo clientes, solo con todos terminados) ──
  function getPedidosDisponibles(entidad, currentFacturaId = null) {
    const pedidosDelCliente = pedidos.filter((p) => p.cliente === entidad);
    const pedidosAsociados  = new Set(
      facturas
        .filter((f) => f.tipo === "cliente" && f.pedido_id && f.id !== currentFacturaId)
        .map((f) => f.pedido_id)
    );
    return pedidosDelCliente.filter(
      (p) => !pedidosAsociados.has(p.id) && p.estado === "terminado"
    );
  }

  // ── Filtrado local ───────────────────────────────────────────────────────────
  const facturasFiltradas = facturas.filter((f) => {
    const termino = searchTerm.toLowerCase();
    const matchSearch =
      (f.numero_factura || "").toLowerCase().includes(termino) ||
      (f.entidad        || "").toLowerCase().includes(termino) ||
      (f.concepto       || "").toLowerCase().includes(termino);
    const matchEstado  = filterEstado === "todos" || f.estado === filterEstado;
    const matchDesde   = !fechaDesde || f.fecha >= fechaDesde;
    const matchHasta   = !fechaHasta || f.fecha <= fechaHasta;
    return matchSearch && matchEstado && matchDesde && matchHasta;
  });

  // ── Totales ──────────────────────────────────────────────────────────────────
  const totalPagadas   = facturasFiltradas.filter((f) => f.estado === "pagada").reduce((s, f) => s + Number(f.monto), 0);
  const totalPendiente = facturasFiltradas.filter((f) => f.estado === "pendiente").reduce((s, f) => s + Number(f.monto), 0);
  const totalVencidas  = facturasFiltradas.filter((f) => f.estado === "vencida").reduce((s, f) => s + Number(f.monto), 0);

  // ── Helpers de UI ────────────────────────────────────────────────────────────
  function mostrarExito(msg) {
    setMensajeExito(msg);
    setTimeout(() => setMensajeExito(null), 3000);
  }

  function abrirAdd() {
    setNewFactura({ ...FORM_VACIO });
    setSearchEntidad("");
    setShowSuggestions(false);
    setErrorForm(null);
    setShowAddModal(true);
  }

  function abrirVer(factura) {
    setViewingFactura({ ...factura });
    setIsEditandoFactura(false);
    setErrorForm(null);
    setShowViewModal(true);
  }

  function cerrarVer() {
    setShowViewModal(false);
    setIsEditandoFactura(false);
    setErrorForm(null);
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────────
  async function handleAddFactura(e) {
    e.preventDefault();
    setErrorForm(null);

    if (!newFactura.entidad || !newFactura.fecha || !newFactura.vencimiento || !newFactura.monto) {
      setErrorForm("Por favor completá todos los campos obligatorios.");
      return;
    }

    const ruta = tipoVista === "cliente" ? "/facturas/clientes" : "/facturas/proveedores";
    try {
      const res = await fetch(`${API_URL}${ruta}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...newFactura, tipo: tipoVista }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorForm(data.error || "Error al agregar."); return; }

      setFacturas((prev) => [...prev, data]);
      setShowAddModal(false);
      setNewFactura(FORM_VACIO);
      mostrarExito("Factura agregada correctamente.");
    } catch (err) {
      setErrorForm(err.message);
    }
  }

  async function handleSaveFacturaChanges() {
    if (!viewingFactura) return;
    setErrorForm(null);

    const ruta = viewingFactura.tipo === "cliente" ? "/facturas/clientes" : "/facturas/proveedores";
    try {
      const res = await fetch(`${API_URL}${ruta}/${viewingFactura.id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(viewingFactura),
      });
      const data = await res.json();
      if (!res.ok) { setErrorForm(data.error || "Error al guardar."); return; }

      setFacturas((prev) => prev.map((f) => (f.id === data.id ? data : f)));
      setIsEditandoFactura(false);
      mostrarExito("Factura actualizada correctamente.");
    } catch (err) {
      setErrorForm(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("¿Está seguro que desea eliminar esta factura?")) return;

    const factura = facturas.find((f) => f.id === id);
    const ruta    = factura?.tipo === "cliente" ? "/facturas/clientes" : "/facturas/proveedores";
    try {
      const res = await fetch(`${API_URL}${ruta}/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Error al eliminar."); return; }

      setFacturas((prev) => prev.filter((f) => f.id !== id));
      cerrarVer();
      mostrarExito("Factura eliminada correctamente.");
    } catch (err) {
      setError(err.message);
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

      {/* Error global */}
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X size={16} /></button>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl text-gray-800">Gestión de Facturas</h2>
          <p className="text-gray-500 text-sm mt-1">
            {facturasFiltradas.length} facturas de {tipoVista === "cliente" ? "clientes" : "proveedores"}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => { setTipoVista("cliente"); setSearchTerm(""); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                tipoVista === "cliente" ? "bg-white text-red-700 shadow-sm" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Users size={18} /> Clientes
            </button>
            <button
              onClick={() => { setTipoVista("proveedor"); setSearchTerm(""); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                tipoVista === "proveedor" ? "bg-white text-red-700 shadow-sm" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Truck size={18} /> Proveedores
            </button>
          </div>
          <button
            onClick={abrirAdd}
            className="flex items-center gap-2 bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors"
          >
            <Plus size={20} /> Agregar Factura
          </button>
        </div>
      </div>

      {/* ── Resumen de totales ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="text-green-600" size={20} />
            <span className="text-sm text-green-700">Facturas Pagadas</span>
          </div>
          <p className="text-2xl text-green-800">${totalPagadas.toLocaleString()}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="text-yellow-600" size={20} />
            <span className="text-sm text-yellow-700">Facturas Pendientes</span>
          </div>
          <p className="text-2xl text-yellow-800">${totalPendiente.toLocaleString()}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="text-red-600" size={20} />
            <span className="text-sm text-red-700">Facturas Vencidas</span>
          </div>
          <p className="text-2xl text-red-800">${totalVencidas.toLocaleString()}</p>
        </div>
      </div>

      {/* ── Filtros ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar facturas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-20 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos los Estados</option>
            <option value="pagada">Pagada</option>
            <option value="pendiente">Pendiente</option>
            <option value="vencida">Vencida</option>
          </select>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-gray-400" />
            <span className="text-sm text-gray-600">Filtrar por fecha:</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Desde:</label>
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Hasta:</label>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {(fechaDesde || fechaHasta) && (
            <button onClick={() => { setFechaDesde(""); setFechaHasta(""); }}
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── Tabla ─────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {cargando ? (
            <div className="p-8 text-center text-gray-500">Cargando facturas...</div>
          ) : facturasFiltradas.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No hay facturas para mostrar.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Nº Factura</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                    {tipoVista === "cliente" ? "Cliente" : "Proveedor"}
                  </th>
                  {tipoVista === "proveedor" && (
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Concepto</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Vencimiento</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Monto</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {facturasFiltradas.map((factura) => (
                  <tr key={factura.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{factura.numero_factura}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{factura.entidad}</td>
                    {tipoVista === "proveedor" && (
                      <td className="px-6 py-4 text-sm text-gray-600">{factura.concepto || "—"}</td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{factura.fecha}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{factura.vencimiento}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      ${Number(factura.monto).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${estadoConfig[factura.estado]?.color}`}>
                        {estadoConfig[factura.estado]?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => abrirVer(factura)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600" title="Ver detalles">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => alert("Descarga PDF — En desarrollo")}
                          className="p-2 hover:bg-green-50 rounded-lg transition-colors text-green-600" title="Descargar">
                          <Download size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Modal Agregar ─────────────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl text-gray-800">
                Agregar Nueva Factura — {tipoVista === "cliente" ? "Cliente" : "Proveedor"}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddFactura} className="p-6 space-y-4">
              {errorForm && (
                <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-lg text-sm">
                  {errorForm}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Buscador de entidad con sugerencias */}
                <div className="sm:col-span-2">
                  <label className="block text-sm mb-2 text-gray-700">
                    {tipoVista === "cliente" ? "Cliente" : "Proveedor"} *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchEntidad}
                      onChange={(e) => {
                        setSearchEntidad(e.target.value);
                        setShowSuggestions(true);
                        setNewFactura({ ...newFactura, entidad: "" });
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Buscar ${tipoVista === "cliente" ? "cliente" : "proveedor"}...`}
                    />
                    {showSuggestions && searchEntidad && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {sugerenciasFiltradas.length > 0 ? (
                          sugerenciasFiltradas.map((entidad, i) => (
                            <button key={i} type="button"
                              onClick={() => {
                                setNewFactura({ ...newFactura, entidad });
                                setSearchEntidad(entidad);
                                setShowSuggestions(false);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors text-sm"
                            >
                              {entidad}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-sm text-gray-500">No se encontraron resultados</div>
                        )}
                      </div>
                    )}
                    {newFactura.entidad && (
                      <div className="mt-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                        Seleccionado: {newFactura.entidad}
                      </div>
                    )}
                  </div>
                </div>

                {/* Fecha emisión */}
                <div>
                  <label className="block text-sm mb-2 text-gray-700">Fecha de Emisión *</label>
                  <input type="date" value={newFactura.fecha} required
                    onChange={(e) => setNewFactura({ ...newFactura, fecha: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Fecha vencimiento */}
                <div>
                  <label className="block text-sm mb-2 text-gray-700">Fecha de Vencimiento *</label>
                  <input type="date" value={newFactura.vencimiento} required
                    onChange={(e) => setNewFactura({ ...newFactura, vencimiento: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Monto */}
                <div className="sm:col-span-2">
                  <label className="block text-sm mb-2 text-gray-700">Monto *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input type="number" min="0" step="0.01" required
                      value={newFactura.monto || ""}
                      onChange={(e) => setNewFactura({ ...newFactura, monto: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Pedido asociado (solo clientes) */}
                {tipoVista === "cliente" && newFactura.entidad && (
                  <div className="sm:col-span-2">
                    <label className="block text-sm mb-2 text-gray-700">Pedido Asociado (Opcional)</label>
                    <select
                      value={newFactura.pedido_id || ""}
                      onChange={(e) => setNewFactura({ ...newFactura, pedido_id: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sin pedido asociado</option>
                      {getPedidosDisponibles(newFactura.entidad).map((pedido) => (
                        <option key={pedido.id} value={pedido.id}>
                          {pedido.numero_pedido} — ${Number(pedido.precio_total).toLocaleString()} ({pedido.fecha_generacion})
                        </option>
                      ))}
                    </select>
                    {getPedidosDisponibles(newFactura.entidad).length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        No hay pedidos disponibles (ya tienen factura o productos sin terminar).
                      </p>
                    )}
                  </div>
                )}

                {/* Concepto */}
                <div className="sm:col-span-2">
                  <label className="block text-sm mb-2 text-gray-700">Concepto</label>
                  <input type="text" value={newFactura.concepto}
                    onChange={(e) => setNewFactura({ ...newFactura, concepto: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descripción del concepto"
                  />
                </div>

                {/* Observaciones */}
                <div className="sm:col-span-2">
                  <label className="block text-sm mb-2 text-gray-700">Observaciones</label>
                  <textarea rows={3} value={newFactura.observaciones}
                    onChange={(e) => setNewFactura({ ...newFactura, observaciones: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Notas adicionales..."
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Agregar Factura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Ver / Editar ────────────────────────────────────────────────── */}
      {showViewModal && viewingFactura && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl text-gray-800">
                {isEditandoFactura ? "Editar" : "Detalle"} Factura — {viewingFactura.numero_factura}
              </h3>
              <button onClick={cerrarVer} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {errorForm && (
                <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-lg text-sm">
                  {errorForm}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Entidad (solo lectura) */}
                <div>
                  <p className="text-sm text-gray-500">{viewingFactura.tipo === "cliente" ? "Cliente" : "Proveedor"}</p>
                  <p className="text-base text-gray-800">{viewingFactura.entidad}</p>
                </div>

                {/* Tipo badge */}
                <div>
                  <p className="text-sm text-gray-500">Tipo</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs ${
                    viewingFactura.tipo === "cliente" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                  }`}>
                    {viewingFactura.tipo === "cliente" ? "Cliente" : "Proveedor"}
                  </span>
                </div>

                {/* Pedido asociado */}
                {viewingFactura.tipo === "cliente" && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 mb-1">Pedido Asociado</p>
                    {isEditandoFactura ? (
                      <>
                        <select
                          value={viewingFactura.pedido_id || ""}
                          onChange={(e) => setViewingFactura({
                            ...viewingFactura,
                            pedido_id: e.target.value ? parseInt(e.target.value) : null,
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Sin pedido asociado</option>
                          {getPedidosDisponibles(viewingFactura.entidad, viewingFactura.id).map((pedido) => (
                            <option key={pedido.id} value={pedido.id}>
                              {pedido.numero_pedido} — ${Number(pedido.precio_total).toLocaleString()}
                            </option>
                          ))}
                          {viewingFactura.pedido_id && (
                            <option value={viewingFactura.pedido_id}>
                              {pedidos.find((p) => p.id === viewingFactura.pedido_id)?.numero_pedido || "N/A"} (Actual)
                            </option>
                          )}
                        </select>
                      </>
                    ) : (
                      <p className="text-base text-gray-800">
                        {viewingFactura.pedido_id
                          ? pedidos.find((p) => p.id === viewingFactura.pedido_id)?.numero_pedido || "N/A"
                          : "Sin pedido asociado"}
                      </p>
                    )}
                  </div>
                )}

                {/* Concepto */}
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Concepto</p>
                  {isEditandoFactura ? (
                    <input type="text" value={viewingFactura.concepto || ""}
                      onChange={(e) => setViewingFactura({ ...viewingFactura, concepto: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-base text-gray-800">{viewingFactura.concepto || "—"}</p>
                  )}
                </div>

                {/* Fecha emisión */}
                <div>
                  <p className="text-sm text-gray-500">Fecha de Emisión</p>
                  {isEditandoFactura ? (
                    <input type="date" value={viewingFactura.fecha}
                      onChange={(e) => setViewingFactura({ ...viewingFactura, fecha: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-base text-gray-800">{viewingFactura.fecha}</p>
                  )}
                </div>

                {/* Fecha vencimiento */}
                <div>
                  <p className="text-sm text-gray-500">Fecha de Vencimiento</p>
                  {isEditandoFactura ? (
                    <input type="date" value={viewingFactura.vencimiento}
                      onChange={(e) => setViewingFactura({ ...viewingFactura, vencimiento: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-base text-gray-800">{viewingFactura.vencimiento}</p>
                  )}
                </div>

                {/* Monto */}
                <div>
                  <p className="text-sm text-gray-500">Monto Total</p>
                  {isEditandoFactura ? (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input type="number" min="0" step="0.01"
                        value={viewingFactura.monto}
                        onChange={(e) => setViewingFactura({ ...viewingFactura, monto: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ) : (
                    <p className="text-lg text-gray-800">${Number(viewingFactura.monto).toLocaleString()}</p>
                  )}
                </div>

                {/* Estado */}
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  {isEditandoFactura ? (
                    <select value={viewingFactura.estado}
                      onChange={(e) => setViewingFactura({ ...viewingFactura, estado: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="pagada">Pagada</option>
                      <option value="vencida">Vencida</option>
                    </select>
                  ) : (
                    <span className={`inline-block px-3 py-1 rounded-full text-xs ${estadoConfig[viewingFactura.estado]?.color}`}>
                      {estadoConfig[viewingFactura.estado]?.label}
                    </span>
                  )}
                </div>

                {/* Observaciones */}
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Observaciones</p>
                  {isEditandoFactura ? (
                    <textarea rows={3} value={viewingFactura.observaciones || ""}
                      onChange={(e) => setViewingFactura({ ...viewingFactura, observaciones: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  ) : (
                    <p className="text-base text-gray-800">{viewingFactura.observaciones || "—"}</p>
                  )}
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-4 pt-4 border-t border-gray-200">
                {isEditandoFactura ? (
                  <>
                    <button onClick={() => { setIsEditandoFactura(false); setErrorForm(null); }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      Cancelar
                    </button>
                    <button onClick={handleSaveFacturaChanges}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Guardar Cambios
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setIsEditandoFactura(true)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                      <Edit size={16} /> Editar
                    </button>
                    <button onClick={() => handleDelete(viewingFactura.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                      <Trash2 size={16} /> Eliminar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
