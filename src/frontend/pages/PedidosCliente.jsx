import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Eye,
  X,
  DollarSign,
  Package,
  Edit,
  Trash2,
  Download,
  FileText,
} from "lucide-react";

const API_URL = "http://localhost:4000/api";

const ESTADOS_PAGO = ["pendiente", "parcial", "pagado"];
const ESTADOS_FACTURACION = ["no_se_factura", "se_factura"];

function obtenerFechaActualISO() {
  const hoy = new Date();
  const offset = hoy.getTimezoneOffset();
  const fechaLocal = new Date(hoy.getTime() - offset * 60000);
  return fechaLocal.toISOString().split("T")[0];
}

function sumarDiasISO(fechaISO, dias) {
  const fechaBase = fechaISO || obtenerFechaActualISO();
  const fecha = new Date(`${fechaBase}T00:00:00`);
  fecha.setDate(fecha.getDate() + dias);
  return fecha.toISOString().split("T")[0];
}

function obtenerRangoFechas(fechaDesde, fechaHasta) {
  const fechaActual = obtenerFechaActualISO();

  if (!fechaDesde && !fechaHasta) {
    return {
      desde: "",
      hasta: "",
    };
  }

  if (fechaDesde && fechaHasta) {
    return {
      desde: fechaDesde <= fechaHasta ? fechaDesde : fechaHasta,
      hasta: fechaDesde <= fechaHasta ? fechaHasta : fechaDesde,
    };
  }

  if (fechaDesde && !fechaHasta) {
    return {
      desde: fechaDesde,
      hasta: fechaActual,
    };
  }

  if (!fechaDesde && fechaHasta) {
    return {
      desde: "",
      hasta: fechaHasta,
    };
  }

  return {
    desde: "",
    hasta: "",
  };
}

function clonarPedido(pedido) {
  return JSON.parse(JSON.stringify(pedido));
}

function formatearPrecio(valor) {
  return Number(valor || 0).toLocaleString("es-AR");
}

function formatearFecha(fecha) {
  if (!fecha) return "-";

  const fechaLimpia = fecha.includes("T") ? fecha.split("T")[0] : fecha;
  const [anio, mes, dia] = fechaLimpia.split("-");

  return `${dia}/${mes}/${anio}`;
}

function formatearEstado(texto) {
  const estados = {
    pendiente: "Pendiente",
    parcial: "Parcial",
    pagado: "Pagado",
    no_se_factura: "No se factura",
    se_factura: "Se factura",
  };

  return estados[texto] || texto || "-";
}

function getNombreCliente(pedido) {
  if (pedido.razon_social) return pedido.razon_social;
  if (pedido.Razon_Social) return pedido.Razon_Social;

  const nombre = pedido.nombre || pedido.Nombre || "";
  const apellido = pedido.apellido || pedido.Apellido || "";

  return `${nombre} ${apellido}`.trim();
}

function getDescripcionProducto(producto) {
  return [
    producto.modelo || producto.Modelo,
    producto.tela || producto.Tela,
    producto.color_lustre || producto.Color_Lustre,
  ]
    .filter(Boolean)
    .join(" - ");
}

function getSubtotalProducto(producto) {
  const precio = producto.precio ?? producto.Precio ?? 0;
  const cantidad = producto.cantidad ?? producto.Cantidad ?? 1;

  return Number(precio || 0) * Number(cantidad || 1);
}

function calcularTotalPedido(productos = []) {
  return productos.reduce((total, producto) => {
    return total + getSubtotalProducto(producto);
  }, 0);
}

function getEstadoPagoInfo(estado) {
  if (estado === "pagado") {
    return {
      label: "Pago",
      color: "bg-green-100 text-green-700",
    };
  }

  if (estado === "parcial") {
    return {
      label: "Parcial",
      color: "bg-yellow-100 text-yellow-700",
    };
  }

  return {
    label: "Pend.",
    color: "bg-red-100 text-red-700",
  };
}

function getEstadoFacturaInfo(pedido) {
  const estado = pedido.estado_facturacion || pedido.Estado_Facturacion;
  if (estado === "se_factura") {
    if (pedido.pdf_factura_url || pedido.pdf_factura_file || pedido.pdf_factura_nombre) {
      return {
        label: "Facturado",
        color: "bg-green-100 text-green-700",
      };
    }
    return {
      label: "Pendiente de facturación",
      color: "bg-yellow-100 text-yellow-700",
    };
  }

  return {
    label: "No se factura",
    color: "bg-gray-100 text-gray-700",
  };
}

function normalizarPedido(pedido) {
  return {
    id_pedido: pedido.id_pedido ?? pedido.Id_Pedido,
    fecha_generacion: pedido.fecha_generacion ?? pedido.Fecha_Generacion,
    vencimiento: pedido.vencimiento ?? pedido.Vencimiento,
    observaciones: pedido.observaciones ?? pedido.Observaciones,
    precio_total: pedido.precio_total ?? pedido.Precio_Total ?? 0,
    estado_facturacion:
      pedido.estado_facturacion ?? pedido.Estado_Facturacion ?? "no_se_factura",
    nro_factura: pedido.nro_factura ?? pedido.Nro_Factura ?? null,
    pdf_factura_url: pedido.pdf_factura_url ?? pedido.Pdf_Factura_Url ?? null,
    pdf_factura_nombre:
      pedido.pdf_factura_nombre ?? pedido.Pdf_Factura_Nombre ?? null,
    monto_adeudado: pedido.monto_adeudado ?? pedido.Monto_Adeudado ?? 0,
    estado_pago: pedido.estado_pago ?? pedido.Estado_Pago ?? "pendiente",
    id_cliente: pedido.id_cliente ?? pedido.Id_Cliente,
    nombre: pedido.nombre ?? pedido.Nombre,
    apellido: pedido.apellido ?? pedido.Apellido,
    razon_social: pedido.razon_social ?? pedido.Razon_Social,
    productos: Array.isArray(pedido.productos)
      ? pedido.productos.map(normalizarProducto)
      : [],
  };
}

function normalizarProducto(producto) {
  return {
    id_producto: producto.id_producto ?? producto.Id_Producto,
    modelo: producto.modelo ?? producto.Modelo,
    tela: producto.tela ?? producto.Tela,
    color_lustre: producto.color_lustre ?? producto.Color_Lustre,
    estado: producto.estado ?? producto.Estado,
    cantidad: producto.cantidad ?? producto.Cantidad ?? 1,
    precio: producto.precio ?? producto.Precio ?? 0,
    id_cliente: producto.id_cliente ?? producto.Id_Cliente,
  };
}

export function PedidosCliente({ tipoVista, setTipoVista }) {
  const fechaActual = obtenerFechaActualISO();

  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);

  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [productosDisponiblesEdicion, setProductosDisponiblesEdicion] =
    useState([]);
  const [productoEdicionSeleccionado, setProductoEdicionSeleccionado] =
    useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const [cargando, setCargando] = useState(false);
  const [mensajeError, setMensajeError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");

  const [mensajeErrorModal, setMensajeErrorModal] = useState("");
  const [mensajeExitoModal, setMensajeExitoModal] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [selectedPedido, setSelectedPedido] = useState(null);
  const [pedidoOriginal, setPedidoOriginal] = useState(null);
  const [isEditingPedido, setIsEditingPedido] = useState(false);

  const [newPedido, setNewPedido] = useState({
    Id_Cliente: "",
    Fecha_Generacion: fechaActual,
    Vencimiento: sumarDiasISO(fechaActual, 30),
    Observaciones: "",
    Estado_Facturacion: "no_se_factura",
    Nro_Factura: "",
    Pdf_Factura_File: null,
    Pdf_Factura_Nombre: "",
    Estado_Pago: "pendiente",
    productos: [],
  });

  const cargarPedidos = async () => {
    try {
      setCargando(true);
      setMensajeError("");

      const params = new URLSearchParams();

      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      const rangoFechas = obtenerRangoFechas(fechaDesde, fechaHasta);

      if (rangoFechas.desde) {
        params.append("fechaDesde", rangoFechas.desde);
      }

      if (rangoFechas.hasta) {
        params.append("fechaHasta", rangoFechas.hasta);
      }

      const res = await fetch(`${API_URL}/pedidos?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al obtener pedidos");
      }

      setPedidos(data.map(normalizarPedido));
    } catch (error) {
      setMensajeError(error.message);
    } finally {
      setCargando(false);
    }
  };

  const cargarClientes = async () => {
    try {
      const res = await fetch(`${API_URL}/clientes`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al obtener clientes");
      }

      const clientesActivos = data.filter(
        (cliente) => cliente.estado !== "bloqueado"
      );

      setClientes(clientesActivos);
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const cargarProductosDisponibles = async (idCliente) => {
    if (!idCliente) {
      setProductosDisponibles([]);
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/pedidos/productos-disponibles/${idCliente}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al obtener productos disponibles");
      }

      setProductosDisponibles(data.map(normalizarProducto));
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const cargarProductosDisponiblesEdicion = async (pedido) => {
    if (!pedido) return;

    try {
      const res = await fetch(
        `${API_URL}/pedidos/productos-disponibles/${pedido.id_cliente}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al obtener productos disponibles");
      }

      const productosActuales = new Set(
        pedido.productos.map((producto) => Number(producto.id_producto))
      );

      const disponibles = data
        .map(normalizarProducto)
        .filter(
          (producto) => !productosActuales.has(Number(producto.id_producto))
        );

      setProductosDisponiblesEdicion(disponibles);
    } catch (error) {
      setMensajeErrorModal(error.message);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      cargarPedidos();
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchTerm, fechaDesde, fechaHasta]);

  useEffect(() => {
    cargarClientes();
  }, []);

  const abrirModalAgregar = () => {
    const hoy = obtenerFechaActualISO();

    setMensajeError("");
    setMensajeExito("");
    setProductosDisponibles([]);

    setNewPedido({
      Id_Cliente: "",
      Fecha_Generacion: hoy,
      Vencimiento: sumarDiasISO(hoy, 30),
      Observaciones: "",
      Estado_Facturacion: "no_se_factura",
      Nro_Factura: "",
      Pdf_Factura_File: null,
      Pdf_Factura_Nombre: "",
      Estado_Pago: "pendiente",
      productos: [],
    });

    setShowAddModal(true);
  };

  const handleSeleccionarCliente = async (idCliente) => {
    setNewPedido({
      ...newPedido,
      Id_Cliente: idCliente,
      productos: [],
    });

    await cargarProductosDisponibles(idCliente);
  };

  const handleCambiarFechaGeneracion = (fecha) => {
    const fechaFinal = fecha || obtenerFechaActualISO();

    setNewPedido({
      ...newPedido,
      Fecha_Generacion: fechaFinal,
      Vencimiento: newPedido.Vencimiento || sumarDiasISO(fechaFinal, 30),
    });
  };

  const actualizarFacturacionNuevoPedido = (estadoFacturacion) => {
    setNewPedido({
      ...newPedido,
      Estado_Facturacion: estadoFacturacion,
      Nro_Factura:
        estadoFacturacion === "no_se_factura" ? "" : newPedido.Nro_Factura,
      Pdf_Factura_File:
        estadoFacturacion === "no_se_factura"
          ? null
          : newPedido.Pdf_Factura_File,
      Pdf_Factura_Nombre:
        estadoFacturacion === "no_se_factura"
          ? ""
          : newPedido.Pdf_Factura_Nombre,
    });
  };

  const actualizarFacturacionPedidoSeleccionado = (estadoFacturacion) => {
    if (!selectedPedido) return;

    setSelectedPedido({
      ...selectedPedido,
      estado_facturacion: estadoFacturacion,
      nro_factura:
        estadoFacturacion === "no_se_factura"
          ? ""
          : selectedPedido.nro_factura || "",
      pdf_factura_url:
        estadoFacturacion === "no_se_factura"
          ? null
          : selectedPedido.pdf_factura_url,
      pdf_factura_nombre:
        estadoFacturacion === "no_se_factura"
          ? null
          : selectedPedido.pdf_factura_nombre,
      pdf_factura_file:
        estadoFacturacion === "no_se_factura"
          ? null
          : selectedPedido.pdf_factura_file || null,
      eliminar_pdf_factura:
        estadoFacturacion === "no_se_factura"
          ? true
          : selectedPedido.eliminar_pdf_factura || false,
    });

    setMensajeErrorModal("");
    setMensajeExitoModal("");
  };

  const handleArchivoFacturaNuevo = (file) => {
    if (!file) return;

    setNewPedido({
      ...newPedido,
      Pdf_Factura_File: file,
      Pdf_Factura_Nombre: file.name,
    });
  };

  const handleArchivoFacturaSeleccionado = (file) => {
    if (!file || !selectedPedido) return;

    setSelectedPedido({
      ...selectedPedido,
      pdf_factura_file: file,
      pdf_factura_nombre: file.name,
      eliminar_pdf_factura: false,
    });

    setMensajeErrorModal("");
    setMensajeExitoModal(
      "PDF de factura actualizado. Guardá los cambios para confirmar."
    );
  };

  const eliminarPdfFacturaPedido = () => {
    if (!selectedPedido) return;

    setSelectedPedido({
      ...selectedPedido,
      pdf_factura_url: null,
      pdf_factura_nombre: null,
      pdf_factura_file: null,
      eliminar_pdf_factura: true,
    });

    setMensajeErrorModal("");
    setMensajeExitoModal(
      "PDF de factura eliminado. Guardá los cambios para confirmar."
    );
  };

  const toggleProducto = (idProducto) => {
    const existe = newPedido.productos.includes(idProducto);

    setNewPedido({
      ...newPedido,
      productos: existe
        ? newPedido.productos.filter((id) => id !== idProducto)
        : [...newPedido.productos, idProducto],
    });
  };

  const calcularTotalNuevoPedido = () => {
    let subtotal = productosDisponibles
      .filter((producto) => newPedido.productos.includes(producto.id_producto))
      .reduce((total, producto) => total + getSubtotalProducto(producto), 0);

    if (newPedido.Estado_Facturacion === "se_factura") {
      subtotal = subtotal * 1.21;
    }
    
    return subtotal;
  };

  const subirFacturaPedido = async (idPedido, datosFactura) => {
    const formData = new FormData();

    formData.append("Estado_Facturacion", datosFactura.estadoFacturacion);
    formData.append("Nro_Factura", datosFactura.nroFactura || "");

    if (datosFactura.archivoPdf) {
      formData.append("Pdf_Factura", datosFactura.archivoPdf);
    }

    const res = await fetch(`${API_URL}/pedidos/${idPedido}/factura`, {
      method: "PUT",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Error al guardar la factura");
    }

    return data;
  };

  const eliminarPdfFacturaBackend = async (idPedido) => {
    const res = await fetch(`${API_URL}/pedidos/${idPedido}/factura/pdf`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Error al eliminar el PDF de factura");
    }

    return data;
  };

  const handleCreatePedido = async (e) => {
    e.preventDefault();

    if (!newPedido.Id_Cliente) {
      setMensajeError("Debe seleccionar un cliente.");
      return;
    }

    if (newPedido.productos.length === 0) {
      setMensajeError("Debe seleccionar al menos un producto.");
      return;
    }

    if (
      newPedido.Estado_Facturacion === "facturado" &&
      !newPedido.Nro_Factura.trim()
    ) {
      setMensajeError(
        "Debe ingresar el número de factura para marcarlo como facturado."
      );
      return;
    }

    try {
      setMensajeError("");
      setMensajeExito("");

      const body = {
        Id_Cliente: Number(newPedido.Id_Cliente),
        Fecha_Generacion: newPedido.Fecha_Generacion || obtenerFechaActualISO(),
        Vencimiento:
          newPedido.Vencimiento ||
          sumarDiasISO(
            newPedido.Fecha_Generacion || obtenerFechaActualISO(),
            30
          ),
        Observaciones: newPedido.Observaciones || null,
        Estado_Facturacion: newPedido.Estado_Facturacion,
        Nro_Factura:
          newPedido.Estado_Facturacion === "no_se_factura"
            ? null
            : newPedido.Nro_Factura || null,
        Estado_Pago: newPedido.Estado_Pago,
        productos: newPedido.productos,
      };

      const res = await fetch(`${API_URL}/pedidos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al crear pedido");
      }

      const idPedidoCreado =
        data.pedido?.id_pedido || data.pedido?.Id_Pedido || data.id_pedido;

      if (
        idPedidoCreado &&
        newPedido.Estado_Facturacion !== "no_se_factura" &&
        (newPedido.Nro_Factura || newPedido.Pdf_Factura_File)
      ) {
        await subirFacturaPedido(idPedidoCreado, {
          estadoFacturacion: newPedido.Estado_Facturacion,
          nroFactura: newPedido.Nro_Factura,
          archivoPdf: newPedido.Pdf_Factura_File,
        });
      }

      setMensajeExito("Pedido generado correctamente.");
      setShowAddModal(false);
      await cargarPedidos();
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const handleView = async (pedido) => {
    const copia = clonarPedido(pedido);

    setSelectedPedido(copia);
    setPedidoOriginal(clonarPedido(pedido));
    setIsEditingPedido(false);
    setProductosDisponiblesEdicion([]);
    setProductoEdicionSeleccionado("");
    setMensajeErrorModal("");
    setMensajeExitoModal("");
    setShowViewModal(true);

    try {
      const res = await fetch(`${API_URL}/pedidos/${pedido.id_pedido}`);
      if (res.ok) {
        const datosCompletos = await res.json();
        setSelectedPedido((prev) =>
          prev && Number(prev.id_pedido) === Number(pedido.id_pedido)
            ? { ...prev, ...datosCompletos }
            : prev
        );
      }
    } catch (err) {
      console.error("Error al obtener los detalles del pedido:", err);
    }
  };

  const abrirEdicionPedido = async () => {
    setMensajeErrorModal("");
    setMensajeExitoModal("");
    setIsEditingPedido(true);
    await cargarProductosDisponiblesEdicion(selectedPedido);
  };

  const agregarProductoAlPedido = async () => {
    if (!productoEdicionSeleccionado || !selectedPedido) return;

    try {
      setMensajeErrorModal("");

      const producto = productosDisponiblesEdicion.find(
        (p) => Number(p.id_producto) === Number(productoEdicionSeleccionado)
      );

      if (!producto) return;

      const totalAnterior = Number(selectedPedido.precio_total || 0);
      const productosActualizados = [...selectedPedido.productos, producto];
      let totalActualizado = calcularTotalPedido(productosActualizados);
      if (selectedPedido.estado_facturacion === "se_factura") {
        totalActualizado = totalActualizado * 1.21;
      }

      const estabaPagado = selectedPedido.estado_pago === "pagado";
      const nuevoEstadoPago = estabaPagado
        ? "parcial"
        : selectedPedido.estado_pago;

      const nuevoMontoAdeudado = estabaPagado
        ? Math.max(totalActualizado - totalAnterior, 0)
        : selectedPedido.estado_pago === "pendiente"
          ? totalActualizado
          : selectedPedido.monto_adeudado;

      const pedidoActualizado = {
        ...selectedPedido,
        productos: productosActualizados,
        precio_total: totalActualizado,
        estado_pago: nuevoEstadoPago,
        monto_adeudado: nuevoMontoAdeudado,
      };

      setSelectedPedido(pedidoActualizado);
      setProductoEdicionSeleccionado("");
      await cargarProductosDisponiblesEdicion(pedidoActualizado);

      setMensajeExitoModal(
        estabaPagado
          ? "Producto agregado. Como el pedido estaba pagado y el total cambió, el estado de pago pasó a parcial."
          : "Producto agregado al pedido."
      );
    } catch (error) {
      setMensajeErrorModal(error.message);
    }
  };

  const quitarProductoDelPedido = async (idProducto) => {
    if (!selectedPedido) return;

    if (selectedPedido.productos.length <= 1) {
      setMensajeErrorModal("El pedido debe tener al menos un producto.");
      return;
    }

    const productosActualizados = selectedPedido.productos.filter(
      (producto) => Number(producto.id_producto) !== Number(idProducto)
    );

    let totalActualizado = calcularTotalPedido(productosActualizados);
    if (selectedPedido.estado_facturacion === "se_factura") {
      totalActualizado = totalActualizado * 1.21;
    }

    const pedidoActualizado = {
      ...selectedPedido,
      productos: productosActualizados,
      precio_total: totalActualizado,
      monto_adeudado:
        selectedPedido.estado_pago === "pagado" ? 0 : totalActualizado,
    };

    setSelectedPedido(pedidoActualizado);
    await cargarProductosDisponiblesEdicion(pedidoActualizado);

    setMensajeErrorModal("");
    setMensajeExitoModal("Producto quitado del pedido.");
  };

  const guardarCambiosPedido = async () => {
    if (!selectedPedido) return;

    if (selectedPedido.productos.length === 0) {
      setMensajeErrorModal("El pedido debe tener al menos un producto.");
      return;
    }

    if (
      selectedPedido.estado_facturacion === "facturado" &&
      !selectedPedido.nro_factura?.trim()
    ) {
      setMensajeErrorModal(
        "Debe ingresar el número de factura para marcarlo como facturado."
      );
      return;
    }

    try {
      setMensajeErrorModal("");

      let totalActualizado = calcularTotalPedido(selectedPedido.productos);
      if (selectedPedido.estado_facturacion === "se_factura") {
        totalActualizado = totalActualizado * 1.21;
      }

      const montoAdeudadoActualizado =
        selectedPedido.estado_pago === "pagado"
          ? 0
          : selectedPedido.estado_pago === "parcial" &&
              selectedPedido.monto_adeudado !== null &&
              selectedPedido.monto_adeudado !== undefined
            ? selectedPedido.monto_adeudado
            : totalActualizado;

      const pedidoActualizado = {
        ...selectedPedido,
        precio_total: totalActualizado,
        monto_adeudado: montoAdeudadoActualizado,
        nro_factura:
          selectedPedido.estado_facturacion === "no_se_factura"
            ? null
            : selectedPedido.nro_factura || null,
        pdf_factura_url:
          selectedPedido.estado_facturacion === "no_se_factura"
            ? null
            : selectedPedido.pdf_factura_url || null,
        pdf_factura_nombre:
          selectedPedido.estado_facturacion === "no_se_factura"
            ? null
            : selectedPedido.pdf_factura_nombre || null,
      };

      const body = {
        Vencimiento: pedidoActualizado.vencimiento,
        Observaciones: pedidoActualizado.observaciones || null,
        Estado_Pago: pedidoActualizado.estado_pago,
        Estado_Facturacion: pedidoActualizado.estado_facturacion,
        Nro_Factura: pedidoActualizado.nro_factura,
        Monto_Adeudado: pedidoActualizado.monto_adeudado,
        productos: pedidoActualizado.productos.map(
          (producto) => producto.id_producto
        ),
      };

      const res = await fetch(`${API_URL}/pedidos/${selectedPedido.id_pedido}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al actualizar pedido");
      }

      if (pedidoActualizado.estado_facturacion === "no_se_factura") {
        pedidoActualizado.pdf_factura_url = null;
        pedidoActualizado.pdf_factura_nombre = null;
      } else if (selectedPedido.eliminar_pdf_factura) {
        await eliminarPdfFacturaBackend(selectedPedido.id_pedido);
        pedidoActualizado.pdf_factura_url = null;
        pedidoActualizado.pdf_factura_nombre = null;
      } else if (selectedPedido.pdf_factura_file || selectedPedido.nro_factura) {
        await subirFacturaPedido(selectedPedido.id_pedido, {
          estadoFacturacion: selectedPedido.estado_facturacion,
          nroFactura: selectedPedido.nro_factura || "",
          archivoPdf: selectedPedido.pdf_factura_file || null,
        });
      }

      setSelectedPedido(pedidoActualizado);
      setPedidoOriginal(clonarPedido(pedidoActualizado));
      setIsEditingPedido(false);
      setProductosDisponiblesEdicion([]);
      setProductoEdicionSeleccionado("");
      setMensajeErrorModal("");
      setMensajeExitoModal("Pedido actualizado correctamente.");

      await cargarPedidos();
    } catch (error) {
      setMensajeErrorModal(error.message);
    }
  };

  const cancelarEdicionPedido = () => {
    setSelectedPedido(
      pedidoOriginal ? clonarPedido(pedidoOriginal) : selectedPedido
    );
    setIsEditingPedido(false);
    setMensajeErrorModal("");
    setMensajeExitoModal("");
    setProductosDisponiblesEdicion([]);
    setProductoEdicionSeleccionado("");
  };

  const cerrarModalDetalle = () => {
    setShowViewModal(false);
    setIsEditingPedido(false);
    setMensajeErrorModal("");
    setMensajeExitoModal("");
  };

  const descargarFactura = (pedido) => {
    if (!pedido?.pdf_factura_url) return;

    const link = document.createElement("a");
    link.href = pedido.pdf_factura_url;
    link.download =
      pedido.pdf_factura_nombre ||
      `factura_PED-${String(pedido.id_pedido).padStart(3, "0")}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const descargarPdfPedido = (pedido) => {
    if (!pedido) return;

    const productosHTML = pedido.productos
      .map(
        (producto) => `
          <tr>
            <td>PR-${String(producto.id_producto).padStart(3, "0")} - ${getDescripcionProducto(producto)}</td>
            <td>${producto.cantidad}</td>
            <td>$${formatearPrecio(producto.precio)}</td>
            <td>$${formatearPrecio(getSubtotalProducto(producto))}</td>
          </tr>
        `
      )
      .join("");

    const ventana = window.open("", "_blank");

    if (!ventana) {
      setMensajeErrorModal("El navegador bloqueó la ventana emergente del PDF.");
      return;
    }

    ventana.document.write(`
      <html>
        <head>
          <title>Pedido PED-${String(pedido.id_pedido).padStart(3, "0")}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #111827; }
            h1 { margin-bottom: 4px; color: #7f1d1d; }
            p { margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 24px; }
            th, td { border: 1px solid #d1d5db; padding: 10px; font-size: 13px; }
            th { background: #f3f4f6; text-align: left; }
            .total { margin-top: 20px; font-size: 18px; font-weight: bold; text-align: right; }
          </style>
        </head>
        <body>
          <h1>Pedido PED-${String(pedido.id_pedido).padStart(3, "0")}</h1>
          <p><strong>Cliente:</strong> ${getNombreCliente(pedido)}</p>
          <p><strong>Fecha de generación:</strong> ${formatearFecha(pedido.fecha_generacion)}</p>
          <p><strong>Vencimiento:</strong> ${formatearFecha(pedido.vencimiento)}</p>
          <p><strong>Estado de pago:</strong> ${formatearEstado(pedido.estado_pago)}</p>
          <p><strong>Factura:</strong> ${getEstadoFacturaInfo(pedido).label}</p>

          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio Unit.</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${productosHTML}
            </tbody>
          </table>

          <div class="total">Total: $${formatearPrecio(pedido.precio_total)}</div>
        </body>
      </html>
    `);

    ventana.document.close();
    ventana.focus();
    ventana.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Ventas (Pedidos de Clientes)</h2>
          <p className="text-gray-500 text-sm mt-1">
            {pedidos.length} pedidos registrados
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setTipoVista && setTipoVista("cliente")}
              className="flex items-center gap-2 px-4 py-2 rounded-md transition-colors bg-white text-red-700 shadow-sm"
            >
              Clientes
            </button>
            <button
              onClick={() => setTipoVista && setTipoVista("proveedor")}
              className="flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-gray-600 hover:text-gray-800"
            >
              Proveedores
            </button>
          </div>
          
          <button
            onClick={abrirModalAgregar}
            className="flex items-center gap-2 bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors"
          >
            <Plus size={20} />
            Nuevo pedido
          </button>
        </div>
      </div>

      {mensajeError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {mensajeError}
        </div>
      )}

      {mensajeExito && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {mensajeExito}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Buscar por número de pedido o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700 bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            <label className="text-sm text-gray-700 whitespace-nowrap">
              Desde:
            </label>

            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-full lg:w-40 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700 bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            <label className="text-sm text-gray-700 whitespace-nowrap">
              Hasta:
            </label>

            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-full lg:w-40 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700 bg-white"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Nº Pedido
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Cliente
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Fecha
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Pago
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Factura
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {cargando ? (
                <tr>
                  <td colSpan="7" className="px-4 py-6 text-center text-gray-500">
                    Cargando pedidos...
                  </td>
                </tr>
              ) : pedidos.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-10 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Package size={36} className="text-gray-300" />
                      <p className="text-gray-600 font-medium">
                        No hay pedidos para mostrar
                      </p>
                      <p className="text-sm text-gray-400">
                        Probá modificar los filtros o agregá un nuevo pedido.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pedidos.map((pedido) => {
                  const pagoInfo = getEstadoPagoInfo(pedido.estado_pago);
                  const facturaInfo = getEstadoFacturaInfo(pedido);

                  return (
                    <tr
                      key={pedido.id_pedido}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-800">
                        PED-{String(pedido.id_pedido).padStart(3, "0")}
                      </td>

                      <td className="px-3 py-3 text-sm text-gray-800">
                        {getNombreCliente(pedido)}
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                        {formatearFecha(pedido.fecha_generacion)}
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${pagoInfo.color}`}
                        >
                          {pagoInfo.label}
                        </span>
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${facturaInfo.color}`}
                        >
                          {facturaInfo.label}
                        </span>
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-800">
                        ${formatearPrecio(pedido.precio_total)}
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Agregar Nuevo Pedido
                </h3>

                <p className="text-sm text-gray-500">
                  Seleccioná un cliente y los productos ya cargados para ese cliente.
                </p>
              </div>

              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePedido} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm mb-2 text-gray-700">
                    Cliente *
                  </label>

                  <select
                    value={newPedido.Id_Cliente}
                    onChange={(e) => handleSeleccionarCliente(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700"
                    required
                  >
                    <option value="">Seleccionar cliente...</option>

                    {clientes.map((cliente) => (
                      <option key={cliente.id_cliente} value={cliente.id_cliente}>
                        {cliente.razon_social ||
                          `${cliente.nombre} ${cliente.apellido}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700">
                    Fecha de generación
                  </label>

                  <input
                    type="date"
                    value={newPedido.Fecha_Generacion}
                    onChange={(e) => handleCambiarFechaGeneracion(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700">
                    Vencimiento
                  </label>

                  <input
                    type="date"
                    value={newPedido.Vencimiento}
                    onChange={(e) =>
                      setNewPedido({
                        ...newPedido,
                        Vencimiento: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2 text-gray-700">
                    Estado de Pago
                  </label>

                  <select
                    disabled
                    value={newPedido.Estado_Pago}
                    onChange={(e) =>
                      setNewPedido({
                        ...newPedido,
                        Estado_Pago: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700 bg-gray-100 cursor-not-allowed"
                  >
                    {ESTADOS_PAGO.map((estado) => (
                      <option key={estado} value={estado}>
                        {formatearEstado(estado)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700">
                    Estado de Facturación
                  </label>

                  <select
                    value={newPedido.Estado_Facturacion}
                    onChange={(e) =>
                      actualizarFacturacionNuevoPedido(e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700"
                  >
                    {ESTADOS_FACTURACION.map((estado) => (
                      <option key={estado} value={estado}>
                        {formatearEstado(estado)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {newPedido.Estado_Facturacion !== "no_se_factura" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-blue-600" />

                    <h4 className="text-sm font-semibold text-gray-800">
                      Información de factura
                    </h4>
                  </div>

                  <div>
                    <label className="block text-sm mb-2 text-gray-700">
                      Número de Factura
                      {newPedido.Estado_Facturacion === "facturado" ? " *" : ""}
                    </label>

                    <input
                      type="text"
                      value={newPedido.Nro_Factura}
                      onChange={(e) =>
                        setNewPedido({
                          ...newPedido,
                          Nro_Factura: e.target.value,
                        })
                      }
                      placeholder="Ej: FC-001"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    />

                    {newPedido.Estado_Facturacion === "pendiente" && (
                      <p className="text-xs text-blue-700 mt-1">
                        Podés dejarlo vacío y cargarlo más adelante.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm mb-2 text-gray-700">
                      PDF de Factura
                    </label>

                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) =>
                        handleArchivoFacturaNuevo(e.target.files?.[0])
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                    />

                    {newPedido.Pdf_Factura_Nombre ? (
                      <p className="text-xs text-blue-700 mt-2">
                        Archivo cargado: {newPedido.Pdf_Factura_Nombre}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-2">
                        No hay archivo cargado.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm mb-2 text-gray-700">
                  Observaciones
                </label>

                <textarea
                  value={newPedido.Observaciones}
                  onChange={(e) =>
                    setNewPedido({
                      ...newPedido,
                      Observaciones: e.target.value,
                    })
                  }
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700"
                  placeholder="Observaciones del pedido..."
                />
              </div>

              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Package size={18} className="text-red-700" />

                    <span className="text-sm text-gray-700">
                      Productos disponibles del cliente
                    </span>
                  </div>
                </div>

                {newPedido.Id_Cliente ? (
                  productosDisponibles.length > 0 ? (
                    <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
                      {productosDisponibles.map((producto) => {
                        const seleccionado = newPedido.productos.includes(
                          producto.id_producto
                        );

                        return (
                          <label
                            key={producto.id_producto}
                            className={`flex items-start gap-3 p-4 cursor-pointer ${
                              seleccionado ? "bg-red-50" : "hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={seleccionado}
                              onChange={() => toggleProducto(producto.id_producto)}
                              className="mt-1"
                            />

                            <div className="flex-1">
                              <p className="text-sm text-gray-800">
                                PR-{String(producto.id_producto).padStart(3, "0")} -{" "}
                                {getDescripcionProducto(producto)}
                              </p>

                              <p className="text-xs text-gray-500 mt-1">
                                Cantidad: {producto.cantidad} | Precio Unit.: $
                                {formatearPrecio(producto.precio)} | Subtotal: $
                                {formatearPrecio(getSubtotalProducto(producto))}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No hay productos disponibles para este cliente.
                    </div>
                  )
                ) : (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Primero seleccioná un cliente.
                  </div>
                )}
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Precio Total:</span>

                  <div className="flex items-center gap-1">
                    <DollarSign size={20} className="text-green-600" />

                    <span className="text-xl text-green-700">
                      {formatearPrecio(calcularTotalNuevoPedido())}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors"
                >
                  Cerrar
                </button>

                <button
                  type="submit"
                  disabled={newPedido.productos.length === 0}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    newPedido.productos.length > 0
                      ? "bg-red-700 text-white hover:bg-red-800"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {newPedido.productos.length > 0
                    ? `Generar Pedido (${newPedido.productos.length})`
                    : "Seleccioná productos"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && selectedPedido && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Detalle del Pedido - PED-
                  {String(selectedPedido.id_pedido).padStart(3, "0")}
                </h3>

                <p className="text-sm text-gray-500">
                  Información general, productos incluidos y facturación.
                </p>
              </div>

              <button
                onClick={cerrarModalDetalle}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {mensajeErrorModal && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {mensajeErrorModal}
                </div>
              )}

              {mensajeExitoModal && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  {mensajeExitoModal}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Cliente</p>

                  <p className="text-base text-gray-800 font-semibold">
                    {getNombreCliente(selectedPedido)}
                  </p>
                  {selectedPedido.saldo_cliente !== undefined && (
                    <p className={`text-xs mt-1 font-bold flex items-center flex-wrap gap-1 ${
                      Number(selectedPedido.saldo_cliente) > 0 ? "text-green-600" :
                      Number(selectedPedido.saldo_cliente) < 0 ? "text-red-600" :
                      "text-gray-500"
                    }`}>
                      Saldo: {Number(selectedPedido.saldo_cliente) === 0 ? "$0,00" : (
                        `${Number(selectedPedido.saldo_cliente) > 0 ? "" : "-"}$${formatearPrecio(Math.abs(selectedPedido.saldo_cliente))}`
                      )}
                      <span className={`text-[9px] uppercase px-1 py-0.5 rounded ${
                        Number(selectedPedido.saldo_cliente) > 0 ? "bg-green-100 text-green-800" :
                        Number(selectedPedido.saldo_cliente) < 0 ? "bg-red-100 text-red-800" : ""
                      }`}>
                        {Number(selectedPedido.saldo_cliente) === 0 ? "" :
                         Number(selectedPedido.saldo_cliente) > 0 ? "A FAVOR" : "EN CONTRA"}
                      </span>
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500">Fecha de Generación</p>

                  <p className="text-base text-gray-800">
                    {formatearFecha(selectedPedido.fecha_generacion)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Vencimiento</p>

                  <p className="text-base text-gray-800">
                    {formatearFecha(selectedPedido.vencimiento)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Precio Total</p>

                  <p className="text-lg text-green-700 font-semibold">
                    ${formatearPrecio(selectedPedido.precio_total)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Monto Adeudado</p>

                  <p className={`text-lg font-bold ${
                    Number(selectedPedido.monto_adeudado) > 0 ? "text-red-700" : "text-green-700"
                  }`}>
                    ${formatearPrecio(selectedPedido.monto_adeudado ?? 0)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Estado de Pago</p>

                  {isEditingPedido ? (
                    <select
                      disabled
                      value={selectedPedido.estado_pago}
                      onChange={(e) =>
                        setSelectedPedido({
                          ...selectedPedido,
                          estado_pago: e.target.value,
                        })
                      }
                      className="mt-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm bg-gray-100 cursor-not-allowed"
                    >
                      {ESTADOS_PAGO.map((estado) => (
                        <option key={estado} value={estado}>
                          {formatearEstado(estado)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`inline-block mt-1 px-3 py-1 rounded-full text-xs ${
                        getEstadoPagoInfo(selectedPedido.estado_pago).color
                      }`}
                    >
                      {getEstadoPagoInfo(selectedPedido.estado_pago).label}
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500">Facturación</p>

                  {isEditingPedido ? (
                    <select
                      disabled
                      value={selectedPedido.estado_facturacion}
                      onChange={(e) =>
                        actualizarFacturacionPedidoSeleccionado(e.target.value)
                      }
                      className="mt-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm bg-gray-100 cursor-not-allowed"
                    >
                      {ESTADOS_FACTURACION.map((estado) => (
                        <option key={estado} value={estado}>
                          {formatearEstado(estado)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`inline-block mt-1 px-3 py-1 rounded-full text-xs ${
                        getEstadoFacturaInfo(selectedPedido)
                          .color
                      }`}
                    >
                      {
                        getEstadoFacturaInfo(selectedPedido)
                          .label
                      }
                    </span>
                  )}
                </div>
              </div>

              {selectedPedido.estado_facturacion !== "no_se_factura" && (
                <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-blue-600" />

                    <h4 className="text-sm font-semibold text-gray-800">
                      Información de factura
                    </h4>
                  </div>

                  {isEditingPedido ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm mb-2 text-gray-700">
                          Número de Factura
                          {selectedPedido.estado_facturacion === "facturado"
                            ? " *"
                            : ""}
                        </label>

                        <input
                          type="text"
                          value={selectedPedido.nro_factura || ""}
                          onChange={(e) =>
                            setSelectedPedido({
                              ...selectedPedido,
                              nro_factura: e.target.value,
                            })
                          }
                          placeholder="Ej: FC-001"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />

                        {selectedPedido.estado_facturacion === "pendiente" && (
                          <p className="text-xs text-blue-700 mt-1">
                            Podés cargar el número ahora o completarlo más adelante.
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm mb-2 text-gray-700">
                          PDF de Factura
                        </label>

                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) =>
                            handleArchivoFacturaSeleccionado(e.target.files?.[0])
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                        />

                        {selectedPedido.pdf_factura_nombre ? (
                          <div className="mt-2 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                            <p className="text-xs text-gray-600">
                              Archivo actual: {selectedPedido.pdf_factura_nombre}
                            </p>

                            <button
                              type="button"
                              onClick={eliminarPdfFacturaPedido}
                              className="inline-flex items-center justify-center gap-2 px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-xs"
                            >
                              <Trash2 size={14} />
                              Eliminar PDF
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 mt-2">
                            No hay PDF cargado.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-900">
                        <strong>Número de factura:</strong>{" "}
                        {selectedPedido.nro_factura || "Sin número cargado"}
                      </p>

                      <button
                        onClick={() => descargarFactura(selectedPedido)}
                        disabled={!selectedPedido.pdf_factura_url}
                        className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
                          selectedPedido.pdf_factura_url
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <Download size={16} />
                        Descargar factura PDF
                      </button>

                      {!selectedPedido.pdf_factura_url && (
                        <p className="text-xs text-gray-500 mt-2">
                          No hay PDF de factura cargado.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800">
                      Productos del pedido
                    </h4>
                  </div>

                  <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                    {selectedPedido.productos?.length || 0} producto(s)
                  </span>
                </div>

                {isEditingPedido && selectedPedido.productos?.some(p => (p.estado || "").toLowerCase() === 'enviado') ? (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-orange-800">
                      <strong>Atención:</strong> Este pedido contiene productos enviados. No podés agregar nuevos productos.
                    </p>
                  </div>
                ) : isEditingPedido && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <label className="block text-sm mb-2 text-gray-700">
                      Agregar producto disponible del cliente
                    </label>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <select
                        value={productoEdicionSeleccionado}
                        onChange={(e) =>
                          setProductoEdicionSeleccionado(e.target.value)
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                      >
                        <option value="">Seleccionar producto...</option>

                        {productosDisponiblesEdicion.map((producto) => (
                          <option
                            key={producto.id_producto}
                            value={producto.id_producto}
                          >
                            PR-{String(producto.id_producto).padStart(3, "0")} -{" "}
                            {getDescripcionProducto(producto)} - $
                            {formatearPrecio(getSubtotalProducto(producto))}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={agregarProductoAlPedido}
                        disabled={!productoEdicionSeleccionado}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          productoEdicionSeleccionado
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        Agregar
                      </button>
                    </div>

                    {productosDisponiblesEdicion.length === 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        No hay productos disponibles para agregar a este pedido.
                      </p>
                    )}
                  </div>
                )}

                <div className="border border-gray-200 rounded-lg overflow-hidden">
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
                        {isEditingPedido && (
                          <th className="px-4 py-2 text-right text-xs text-gray-500">
                            Acción
                          </th>
                        )}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                      {selectedPedido.productos?.map((producto) => (
                        <tr key={producto.id_producto}>
                          <td className="px-4 py-2 text-sm text-gray-800">
                            PR-{String(producto.id_producto).padStart(3, "0")} -{" "}
                            {getDescripcionProducto(producto)}
                          </td>

                          <td className="px-4 py-2 text-sm text-gray-600">
                            {producto.cantidad}
                          </td>

                          <td className="px-4 py-2 text-sm text-gray-600">
                            ${formatearPrecio(producto.precio)}
                          </td>

                          <td className="px-4 py-2 text-sm text-right text-gray-800">
                            ${formatearPrecio(getSubtotalProducto(producto))}
                          </td>

                          {isEditingPedido && (
                            <td className="px-4 py-2 text-right">
                              <button
                                onClick={() =>
                                  quitarProductoDelPedido(producto.id_producto)
                                }
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                                title="Quitar del pedido"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-3">
                  Historial de Pagos del Pedido
                </h4>

                {selectedPedido.pagos && selectedPedido.pagos.length > 0 ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full bg-white">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs text-gray-500 font-semibold">
                            Fecha
                          </th>
                          <th className="px-4 py-2 text-left text-xs text-gray-500 font-semibold">
                            Medio de Pago
                          </th>
                          <th className="px-4 py-2 text-right text-xs text-gray-500 font-semibold">
                            Monto Anterior
                          </th>
                          <th className="px-4 py-2 text-right text-xs text-gray-500 font-semibold">
                            Monto Abonado
                          </th>
                          <th className="px-4 py-2 text-right text-xs text-gray-500 font-semibold">
                            Monto Restante
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-200">
                        {(() => {
                          let balanceAcumulado = Number(selectedPedido.precio_total);
                          return selectedPedido.pagos.map((pago, idx) => {
                            const montoAnterior = balanceAcumulado;
                            balanceAcumulado -= Number(pago.monto_usado);
                            const montoRestante = balanceAcumulado;
                            return (
                              <tr key={pago.id_pago_pedido || idx}>
                                <td className="px-4 py-2 text-sm text-gray-800">
                                  {formatearFecha(pago.fecha_pago)}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-600 capitalize">
                                  {pago.medio_pago || "Efectivo"}
                                </td>
                                <td className="px-4 py-2 text-sm text-right text-gray-600">
                                  ${formatearPrecio(montoAnterior)}
                                </td>
                                <td className="px-4 py-2 text-sm text-right text-green-600 font-medium">
                                  ${formatearPrecio(pago.monto_usado)}
                                </td>
                                <td className="px-4 py-2 text-sm text-right text-gray-800 font-semibold">
                                  ${formatearPrecio(Math.max(0, montoRestante))}
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-sm text-gray-500">
                    No se registran abonos para este pedido.
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Observaciones</p>

                {isEditingPedido ? (
                  <textarea
                    value={selectedPedido.observaciones || ""}
                    onChange={(e) =>
                      setSelectedPedido({
                        ...selectedPedido,
                        observaciones: e.target.value,
                      })
                    }
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-800">
                      {selectedPedido.observaciones || "Sin observaciones."}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                {isEditingPedido ? (
                  <>
                    <button
                      onClick={cancelarEdicionPedido}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>

                    <button
                      onClick={guardarCambiosPedido}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit size={16} />
                      Guardar cambios
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => descargarPdfPedido(selectedPedido)}
                      className="flex-1 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download size={16} />
                      Descargar PDF del pedido
                    </button>

                    <button
                      onClick={cerrarModalDetalle}
                      className="flex-1 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors"
                    >
                      Cerrar
                    </button>

                    <button
                      onClick={abrirEdicionPedido}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit size={16} />
                      Editar pedido
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