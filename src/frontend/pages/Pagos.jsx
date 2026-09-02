import { useEffect, useMemo, useState, useRef } from "react";
import {
  Search,
  Plus,
  Eye,
  Trash2,
  DollarSign,
  X,
  CreditCard,
  Wallet,
  Truck,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
} from "lucide-react";


// =====================================================
// CONFIGURACIÓN
// =====================================================

const API_URL = "http://localhost:4000/api";

function parseNum(val) {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (!val) return 0;
  let str = String(val).trim();
  if (str.includes(",") && str.includes(".")) {
    str = str.replace(/\./g, "").replace(",", ".");
  } else if (str.includes(",")) {
    str = str.replace(",", ".");
  }
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/*
  Estos identificadores deben coincidir con los registros
  existentes en la tabla Metodo_Pago.

  Cuando puedan conectarse a PostgreSQL, deben comprobar:

  SELECT * FROM Metodo_Pago;
*/

const METODOS_PAGO = [
  {
    id: 1,
    tipo: "efectivo",
    label: "Efectivo",
  },
  {
    id: 2,
    tipo: "transferencia",
    label: "Transferencia",
  },
  {
    id: 3,
    tipo: "cheque",
    label: "Cheque",
  },
  {
    id: 4,
    tipo: "tarjeta",
    label: "Tarjeta",
  },
];


const metodoPagoConfig = {
  efectivo: {
    label: "Efectivo",
    color: "bg-green-100 text-green-700",
  },

  transferencia: {
    label: "Transferencia",
    color: "bg-blue-100 text-blue-700",
  },

  cheque: {
    label: "Cheque",
    color: "bg-purple-100 text-purple-700",
  },

  tarjeta: {
    label: "Tarjeta",
    color: "bg-orange-100 text-orange-700",
  },
};


const estadoPagoConfig = {
  pendiente: {
    label: "Pendiente",
    color: "bg-yellow-100 text-yellow-700",
  },

  parcial: {
    label: "Parcial",
    color: "bg-blue-100 text-blue-700",
  },

  pagado: {
    label: "Pagado",
    color: "bg-green-100 text-green-700",
  },
};


const FORM_VACIO = {
  fecha_pago: new Date().toISOString().split("T")[0],
  monto: "",
  id_medio_pago: "",
  id_proveedor: "",
  facturas: [],
  monto_favor_usado: "",
};


// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function normalizarTexto(valor) {
  return String(valor ?? "").trim();
}


function normalizarTipoMedioPago(tipo) {
  return normalizarTexto(tipo)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}


function formatearDinero(valor) {
  return Number(valor || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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


function obtenerNombreProveedor(datos) {
  const nombre = (datos.nombre ?? datos.Nombre ?? "").trim();
  const apellido = (datos.apellido ?? datos.Apellido ?? "").trim();
  const contacto = `${nombre} ${apellido}`.trim();
  const razonSocial = (datos.razon_social ?? datos.Razon_Social ?? "").trim();

  return contacto || razonSocial || "Desconocido";
}


function normalizarFactura(factura) {
  const idPedido = factura.id_pedido ?? factura.Id_Pedido;
  const nroPedido = factura.nro_factura ?? factura.Nro_Factura;
  const idCliente = factura.id_cliente ?? factura.Id_Cliente;
  const clientName = factura.cliente || (factura.Nombre && factura.Apellido ? `${factura.Nombre} ${factura.Apellido}` : "");

  return {
    ...factura,

    id_factura_proveedor:
      factura.id_factura_proveedor ??
      factura.Id_Factura_Proveedor ??
      idPedido ??
      factura.id,

    nro_factura_proveedor:
      factura.nro_factura_proveedor ??
      factura.Nro_Factura_Proveedor ??
      ((nroPedido ? String(nroPedido) : "") ||
        (idPedido ? `Pedido N° ${idPedido}` : "")),

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

    id_proveedor:
      factura.id_proveedor ??
      factura.Id_Proveedor ??
      idCliente,

    proveedor:
      factura.proveedor ??
      (factura.id_proveedor || factura.Id_Proveedor ? obtenerNombreProveedor(factura) : clientName || "Cliente Desconocido"),
  };
}


function normalizarPago(pago) {
  const tipoMedioPago =
    pago.tipo_medio_pago ??
    pago.Tipo_Medio_Pago ??
    "";

  return {
    ...pago,

    id_pago_insumo:
      pago.id_pago_insumo ??
      pago.Id_Pago_Insumo ??
      pago.id_pago_pedido ??
      pago.Id_Pago_Pedido ??
      pago.id,

    fecha_pago:
      pago.fecha_pago ??
      pago.Fecha_Pago ??
      "",

    estado_pago:
      pago.estado_pago ??
      pago.Estado_Pago ??
      "pendiente",

    monto: Number(
      pago.monto ??
      pago.Monto ??
      0
    ),

    monto_restante: Number(
      pago.monto_restante ??
      pago.Monto_Restante ??
      0
    ),

    id_medio_pago:
      pago.id_medio_pago ??
      pago.Id_Medio_Pago,

    tipo_medio_pago: normalizarTipoMedioPago(
      tipoMedioPago
    ),
  };
}


function normalizarDetalle(detalle) {
  const idPedido = detalle.id_pedido ?? detalle.Id_Pedido;
  const nroPedido = detalle.nro_factura ?? detalle.Nro_Factura;

  return {
    ...detalle,

    id_factura_proveedor:
      detalle.id_factura_proveedor ??
      detalle.Id_Factura_Proveedor ??
      idPedido,

    nro_factura_proveedor:
      detalle.nro_factura_proveedor ??
      detalle.Nro_Factura_Proveedor ??
      ((nroPedido ? String(nroPedido) : "") ||
        (idPedido ? `Pedido N° ${idPedido}` : "")),

    monto_usado: Number(
      detalle.monto_usado ??
      detalle.Monto_Usado ??
      0
    ),

    precio_total: Number(
      detalle.precio_total ??
      detalle.Precio_Total ??
      0
    ),

    monto_adeudado: Number(
      detalle.monto_adeudado ??
      detalle.Monto_Adeudado ??
      0
    ),

    estado_pago:
      detalle.estado_pago ??
      detalle.Estado_Pago,
  };
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

export default function Pagos() {
  const [tipoVista, setTipoVista] = useState("cliente");
  const [pagos, setPagos] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [clientesTotales, setClientesTotales] = useState([]);
  const [proveedoresTotales, setProveedoresTotales] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState("");
  const [errorForm, setErrorForm] = useState("");
  const [mensajeExito, setMensajeExito] =
    useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [filterEstado, setFilterEstado] =
    useState("todos");

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [showViewModal, setShowViewModal] =
    useState(false);

  const [viewingPago, setViewingPago] =
    useState(null);

  const [detallesPago, setDetallesPago] =
    useState([]);

  const [cargandoDetalle, setCargandoDetalle] =
    useState(false);

  const [newPago, setNewPago] =
    useState(FORM_VACIO);


  // =====================================================
  // CARGA INICIAL
  // =====================================================

  useEffect(() => {
    cargarDatos();
  }, [tipoVista]);


  async function cargarDatos() {
    setCargando(true);
    setError("");

    try {
      const endpointPagos = `${API_URL}/pagos?tipo=${tipoVista}`;
      const endpointFacturas = tipoVista === "proveedor" 
        ? `${API_URL}/facturasProveedor` 
        : `${API_URL}/pedidos`;

      const [respuestaPagos, respuestaFacturas, resClientes, resProveedores] =
        await Promise.all([
          fetch(endpointPagos),
          fetch(endpointFacturas),
          fetch(`${API_URL}/clientes`),
          fetch(`${API_URL}/proveedores`),
        ]);

      const datosPagos =
        await leerRespuesta(respuestaPagos);

      const datosFacturas =
        await leerRespuesta(respuestaFacturas);

      if (!respuestaPagos.ok) {
        throw new Error(
          datosPagos.mensaje ||
          datosPagos.error ||
          "No se pudieron cargar los pagos."
        );
      }

      if (!respuestaFacturas.ok) {
        throw new Error(
          datosFacturas.mensaje ||
          datosFacturas.error ||
          "No se pudieron cargar las facturas."
        );
      }

      const listaPagos = Array.isArray(datosPagos)
        ? datosPagos
        : datosPagos.pagos || [];

      const listaFacturas = Array.isArray(
        datosFacturas
      )
        ? datosFacturas
        : datosFacturas.facturas || [];

      const listaClientes = resClientes.ok ? await resClientes.json() : [];
      const listaProveedores = resProveedores.ok ? await resProveedores.json() : [];

      setPagos(
        listaPagos.map(normalizarPago)
      );

      setFacturas(
        listaFacturas.map(normalizarFactura)
      );

      setClientesTotales(listaClientes);
      setProveedoresTotales(listaProveedores);
    } catch (err) {
      console.error(
        "Error al cargar los pagos:",
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
  // PROVEEDORES DISPONIBLES
  // =====================================================

  const proveedoresDisponibles = useMemo(() => {
    const mapaProveedores = new Map();

    facturas
      .filter(
        (factura) =>
          factura.estado_pago !== "pagado" &&
          factura.monto_adeudado > 0
      )
      .forEach((factura) => {
        if (!mapaProveedores.has(
          factura.id_proveedor
        )) {
          mapaProveedores.set(
            factura.id_proveedor,
            {
              id_proveedor:
                factura.id_proveedor,

              proveedor:
                factura.proveedor,
            }
          );
        }
      });

    return Array.from(
      mapaProveedores.values()
    ).sort((a, b) =>
      a.proveedor.localeCompare(b.proveedor)
    );
  }, [facturas]);


  // =====================================================
  // FACTURAS DEL PROVEEDOR SELECCIONADO
  // =====================================================

  const facturasDisponibles = useMemo(() => {
    if (!newPago.id_proveedor) {
      return [];
    }

    return facturas.filter(
      (factura) =>
        Number(factura.id_proveedor) ===
          Number(newPago.id_proveedor) &&
        factura.estado_pago !== "pagado" &&
        factura.monto_adeudado > 0
    );
  }, [
    facturas,
    newPago.id_proveedor,
  ]);


  // =====================================================
  // PAGOS FILTRADOS
  // =====================================================

  const pagosFiltrados = useMemo(() => {
    const termino =
      searchTerm.trim().toLowerCase();

    return pagos.filter((pago) => {
      const coincideBusqueda =
        !termino ||
        String(pago.id_pago_insumo)
          .includes(termino) ||
        normalizarTexto(
          pago.tipo_medio_pago
        )
          .toLowerCase()
          .includes(termino) ||
        formatearFecha(pago.fecha_pago)
          .toLowerCase()
          .includes(termino);

      const coincideEstado =
        filterEstado === "todos" ||
        pago.estado_pago === filterEstado;

      return (
        coincideBusqueda &&
        coincideEstado
      );
    });
  }, [
    pagos,
    searchTerm,
    filterEstado,
  ]);


  // =====================================================
  // TOTALES
  // =====================================================

  const totalPagos = pagosFiltrados.reduce(
    (total, pago) =>
      total + Number(pago.monto),
    0
  );


  const totalAplicado = pagosFiltrados.reduce(
    (total, pago) =>
      total +
      (
        Number(pago.monto) -
        Number(pago.monto_restante)
      ),
    0
  );


  const totalRestante = pagosFiltrados.reduce(
    (total, pago) =>
      total + Number(pago.monto_restante),
    0
  );


  const pagosCompletos = pagosFiltrados.filter(
    (pago) =>
      pago.estado_pago === "pagado"
  ).length;


  // =====================================================
  // MONTO DEL FORMULARIO
  // =====================================================

  const montoAplicadoFormulario = Math.round(
    newPago.facturas.reduce(
      (total, factura) =>
        total +
        parseNum(factura.monto_usado),
      0
    ) * 100
  ) / 100;


  const montoEfectivoFormulario = Math.round(parseNum(newPago.monto) * 100) / 100;
  const montoFavorFormulario = Math.round(parseNum(newPago.monto_favor_usado) * 100) / 100;

  const montoRestanteFormulario = Math.round(
    (montoEfectivoFormulario + montoFavorFormulario - montoAplicadoFormulario) * 100
  ) / 100;

  const previos = useRef({ montoAplicado: 0, idProveedor: "" });

  useEffect(() => {
    if (previos.current.montoAplicado !== montoAplicadoFormulario || previos.current.idProveedor !== newPago.id_proveedor) {
      previos.current.montoAplicado = montoAplicadoFormulario;
      previos.current.idProveedor = newPago.id_proveedor;

      if (!newPago.id_proveedor) {
        setNewPago(prev => ({ ...prev, monto_favor_usado: "" }));
        return;
      }
      
      const lista = tipoVista === "proveedor" ? proveedoresTotales : clientesTotales;
      const entidadSeleccionada = lista.find(e => 
        String(e.id_proveedor || e.id_cliente || e.Id_Proveedor || e.Id_Cliente) === String(newPago.id_proveedor)
      );
      const totalCredito = entidadSeleccionada ? Number(entidadSeleccionada.total_a_favor || 0) : 0;
      
      const favorUsar = Math.min(totalCredito, montoAplicadoFormulario);
      const restanteAPagar = montoAplicadoFormulario > totalCredito ? (montoAplicadoFormulario - totalCredito) : 0;

      setNewPago(prev => ({
        ...prev,
        monto_favor_usado: favorUsar > 0 ? favorUsar : ""
      }));
    }
  }, [montoAplicadoFormulario, newPago.id_proveedor, tipoVista, proveedoresTotales, clientesTotales]);


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
  // MODAL AGREGAR
  // =====================================================

  function abrirAdd() {
    setNewPago({
      ...FORM_VACIO,

      fecha_pago:
        new Date().toISOString().split("T")[0],
    });

    setErrorForm("");
    setShowAddModal(true);
  }


  function cerrarAdd() {
    if (guardando) {
      return;
    }

    setShowAddModal(false);
    setErrorForm("");
  }


  function cambiarProveedor(idProveedor) {
    setNewPago((prev) => ({
      ...prev,

      id_proveedor: idProveedor,

      facturas: [],
    }));
  }


  // =====================================================
  // SELECCIONAR FACTURA
  // =====================================================

  function cambiarSeleccionFactura(factura) {
    setNewPago((prev) => {
      const yaSeleccionada =
        prev.facturas.some(
          (item) =>
            Number(
              item.id_factura_proveedor
            ) ===
            Number(
              factura.id_factura_proveedor
            )
        );

      if (yaSeleccionada) {
        return {
          ...prev,

          facturas: prev.facturas.filter(
            (item) =>
              Number(
                item.id_factura_proveedor
              ) !==
              Number(
                factura.id_factura_proveedor
              )
          ),
        };
      }

      return {
        ...prev,

        facturas: [
          ...prev.facturas,

          {
            id_factura_proveedor:
              factura.id_factura_proveedor,

            monto_usado: "",
          },
        ],
      };
    });
  }


  function facturaEstaSeleccionada(idFactura) {
    return newPago.facturas.some(
      (factura) =>
        Number(
          factura.id_factura_proveedor
        ) === Number(idFactura)
    );
  }


  function cambiarMontoFactura(
    idFactura,
    valor
  ) {
    setNewPago((prev) => ({
      ...prev,

      facturas: prev.facturas.map(
        (factura) =>
          Number(
            factura.id_factura_proveedor
          ) === Number(idFactura)
            ? {
                ...factura,
                monto_usado: valor,
              }
            : factura
      ),
    }));
  }


  // =====================================================
  // CREAR PAGO
  // =====================================================

  async function handleAddPago(evento) {
    evento.preventDefault();
    setErrorForm("");

    if (!newPago.fecha_pago) {
      setErrorForm(
        "Seleccioná la fecha del pago."
      );

      return;
    }

    const montoEfectivo = Math.round(parseNum(newPago.monto) * 100) / 100;
    const montoFavor = Math.round(parseNum(newPago.monto_favor_usado) * 100) / 100;

    if (montoEfectivo < 0) {
      setErrorForm(
        "El monto del pago debe ser mayor o igual a cero."
      );
      return;
    }

    if (montoEfectivo === 0 && montoFavor === 0) {
      setErrorForm(
        "Ingresá un monto de pago o utilizá saldo a favor."
      );
      return;
    }

    if (!newPago.id_medio_pago && montoEfectivo > 0) {
      setErrorForm(
        "Seleccioná un método de pago."
      );

      return;
    }

    if (!newPago.id_proveedor) {
      setErrorForm(
        tipoVista === "proveedor" ? "Seleccioná un proveedor." : "Seleccioná un cliente."
      );

      return;
    }

    if (newPago.facturas.length === 0) {
      setErrorForm(
        tipoVista === "proveedor" ? "Seleccioná al menos una factura." : "Seleccioná al menos un pedido."
      );

      return;
    }

    // Validar saldo a favor disponible
    const lista = tipoVista === "proveedor" ? proveedoresTotales : clientesTotales;
    const entidadSeleccionada = lista.find(e => 
      String(e.id_proveedor || e.id_cliente || e.Id_Proveedor || e.Id_Cliente) === String(newPago.id_proveedor)
    );
    const totalCredito = entidadSeleccionada ? parseNum(entidadSeleccionada.total_a_favor) : 0;
    
    if (montoFavor > totalCredito + 0.01) {
      setErrorForm(
        `El saldo a favor utilizado ($${montoFavor.toLocaleString('es-AR', { minimumFractionDigits: 2 })}) supera el disponible ($${totalCredito.toLocaleString('es-AR', { minimumFractionDigits: 2 })}).`
      );
      return;
    }

    for (const facturaSeleccionada of
      newPago.facturas) {
      const facturaOriginal =
        facturas.find(
          (factura) =>
            Number(
              factura.id_factura_proveedor
            ) ===
            Number(
              facturaSeleccionada.id_factura_proveedor
            )
        );

      const montoUsado = Math.round(parseNum(facturaSeleccionada.monto_usado) * 100) / 100;

      if (montoUsado <= 0) {
        setErrorForm(
          "Todos los montos aplicados deben ser mayores que cero."
        );

        return;
      }

      if (
        facturaOriginal &&
        montoUsado > Math.round(parseNum(facturaOriginal.monto_adeudado) * 100) / 100 + 0.01
      ) {
        setErrorForm(
          `El monto aplicado a ${tipoVista === "proveedor" ? "la factura " + facturaOriginal.nro_factura_proveedor : "el pedido N° " + facturaOriginal.id_factura_proveedor} supera su saldo adeudado.`
        );

        return;
      }
    }

    const totalDisponible = Math.round((montoEfectivo + montoFavor) * 100) / 100;
    if (
      montoAplicadoFormulario >
      totalDisponible + 0.01
    ) {
      setErrorForm(
        "El monto aplicado a las facturas no puede superar la suma del monto total del pago y el saldo a favor utilizado."
      );

      return;
    }

    setGuardando(true);

    try {
      const payload = {
        Fecha_Pago: newPago.fecha_pago,
        Monto: montoEfectivo,
        monto_favor_usado: montoFavor,
        Id_Medio_Pago: Number(newPago.id_medio_pago),
        Tipo: tipoVista,
        facturas: newPago.facturas.map(
          (factura) => ({
            [tipoVista === "cliente" ? "Id_Pedido" : "Id_Factura_Proveedor"]:
              Number(factura.id_factura_proveedor),
            Monto_Usado:
              Math.round(parseNum(factura.monto_usado) * 100) / 100,
          })
        ),
      };

      const respuesta = await fetch(
        `${API_URL}/pagos`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(payload),
        }
      );

      const datos =
        await leerRespuesta(respuesta);

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje ||
          datos.error ||
          "No se pudo registrar el pago."
        );
      }

      setShowAddModal(false);
      setNewPago(FORM_VACIO);

      mostrarExito(
        datos.mensaje ||
        "Pago registrado correctamente."
      );

      await cargarDatos();
    } catch (err) {
      console.error(
        "Error al registrar el pago:",
        err
      );

      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  }


  // =====================================================
  // VER DETALLE
  // =====================================================

  async function abrirDetallePago(pago) {
    setViewingPago(pago);
    setDetallesPago([]);
    setErrorForm("");
    setCargandoDetalle(true);
    setShowViewModal(true);

    try {
      const respuesta = await fetch(
        `${API_URL}/pagos/${pago.id_pago_insumo}?tipo=${tipoVista}`
      );

      const datos =
        await leerRespuesta(respuesta);

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje ||
          datos.error ||
          "No se pudo cargar el detalle del pago."
        );
      }

      setViewingPago(
        normalizarPago(
          datos.pago || pago
        )
      );

      const detalles = Array.isArray(
        datos.detalles
      )
        ? datos.detalles
        : [];

      setDetallesPago(
        detalles.map(normalizarDetalle)
      );
    } catch (err) {
      console.error(
        "Error al cargar el detalle:",
        err
      );

      setErrorForm(err.message);
    } finally {
      setCargandoDetalle(false);
    }
  }


  function cerrarDetalle() {
    setShowViewModal(false);
    setViewingPago(null);
    setDetallesPago([]);
    setErrorForm("");
  }


  // =====================================================
  // ELIMINAR PAGO
  // =====================================================

  async function handleDelete(id) {
    const confirmar = window.confirm(
      "¿Está seguro de que desea eliminar este pago? Los montos se devolverán a las facturas asociadas."
    );

    if (!confirmar) {
      return;
    }

    setGuardando(true);
    setErrorForm("");

    try {
      const respuesta = await fetch(
        `${API_URL}/pagos/${id}?tipo=${tipoVista}`,
        {
          method: "DELETE",
        }
      );

      const datos =
        await leerRespuesta(respuesta);

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje ||
          datos.error ||
          "No se pudo eliminar el pago."
        );
      }

      cerrarDetalle();

      mostrarExito(
        datos.mensaje ||
        "Pago eliminado correctamente."
      );

      await cargarDatos();
    } catch (err) {
      console.error(
        "Error al eliminar el pago:",
        err
      );

      if (showViewModal) {
        setErrorForm(err.message);
      } else {
        setError(err.message);
      }
    } finally {
      setGuardando(false);
    }
  }


  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-6">
      {mensajeExito && (
        <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg">
          {mensajeExito}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
          >
            <X size={16} />
          </button>
        </div>
      )}


      {/* HEADER */}

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Pagos a {tipoVista === "proveedor" ? "proveedores" : "clientes"}
          </h2>

          <p className="text-gray-500 text-sm mt-1">
            {pagosFiltrados.length} pagos registrados
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              type="button"
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
              Clientes
            </button>
            <button
              type="button"
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
              Proveedores
            </button>
          </div>

          <button
            type="button"
            onClick={abrirAdd}
            className="bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-800"
          >
            <Plus size={18} />
            Registrar pago
          </button>
        </div>
      </div>


      {/* RESUMEN */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign
              className="text-green-600"
              size={20}
            />

            <span className="text-sm text-green-700">
              Total registrado
            </span>
          </div>

          <p className="text-2xl text-green-800">
            ${formatearDinero(totalPagos)}
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle
              className="text-blue-600"
              size={20}
            />

            <span className="text-sm text-blue-700">
              Total aplicado
            </span>
          </div>

          <p className="text-2xl text-blue-800">
            ${formatearDinero(totalAplicado)}
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock
              className="text-yellow-600"
              size={20}
            />

            <span className="text-sm text-yellow-700">
              Monto sin aplicar
            </span>
          </div>

          <p className="text-2xl text-yellow-800">
            ${formatearDinero(totalRestante)}
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText
              className="text-purple-600"
              size={20}
            />

            <span className="text-sm text-purple-700">
              Pagos completos
            </span>
          </div>

          <p className="text-2xl text-purple-800">
            {pagosCompletos}
          </p>
        </div>
      </div>


      {/* FILTROS */}

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">


            <input
              type="text"
              placeholder="Buscar por número, fecha o método..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterEstado}
            onChange={(event) =>
              setFilterEstado(event.target.value)
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">
              Todos los estados
            </option>

            <option value="pendiente">
              Pendiente
            </option>

            <option value="parcial">
              Parcial
            </option>

            <option value="pagado">
              Pagado
            </option>
          </select>
        </div>
      </div>


      {/* TABLA */}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {cargando ? (
            <div className="p-8 text-center text-gray-500">
              Cargando pagos...
            </div>
          ) : pagosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No hay pagos para mostrar.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    N.º pago
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Aplicado
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Restante
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Método
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {pagosFiltrados.map((pago) => {
                  const montoAplicado =
                    Number(pago.monto) -
                    Number(
                      pago.monto_restante
                    );

                  const configMetodo =
                    metodoPagoConfig[
                      pago.tipo_medio_pago
                    ];

                  const configEstado =
                    estadoPagoConfig[
                      pago.estado_pago
                    ];

                  return (
                    <tr
                      key={pago.id_pago_insumo}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        P-
                        {String(
                          pago.id_pago_insumo
                        ).padStart(4, "0")}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatearFecha(
                          pago.fecha_pago
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${formatearDinero(
                          pago.monto
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${formatearDinero(
                          montoAplicado
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${formatearDinero(
                          pago.monto_restante
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            configMetodo?.color ||
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {configMetodo?.label ||
                            pago.tipo_medio_pago ||
                            "Sin especificar"}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            configEstado?.color ||
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {configEstado?.label ||
                            pago.estado_pago}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              abrirDetallePago(
                                pago
                              )
                            }
                            className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"
                            title="Ver detalle"
                          >
                            <Eye size={18} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                pago.id_pago_insumo
                              )
                            }
                            className="p-2 hover:bg-red-100 text-red-600 rounded-lg"
                            title="Eliminar pago"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>


      {/* MODAL REGISTRAR PAGO */}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200 bg-gray-50/80">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Registrar pago
                </h2>

                <p className="text-xs text-gray-500 mt-0.5 font-medium">
                  Aplicá el pago a una o varias facturas del mismo proveedor.
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarAdd}
                className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleAddPago}
              className="flex flex-col flex-1 overflow-hidden min-h-0"
            >
              <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-left">
              {errorForm && (
                <div className="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-xl text-xs font-medium flex items-start gap-2">
                  <AlertCircle
                    size={16}
                    className="mt-0.5 shrink-0"
                  />

                  <span>{errorForm}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                    Fecha del pago *
                  </label>

                  <input
                    type="date"
                    value={newPago.fecha_pago}
                    onChange={(event) =>
                      setNewPago((prev) => ({
                        ...prev,

                        fecha_pago:
                          event.target.value,
                      }))
                    }
                    className="w-full px-3.5 py-1.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                    Método de pago *
                  </label>

                  <select
                    value={
                      newPago.id_medio_pago
                    }
                    onChange={(event) =>
                      setNewPago((prev) => ({
                        ...prev,

                        id_medio_pago:
                          event.target.value,
                      }))
                    }
                    className="w-full px-3.5 py-1.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all"
                  >
                    <option value="">
                      Seleccionar método
                    </option>

                    {METODOS_PAGO.map(
                      (metodo) => (
                        <option
                          key={metodo.id}
                          value={metodo.id}
                        >
                          {metodo.label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                    {tipoVista === "proveedor" ? "Proveedor *" : "Cliente *"}
                  </label>

                  <select
                    value={
                      newPago.id_proveedor
                    }
                    onChange={(event) =>
                      cambiarProveedor(
                        event.target.value
                      )
                    }
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">
                      Seleccionar {tipoVista === "proveedor" ? "proveedor" : "cliente"}
                    </option>

                    {(tipoVista === "proveedor" ? proveedoresTotales : clientesTotales).map(
                      (entidad) => {
                        const idEntidad = entidad.id_proveedor || entidad.id_cliente || entidad.Id_Proveedor || entidad.Id_Cliente;
                        const razonSocial = (entidad.razon_social || entidad.Razon_Social || "").trim();
                        const nombre = (entidad.nombre || entidad.Nombre || "").trim();
                        const apellido = (entidad.apellido || entidad.Apellido || "").trim();
                        const contacto = `${nombre} ${apellido}`.trim();
                        
                        const labelMostrar = contacto || razonSocial || `ID #${idEntidad}`;

                        return (
                          <option
                            key={idEntidad}
                            value={idEntidad}
                          >
                            {labelMostrar}
                          </option>
                        );
                      }
                    )}
                  </select>
                  {/* SALDO DEL CLIENTE/PROVEEDOR */}
                  {newPago.id_proveedor && (
                    (() => {
                      const lista = tipoVista === "proveedor" ? proveedoresTotales : clientesTotales;
                      const entidadSeleccionada = lista.find(e => 
                        String(e.id_proveedor || e.id_cliente || e.Id_Proveedor || e.Id_Cliente) === String(newPago.id_proveedor)
                      );
                      
                      if (entidadSeleccionada) {
                        const totalCredito = Number(entidadSeleccionada.total_a_favor || 0);
                        const totalDeuda = Number(entidadSeleccionada.total_en_contra || 0);
                        const saldo = totalCredito - totalDeuda;
                        const isPositive = saldo > 0;
                        const isNegative = saldo < 0;
                        
                        return (
                          <div className="mt-3 p-3.5 rounded-xl border border-gray-200 bg-gray-50 shadow-sm space-y-2 text-gray-700">
                            <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider border-b pb-1.5 border-gray-200">
                              <span>Resumen de Cuenta</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] ${
                                isPositive ? 'bg-green-100 text-green-800 font-bold' : 
                                isNegative ? 'bg-red-100 text-red-800 font-bold' : 
                                'bg-gray-200 text-gray-700'
                              }`}>
                                {saldo === 0 ? 'Sin saldo' : isPositive ? 'A Favor' : 'En contra'}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>{tipoVista === "proveedor" ? "Deuda total facturas:" : "Deuda total pedidos:"}</span>
                              <span className="font-semibold text-red-600">${totalDeuda.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Monto a favor disponible:</span>
                              <span className="font-semibold text-green-600">${totalCredito.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold border-t pt-1.5 border-gray-200">
                              <span>Saldo neto deudor/acreedor:</span>
                              <span className={saldo < 0 ? 'text-red-700' : saldo > 0 ? 'text-green-700' : 'text-gray-700'}>
                                {saldo < 0 ? '-' : ''}${Math.abs(saldo).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()
                  )}
                </div>

                <div>
                  <label className="block mb-2 text-sm text-gray-700">
                    Monto total del pago ($) *
                  </label>

                  <div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newPago.monto}
                      onChange={(event) =>
                        setNewPago((prev) => ({
                          ...prev,

                          monto:
                            event.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0,00"
                    />
                  </div>
                </div>


              </div>


              {/* FACTURAS */}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg text-gray-800">
                      {tipoVista === "proveedor" ? "Facturas a pagar" : "Pedidos a pagar"}
                    </h3>

                    <p className="text-sm text-gray-500">
                      Seleccioná {tipoVista === "proveedor" ? "las facturas" : "los pedidos"} y definí cuánto aplicar a cada {tipoVista === "proveedor" ? "una" : "uno"}.
                    </p>
                  </div>
                </div>

                {!newPago.id_proveedor ? (
                  <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
                    Primero seleccioná un {tipoVista === "proveedor" ? "proveedor" : "cliente"}.
                  </div>
                ) : facturasDisponibles.length ===
                  0 ? (
                  <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
                    {tipoVista === "proveedor" ? "El proveedor no tiene facturas pendientes." : "El cliente no tiene pedidos pendientes."}
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Seleccionar
                            </th>

                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                              {tipoVista === "proveedor" ? "Factura" : "Pedido"}
                            </th>

                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Estado
                            </th>

                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Adeudado
                            </th>

                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Monto a aplicar
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {facturasDisponibles.map(
                            (factura) => {
                              const seleccionada =
                                facturaEstaSeleccionada(
                                  factura.id_factura_proveedor
                                );

                              const facturaFormulario =
                                newPago.facturas.find(
                                  (item) =>
                                    Number(
                                      item.id_factura_proveedor
                                    ) ===
                                    Number(
                                      factura.id_factura_proveedor
                                    )
                                );

                              return (
                                <tr
                                  key={
                                    factura.id_factura_proveedor
                                  }
                                  className="border-t"
                                >
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <input
                                      type="checkbox"
                                      checked={
                                        seleccionada
                                      }
                                      onChange={() =>
                                        cambiarSeleccionFactura(
                                          factura
                                        )
                                      }
                                      className="h-4 w-4"
                                    />
                                  </td>

                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {
                                      factura.nro_factura_proveedor
                                    }
                                  </td>

                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs ${
                                        estadoPagoConfig[
                                          factura.estado_pago
                                        ]?.color ||
                                        "bg-gray-100 text-gray-700"
                                      }`}
                                    >
                                      {estadoPagoConfig[
                                        factura.estado_pago
                                      ]?.label ||
                                        factura.estado_pago}
                                    </span>
                                  </td>

                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    $
                                    {formatearDinero(
                                      factura.monto_adeudado
                                    )}
                                  </td>

                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <input
                                      type="number"
                                      min="0.01"
                                      max={
                                        factura.monto_adeudado
                                      }
                                      step="0.01"
                                      disabled={
                                        !seleccionada
                                      }
                                      value={
                                        facturaFormulario
                                          ?.monto_usado ??
                                        ""
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        cambiarMontoFactura(
                                          factura.id_factura_proveedor,
                                          event
                                            .target
                                            .value
                                        )
                                      }
                                      className="w-36 border border-gray-300 rounded-lg p-2 disabled:bg-gray-100 disabled:text-gray-400"
                                    />
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>


              {/* RESUMEN FORMULARIO */}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-500">
                    Monto del pago
                  </p>

                  <p className="text-xl text-gray-800">
                    $
                    {formatearDinero(
                      newPago.monto
                    )}
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-600">
                    Total a pagar
                  </p>

                  <p className="text-xl text-blue-800">
                    $
                    {formatearDinero(
                      Math.max(0, montoAplicadoFormulario - Number(newPago.monto_favor_usado || 0))
                    )}
                  </p>
                </div>

                <div
                  className={`border rounded-lg p-4 transition-colors ${
                    montoRestanteFormulario < 0
                      ? "bg-red-50 border-red-200"
                      : montoRestanteFormulario > 0
                      ? "bg-green-50 border-green-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <p
                    className={`text-sm font-semibold ${
                      montoRestanteFormulario < 0
                        ? "text-red-700"
                        : montoRestanteFormulario > 0
                        ? "text-green-700"
                        : "text-gray-500"
                    }`}
                  >
                    {montoRestanteFormulario < 0 
                      ? "Faltan fondos al monto ingresado" 
                      : montoRestanteFormulario > 0 
                      ? `Plata a favor del ${tipoVista === "proveedor" ? "proveedor" : "cliente"}`
                      : "Pago exacto (equilibrado)"
                    }
                  </p>

                  <p
                    className={`text-xl font-bold ${
                      montoRestanteFormulario < 0
                        ? "text-red-700"
                        : montoRestanteFormulario > 0
                        ? "text-green-700"
                        : "text-gray-800"
                    }`}
                  >
                    $
                    {formatearDinero(
                      Math.abs(montoRestanteFormulario)
                    )}
                  </p>
                </div>
              </div>
              </div>
              <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-200 flex justify-end items-center gap-3 shrink-0 rounded-b-2xl">
                <button
                  type="button"
                  onClick={cerrarAdd}
                  className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
                >
                  {guardando
                    ? "Guardando..."
                    : "Guardar pago"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* MODAL DETALLE */}

      {showViewModal && viewingPago && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-200 bg-gray-50/80">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Pago P-
                  {String(
                    viewingPago.id_pago_insumo
                  ).padStart(4, "0")}
                </h2>

                <p className="text-xs text-gray-500 mt-0.5 font-medium">
                  Detalle de facturas asociadas
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarDetalle}
                className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {errorForm && (
                <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
                  {errorForm}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm">
                    Fecha
                  </p>

                  <p className="text-lg">
                    {formatearFecha(
                      viewingPago.fecha_pago
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 text-sm">
                    Método de pago
                  </p>

                  <p className="text-lg">
                    {metodoPagoConfig[
                      viewingPago.tipo_medio_pago
                    ]?.label ||
                      viewingPago.tipo_medio_pago ||
                      "Sin especificar"}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 text-sm">
                    Monto total
                  </p>

                  <p className="text-lg">
                    $
                    {formatearDinero(
                      viewingPago.monto
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 text-sm">
                    Monto restante
                  </p>

                  <p className="text-lg">
                    $
                    {formatearDinero(
                      viewingPago.monto_restante
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 text-sm">
                    Estado
                  </p>

                  <span
                    className={`inline-block mt-1 px-3 py-1 rounded-full text-xs ${
                      estadoPagoConfig[
                        viewingPago.estado_pago
                      ]?.color ||
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {estadoPagoConfig[
                      viewingPago.estado_pago
                    ]?.label ||
                      viewingPago.estado_pago}
                  </span>
                </div>
              </div>


              <div>
                <h3 className="text-lg text-gray-800 mb-3">
                  Facturas asociadas
                </h3>

                {cargandoDetalle ? (
                  <div className="p-6 text-center text-gray-500">
                    Cargando detalle...
                  </div>
                ) : detallesPago.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 border border-dashed border-gray-300 rounded-lg">
                    No hay facturas asociadas.
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Factura
                            </th>

                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Monto usado
                            </th>

                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Saldo actual
                            </th>

                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Estado actual
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {detallesPago.map(
                            (detalle) => (
                              <tr
                                key={`${viewingPago.id_pago_insumo}-${detalle.id_factura_proveedor}`}
                                className="border-t"
                              >
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {
                                    detalle.nro_factura_proveedor
                                  }
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  $
                                  {formatearDinero(
                                    detalle.monto_usado
                                  )}
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  $
                                  {formatearDinero(
                                    detalle.monto_adeudado
                                  )}
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs ${
                                      estadoPagoConfig[
                                        detalle.estado_pago
                                      ]?.color ||
                                      "bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    {estadoPagoConfig[
                                      detalle.estado_pago
                                    ]?.label ||
                                      detalle.estado_pago}
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


              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={cerrarDetalle}
                  className="flex-1 border border-gray-300 py-3 rounded-lg hover:bg-gray-50"
                >
                  Cerrar
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleDelete(
                      viewingPago.id_pago_insumo
                    )
                  }
                  disabled={guardando}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Trash2 size={18} />

                  {guardando
                    ? "Eliminando..."
                    : "Eliminar pago"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}