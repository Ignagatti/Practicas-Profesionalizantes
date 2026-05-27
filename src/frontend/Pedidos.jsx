import { useState } from "react";
import {
  Search,
  Plus,
  Download,
  Edit,
  Trash2,
  Eye,
  X,
  DollarSign,
  Package,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";

export function Pedidos() {
  const { insumos, productos, pedidos, setPedidos } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [isEditingPedido, setIsEditingPedido] = useState(false);
  const [tempNumeroFactura, setTempNumeroFactura] = useState("");
  const [tempPdfFactura, setTempPdfFactura] = useState(undefined);

  const [newPedido, setNewPedido] = useState({
    cliente: "",
    fechaGeneracion: new Date().toISOString().split("T")[0],
    productos: [],
    seFactura: false,
    estadoPago: "pendiente",
  });

  const [selectedProductosIds, setSelectedProductosIds] = useState([]);
  const [cantidadesPorProducto, setCantidadesPorProducto] = useState({});

  const getInsumoNombre = (id) => {
    if (!id) return "Sin especificar";
    return insumos.find((i) => i.id === id)?.nombre || "Desconocido";
  };

  const getProductoById = (id) => {
    return productos.find((p) => p.id === id);
  };

  const getProductoDescription = (producto) => {
    let desc = getInsumoNombre(producto.modeloId);
    if (producto.telaId) desc += ` - ${getInsumoNombre(producto.telaId)}`;
    if (producto.lustreId) desc += ` - ${getInsumoNombre(producto.lustreId)}`;
    return desc;
  };

  const filteredPedidos = pedidos.filter((pedido) => {
    const matchesSearch =
      pedido.numeroPedido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.cliente.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFechaDesde = !fechaDesde || pedido.fechaGeneracion >= fechaDesde;
    const matchesFechaHasta = !fechaHasta || pedido.fechaGeneracion <= fechaHasta;

    return matchesSearch && matchesFechaDesde && matchesFechaHasta;
  });

  const handleView = (pedido) => {
    setSelectedPedido({ ...pedido });
    setIsEditingPedido(false);
    setTempNumeroFactura("");
    setTempPdfFactura(undefined);
    setShowViewModal(true);
  };

  const handleGuardarFactura = () => {
    if (!selectedPedido) return;

    if (!tempNumeroFactura.trim()) {
      alert("Debe ingresar el número de factura");
      return;
    }

    const pedidoActualizado = {
      ...selectedPedido,
      numeroFactura: tempNumeroFactura,
      pdfFactura: tempPdfFactura,
    };

    setPedidos((prev) =>
      prev.map((p) => (p.id === selectedPedido.id ? pedidoActualizado : p))
    );

    setSelectedPedido(pedidoActualizado);
    setTempNumeroFactura("");
    setTempPdfFactura(undefined);
    alert("Información de factura guardada correctamente");
  };

  const handleAddProductToPedido = () => {
    if (selectedProductosIds.length === 0) {
      alert("Debe seleccionar al menos un producto");
      return;
    }

    for (const productoId of selectedProductosIds) {
      const cantidad = cantidadesPorProducto[productoId] || 1;
      if (cantidad < 1) {
        alert("Todas las cantidades deben ser mayor a 0");
        return;
      }
    }

    const nuevosProdutosPedido = selectedProductosIds.map((productoId) => ({
      productoId,
      cantidadSolicitada: cantidadesPorProducto[productoId] || 1,
    }));

    if (isEditingPedido && selectedPedido) {
      const precioIncremento = nuevosProdutosPedido.reduce((sum, pp) => {
        const producto = getProductoById(pp.productoId);
        return sum + (producto ? producto.precioUnitario * pp.cantidadSolicitada : 0);
      }, 0);

      setSelectedPedido({
        ...selectedPedido,
        productos: [...selectedPedido.productos, ...nuevosProdutosPedido],
        precioTotal: selectedPedido.precioTotal + precioIncremento,
      });
    } else {
      setNewPedido({
        ...newPedido,
        productos: [...newPedido.productos, ...nuevosProdutosPedido],
      });
    }

    setShowAddProductModal(false);
    setSelectedProductosIds([]);
    setCantidadesPorProducto({});
  };

  const handleRemoveProduct = (productoId) => {
    if (!selectedPedido) return;

    const productoPedidoAEliminar = selectedPedido.productos.find(
      (p) => p.productoId === productoId
    );
    if (!productoPedidoAEliminar) return;

    const producto = getProductoById(productoId);
    if (!producto) return;

    setSelectedPedido({
      ...selectedPedido,
      productos: selectedPedido.productos.filter((p) => p.productoId !== productoId),
      precioTotal:
        selectedPedido.precioTotal -
        producto.precioUnitario * productoPedidoAEliminar.cantidadSolicitada,
    });
  };

  const handleSavePedidoChanges = () => {
    if (!selectedPedido) return;

    if (selectedPedido.seFactura && !selectedPedido.numeroFactura?.trim()) {
      alert("Debe ingresar el número de factura para pedidos que se facturan");
      return;
    }

    setPedidos((prev) =>
      prev.map((p) => (p.id === selectedPedido.id ? selectedPedido : p))
    );

    alert("Pedido actualizado correctamente");
    setIsEditingPedido(false);
  };

  const handleCreatePedido = (e) => {
    e.preventDefault();

    if (!newPedido.cliente) {
      alert("Debe seleccionar un cliente");
      return;
    }

    if (newPedido.productos.length === 0) {
      alert("Debe agregar al menos un producto");
      return;
    }

    const newId = Math.max(...pedidos.map((p) => p.id), 0) + 1;
    const numeroPedido = `PED-${String(newId).padStart(3, "0")}`;

    const precioTotal = newPedido.productos.reduce((sum, pp) => {
      const producto = getProductoById(pp.productoId);
      return sum + (producto ? producto.precioUnitario * pp.cantidadSolicitada : 0);
    }, 0);

    const pedidoCompleto = {
      id: newId,
      numeroPedido,
      cliente: newPedido.cliente,
      fechaGeneracion: newPedido.fechaGeneracion,
      productos: newPedido.productos,
      precioTotal,
      seFactura: newPedido.seFactura,
      estadoPago: newPedido.estadoPago,
    };

    setPedidos([...pedidos, pedidoCompleto]);
    setShowAddModal(false);
    setNewPedido({
      cliente: "",
      fechaGeneracion: new Date().toISOString().split("T")[0],
      productos: [],
      seFactura: false,
      estadoPago: "pendiente",
    });

    alert("Pedido generado correctamente");
  };

  const handleDeletePedido = () => {
    if (!selectedPedido) return;

    if (
      confirm(
        `¿Está seguro que desea eliminar el pedido ${selectedPedido.numeroPedido}? Esta acción no se puede deshacer.`
      )
    ) {
      setPedidos((prev) => prev.filter((p) => p.id !== selectedPedido.id));
      setShowViewModal(false);
      setSelectedPedido(null);
      alert("Pedido eliminado correctamente");
    }
  };

  const handleDownloadPDF = () => {
    alert("Función de descarga PDF - En desarrollo");
  };

  const getProductosDisponibles = (cliente, currentPedidoId) => {
    const productosCliente = productos.filter((p) => p.cliente === cliente);

    const productosEnOtrosPedidos = new Set();
    pedidos.forEach((pedido) => {
      if (currentPedidoId && pedido.id === currentPedidoId) return;
      pedido.productos.forEach((pp) => {
        productosEnOtrosPedidos.add(pp.productoId);
      });
    });

    const productosYaAgregados = new Set();
    if (isEditingPedido && selectedPedido) {
      selectedPedido.productos.forEach((pp) => {
        productosYaAgregados.add(pp.productoId);
      });
    } else {
      newPedido.productos.forEach((pp) => {
        productosYaAgregados.add(pp.productoId);
      });
    }

    return productosCliente.filter(
      (p) => !productosEnOtrosPedidos.has(p.id) && !productosYaAgregados.has(p.id)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl text-gray-800">Gestión de Pedidos</h2>
          <p className="text-gray-500 text-sm mt-1">
            {filteredPedidos.length} pedidos registrados
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors"
        >
          <Plus size={20} />
          Agregar Pedido
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Buscar por número de pedido o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Desde:</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Hasta:</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Tabla de Pedidos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-3 text-left text-xs text-gray-500 uppercase">
                  Nº Pedido
                </th>
                <th className="px-3 py-3 text-left text-xs text-gray-500 uppercase">
                  Cliente
                </th>
                <th className="px-3 py-3 text-left text-xs text-gray-500 uppercase">
                  Fecha
                </th>
                <th className="px-3 py-3 text-left text-xs text-gray-500 uppercase">
                  Pago
                </th>
                <th className="px-3 py-3 text-left text-xs text-gray-500 uppercase">
                  Factura
                </th>
                <th className="px-3 py-3 text-left text-xs text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-3 py-3 text-right text-xs text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPedidos.map((pedido) => {
                const estadoFactura = !pedido.seFactura
                  ? { label: "No se factura", color: "bg-gray-100 text-gray-700" }
                  : pedido.numeroFactura
                  ? { label: "Facturado", color: "bg-green-100 text-green-700" }
                  : { label: "Falta facturar", color: "bg-yellow-100 text-yellow-700" };

                return (
                  <tr key={pedido.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-800">
                      {pedido.numeroPedido}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-800">
                      {pedido.cliente}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                      {pedido.fechaGeneracion}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          pedido.estadoPago === "pago"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {pedido.estadoPago === "pago" ? "Pago" : "Pend."}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${estadoFactura.color}`}>
                        {estadoFactura.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-800">
                      ${pedido.precioTotal.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleView(pedido)}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                        title="Ver detalles"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Agregar Pedido */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl text-gray-800">Agregar Nuevo Pedido</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePedido} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2 text-gray-700">Cliente *</label>
                  <select
                    value={newPedido.cliente}
                    onChange={(e) =>
                      setNewPedido({ ...newPedido, cliente: e.target.value, productos: [] })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar cliente...</option>
                    <option>Mueblería Del Sur</option>
                    <option>Carpintería López</option>
                    <option>Diseño Interior SA</option>
                    <option>Muebles Modernos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700">
                    Fecha del Pedido *
                  </label>
                  <input
                    type="date"
                    value={newPedido.fechaGeneracion}
                    onChange={(e) =>
                      setNewPedido({ ...newPedido, fechaGeneracion: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="seFactura"
                    checked={newPedido.seFactura}
                    onChange={(e) =>
                      setNewPedido({ ...newPedido, seFactura: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="seFactura" className="text-sm text-gray-700">
                    Se factura este pedido
                  </label>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700">Estado de Pago *</label>
                  <select
                    value={newPedido.estadoPago}
                    onChange={(e) =>
                      setNewPedido({ ...newPedido, estadoPago: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="pago">Pago</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm text-gray-700">
                    Productos ({newPedido.productos.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newPedido.cliente) {
                        alert("Primero debe seleccionar un cliente");
                        return;
                      }
                      setShowAddProductModal(true);
                    }}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    <Plus size={16} />
                    Agregar producto
                  </button>
                </div>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  {newPedido.productos.length > 0 ? (
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs text-gray-500">
                            Producto
                          </th>
                          <th className="px-4 py-2 text-left text-xs text-gray-500">
                            Cantidad
                          </th>
                          <th className="px-4 py-2 text-left text-xs text-gray-500">
                            Precio Unit.
                          </th>
                          <th className="px-4 py-2 text-right text-xs text-gray-500">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {newPedido.productos.map((pp, idx) => {
                          const producto = getProductoById(pp.productoId);
                          if (!producto) return null;
                          return (
                            <tr key={idx}>
                              <td className="px-4 py-2 text-sm">
                                {producto.numeroProducto} - {getProductoDescription(producto)}
                              </td>
                              <td className="px-4 py-2 text-sm">{pp.cantidadSolicitada}</td>
                              <td className="px-4 py-2 text-sm">
                                ${producto.precioUnitario.toLocaleString()}
                              </td>
                              <td className="px-4 py-2 text-sm text-right">
                                ${(producto.precioUnitario * pp.cantidadSolicitada).toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No hay productos agregados
                    </div>
                  )}
                </div>
              </div>

              {newPedido.productos.length > 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Precio Total:</span>
                    <div className="flex items-center gap-1">
                      <DollarSign size={20} className="text-green-600" />
                      <span className="text-xl text-green-700">
                        {newPedido.productos
                          .reduce((sum, pp) => {
                            const producto = getProductoById(pp.productoId);
                            return (
                              sum +
                              (producto ? producto.precioUnitario * pp.cantidadSolicitada : 0)
                            );
                          }, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-700">
                    ⚠️ Debe agregar al menos un producto para generar el pedido
                  </p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={newPedido.productos.length === 0}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    newPedido.productos.length > 0
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Generar Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver/Editar Pedido */}
      {showViewModal && selectedPedido && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl text-gray-800">
                Detalle del Pedido - {selectedPedido.numeroPedido}
              </h3>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setIsEditingPedido(false);
                  setTempNumeroFactura("");
                  setTempPdfFactura(undefined);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Cliente</p>
                  <p className="text-base text-gray-800">{selectedPedido.cliente}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha de Generación</p>
                  <p className="text-base text-gray-800">{selectedPedido.fechaGeneracion}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado de Pago</p>
                  <select
                    value={selectedPedido.estadoPago}
                    onChange={(e) =>
                      setSelectedPedido({
                        ...selectedPedido,
                        estadoPago: e.target.value,
                      })
                    }
                    className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="pago">Pago</option>
                  </select>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Precio Total</p>
                  <div className="flex items-center gap-1">
                    <DollarSign size={16} className="text-green-600" />
                    <p className="text-lg text-green-700">
                      {selectedPedido.precioTotal.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm text-gray-700">Productos del Pedido</h4>
                  {isEditingPedido && (
                    <button
                      onClick={() => setShowAddProductModal(true)}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                    >
                      <Plus size={16} />
                      Agregar producto
                    </button>
                  )}
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs text-gray-500">Producto</th>
                        <th className="px-4 py-2 text-left text-xs text-gray-500">Cantidad</th>
                        <th className="px-4 py-2 text-left text-xs text-gray-500">
                          Precio Unit.
                        </th>
                        <th className="px-4 py-2 text-right text-xs text-gray-500">
                          Subtotal
                        </th>
                        {isEditingPedido && (
                          <th className="px-4 py-2 text-right text-xs text-gray-500">
                            Acciones
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedPedido.productos.map((pp) => {
                        const producto = getProductoById(pp.productoId);
                        if (!producto) return null;
                        return (
                          <tr key={pp.productoId}>
                            <td className="px-4 py-2 text-sm">
                              {producto.numeroProducto} - {getProductoDescription(producto)}
                            </td>
                            <td className="px-4 py-2 text-sm">{pp.cantidadSolicitada}</td>
                            <td className="px-4 py-2 text-sm">
                              ${producto.precioUnitario.toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-sm text-right">
                              ${(producto.precioUnitario * pp.cantidadSolicitada).toLocaleString()}
                            </td>
                            {isEditingPedido && (
                              <td className="px-4 py-2 text-right">
                                <button
                                  onClick={() => handleRemoveProduct(pp.productoId)}
                                  className="p-1 hover:bg-red-50 rounded transition-colors text-red-600"
                                  title="Eliminar producto"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sección de Facturación */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-sm text-gray-700 mb-4">Información de Facturación</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-500">¿Se factura?</p>
                    <span
                      className={`px-3 py-1 rounded-full text-xs ${
                        selectedPedido.seFactura
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {selectedPedido.seFactura ? "Sí" : "No"}
                    </span>
                  </div>

                  {selectedPedido.seFactura && (
                    <>
                      {isEditingPedido ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                          <div>
                            <label className="block text-sm mb-2 text-gray-700">
                              Número de Factura *
                            </label>
                            <input
                              type="text"
                              placeholder="Ej: FC-001"
                              value={selectedPedido.numeroFactura || ""}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onChange={(e) => {
                                setSelectedPedido({
                                  ...selectedPedido,
                                  numeroFactura: e.target.value,
                                });
                              }}
                            />
                          </div>

                          <div>
                            <label className="block text-sm mb-2 text-gray-700">
                              PDF de Factura (Opcional){" "}
                              {selectedPedido.pdfFactura && "- Cambiar archivo"}
                            </label>
                            <input
                              type="file"
                              accept="application/pdf"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const url = URL.createObjectURL(file);
                                  setSelectedPedido({
                                    ...selectedPedido,
                                    pdfFactura: url,
                                  });
                                }
                              }}
                            />
                            {selectedPedido.pdfFactura && (
                              <p className="text-xs text-gray-600 mt-1">
                                PDF cargado previamente. Seleccione un nuevo archivo para
                                reemplazarlo.
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          {selectedPedido.numeroFactura ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                              <div>
                                <p className="text-sm text-blue-700">Número de Factura</p>
                                <p className="text-base text-blue-900 font-medium">
                                  {selectedPedido.numeroFactura}
                                </p>
                              </div>

                              {selectedPedido.pdfFactura && (
                                <div className="flex gap-2">
                                  <a
                                    href={selectedPedido.pdfFactura}
                                    download
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                  >
                                    <Download size={16} />
                                    Descargar Factura PDF
                                  </a>
                                  <button
                                    onClick={() => {
                                      if (confirm("¿Está seguro que desea eliminar el PDF?")) {
                                        setSelectedPedido({
                                          ...selectedPedido,
                                          pdfFactura: undefined,
                                        });
                                        handleSavePedidoChanges();
                                      }
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                                  >
                                    <Trash2 size={16} />
                                    Eliminar PDF
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
                              <p className="text-sm text-yellow-700 mb-2">
                                Este pedido requiere facturación pero aún no tiene factura
                                asociada.
                              </p>

                              <div className="space-y-3">
                                <div>
                                  <label className="block text-sm mb-2 text-gray-700">
                                    Número de Factura *
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Ej: FC-001"
                                    value={tempNumeroFactura}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    onChange={(e) => setTempNumeroFactura(e.target.value)}
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm mb-2 text-gray-700">
                                    PDF de Factura (Opcional)
                                  </label>
                                  <input
                                    type="file"
                                    accept="application/pdf"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const url = URL.createObjectURL(file);
                                        setTempPdfFactura(url);
                                      }
                                    }}
                                  />
                                </div>

                                <button
                                  onClick={handleGuardarFactura}
                                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                >
                                  Guardar Información de Factura
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-200">
                {isEditingPedido ? (
                  <>
                    <button
                      onClick={() => {
                        const pedidoOriginal = pedidos.find((p) => p.id === selectedPedido?.id);
                        if (pedidoOriginal) {
                          setSelectedPedido({ ...pedidoOriginal });
                        }
                        setTempNumeroFactura("");
                        setTempPdfFactura(undefined);
                        setIsEditingPedido(false);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSavePedidoChanges}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Guardar Cambios
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleDownloadPDF}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download size={16} />
                      Descargar PDF
                    </button>
                    <button
                      onClick={() => {
                        setTempNumeroFactura("");
                        setTempPdfFactura(undefined);
                        setIsEditingPedido(true);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit size={16} />
                      Editar Pedido
                    </button>
                    <button
                      onClick={handleDeletePedido}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} />
                      Eliminar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar Producto del Cliente */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl text-gray-800">Seleccionar Producto del Cliente</h3>
              <button
                onClick={() => {
                  setShowAddProductModal(false);
                  setSelectedProductosIds([]);
                  setCantidadesPorProducto({});
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {(() => {
                const clienteActual =
                  isEditingPedido && selectedPedido
                    ? selectedPedido.cliente
                    : newPedido.cliente;

                const currentPedidoId =
                  isEditingPedido && selectedPedido ? selectedPedido.id : undefined;
                const productosDisponibles = getProductosDisponibles(
                  clienteActual,
                  currentPedidoId
                );

                const handleToggleProducto = (productoId) => {
                  if (selectedProductosIds.includes(productoId)) {
                    setSelectedProductosIds(
                      selectedProductosIds.filter((id) => id !== productoId)
                    );
                    const newCantidades = { ...cantidadesPorProducto };
                    delete newCantidades[productoId];
                    setCantidadesPorProducto(newCantidades);
                  } else {
                    setSelectedProductosIds([...selectedProductosIds, productoId]);
                    setCantidadesPorProducto({ ...cantidadesPorProducto, [productoId]: 1 });
                  }
                };

                const handleCantidadChange = (productoId, cantidad) => {
                  setCantidadesPorProducto({
                    ...cantidadesPorProducto,
                    [productoId]: cantidad,
                  });
                };

                return (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Package size={20} className="text-blue-600" />
                        <h4 className="text-sm text-gray-700">
                          Productos disponibles de {clienteActual}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-600">
                        {productosDisponibles.length} producto(s) disponible(s) para agregar
                      </p>
                      {selectedProductosIds.length > 0 && (
                        <p className="text-xs text-blue-600 mt-1">
                          {selectedProductosIds.length} producto(s) seleccionado(s)
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm mb-2 text-gray-700">
                        Seleccionar Productos (puede seleccionar múltiples)
                      </label>
                      {productosDisponibles.length > 0 ? (
                        <div className="border border-gray-300 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                          {productosDisponibles.map((producto) => {
                            const isSelected = selectedProductosIds.includes(producto.id);
                            return (
                              <div
                                key={producto.id}
                                className={`p-3 border-b border-gray-200 last:border-0 ${
                                  isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                                } transition-colors`}
                              >
                                <label className="flex items-start cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleProducto(producto.id)}
                                    className="mt-1 mr-3"
                                  />
                                  <div className="flex-1">
                                    <p className="text-sm text-gray-800">
                                      {producto.numeroProducto} -{" "}
                                      {getProductoDescription(producto)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Precio: ${producto.precioUnitario.toLocaleString()}
                                    </p>
                                  </div>
                                </label>
                                {isSelected && (
                                  <div className="mt-2 ml-6">
                                    {/* Campo de cantidad opcional */}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="border border-gray-300 rounded-lg p-4 text-center text-gray-500 text-sm">
                          No hay productos disponibles para agregar
                          <p className="text-xs mt-1">
                            (Todos los productos de este cliente ya están asignados a pedidos)
                          </p>
                        </div>
                      )}
                    </div>

                    {selectedProductosIds.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Subtotal:</span>
                          <div className="flex items-center gap-1">
                            <DollarSign size={20} className="text-green-600" />
                            <span className="text-xl text-green-700">
                              {selectedProductosIds
                                .reduce((sum, productoId) => {
                                  const producto = getProductoById(productoId);
                                  const cantidad = cantidadesPorProducto[productoId] || 1;
                                  return (
                                    sum + (producto ? producto.precioUnitario * cantidad : 0)
                                  );
                                }, 0)
                                .toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setShowAddProductModal(false);
                    setSelectedProductosIds([]);
                    setCantidadesPorProducto({});
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddProductToPedido}
                  disabled={selectedProductosIds.length === 0}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    selectedProductosIds.length > 0
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Agregar{" "}
                  {selectedProductosIds.length > 0
                    ? `${selectedProductosIds.length} Producto(s)`
                    : "Producto"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
