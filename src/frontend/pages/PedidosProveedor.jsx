import { useEffect, useMemo, useState } from "react";
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
  Clock,
  Truck,
  FileText,
  Printer,
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
// FORMULARIO VACÍO
// =====================================================

const FORM_VACIO = {
  id_proveedor: "",
  nro_factura_proveedor: "",
  fecha_emision: new Date().toISOString().split("T")[0],
  vencimiento: "",
  precio_total: "",
  monto_adeudado: "",
  observaciones: "",
  tipo_comprobante: "factura",
  archivo_pdf_file: null
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

  if (razonSocial.trim()) {
    return razonSocial;
  }

  const nombre =
    proveedor.nombre ??
    proveedor.Nombre ??
    "";

  const apellido =
    proveedor.apellido ??
    proveedor.Apellido ??
    "";

  const nombreCompleto = `${nombre} ${apellido}`.trim();

  return nombreCompleto || "Proveedor sin nombre";
}


function normalizarProveedor(proveedor) {
  return {
    ...proveedor,

    id_proveedor:
      proveedor.id_proveedor ??
      proveedor.Id_Proveedor ??
      proveedor.id,

    nombre_proveedor: obtenerNombreProveedor(proveedor),
  };
}


function normalizarFactura(factura) {
  const proveedorDesdeFactura = {
    razon_social:
      factura.razon_social ??
      factura.Razon_Social,

    nombre:
      factura.nombre ??
      factura.Nombre,

    apellido:
      factura.apellido ??
      factura.Apellido,
  };

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

    tipo_comprobante:
      factura.tipo_comprobante ??
      "factura",
      
    archivo_pdf:
      factura.archivo_pdf ??
      null,

    observaciones:
      factura.observaciones ??
      factura.Observaciones ??
      "",

    id_proveedor:
      factura.id_proveedor ??
      factura.Id_Proveedor,

    proveedor:
      factura.proveedor ??
      obtenerNombreProveedor(proveedorDesdeFactura),
  };
}


function fechaParaInput(fecha) {
  if (!fecha) {
    return "";
  }

  return String(fecha).split("T")[0];
}


function formatearFecha(fecha) {
  if (!fecha) {
    return "—";
  }

  const fechaNormalizada = fechaParaInput(fecha);
  const partes = fechaNormalizada.split("-");

  if (partes.length !== 3) {
    return fecha;
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

export function PedidosProveedor({ tipoVista, setTipoVista }) {
  const [facturas, setFacturas] = useState([]);
  const [proveedores, setProveedores] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState("");
  const [errorForm, setErrorForm] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [viewingFactura, setViewingFactura] = useState(null);
  const [isEditandoFactura, setIsEditandoFactura] =
    useState(false);

  const [newFactura, setNewFactura] =
    useState(FORM_VACIO);

  const [searchProveedor, setSearchProveedor] =
    useState("");

  const [showSuggestions, setShowSuggestions] =
    useState(false);


  // =====================================================
  // CARGA INICIAL
  // =====================================================

  useEffect(() => {
    cargarDatos();
  }, []);


  async function cargarDatos() {
    setCargando(true);
    setError("");

    try {
      const [respuestaFacturas, respuestaProveedores] =
        await Promise.all([
          fetch(`${API_URL}/facturasProveedor`),
          fetch(`${API_URL}/proveedores`),
        ]);

      const datosFacturas =
        await leerRespuesta(respuestaFacturas);

      const datosProveedores =
        await leerRespuesta(respuestaProveedores);

      if (!respuestaFacturas.ok) {
        throw new Error(
          datosFacturas.mensaje ||
          datosFacturas.error ||
          "No se pudieron cargar las facturas."
        );
      }

      if (!respuestaProveedores.ok) {
        throw new Error(
          datosProveedores.mensaje ||
          datosProveedores.error ||
          "No se pudieron cargar los proveedores."
        );
      }

      const listaFacturas = Array.isArray(datosFacturas)
        ? datosFacturas
        : datosFacturas.facturas || [];

      const listaProveedores = Array.isArray(
        datosProveedores
      )
        ? datosProveedores
        : datosProveedores.proveedores || [];

      setProveedores(
        listaProveedores.map(normalizarProveedor)
      );

      setFacturas(
        listaFacturas.map(normalizarFactura)
      );
    } catch (err) {
      console.error(
        "Error al cargar las facturas:",
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
  // PROVEEDORES Y SUGERENCIAS
  // =====================================================

  const proveedoresFiltrados = useMemo(() => {
    const termino = searchProveedor
      .trim()
      .toLowerCase();

    if (!termino) {
      return proveedores;
    }

    return proveedores.filter((proveedor) =>
      proveedor.nombre_proveedor
        .toLowerCase()
        .includes(termino)
    );
  }, [proveedores, searchProveedor]);


  function seleccionarProveedor(proveedor) {
    setNewFactura((prev) => ({
      ...prev,
      id_proveedor: proveedor.id_proveedor,
    }));

    setSearchProveedor(
      proveedor.nombre_proveedor
    );

    setShowSuggestions(false);
  }


  // =====================================================
  // FILTROS
  // =====================================================

  const facturasFiltradas = useMemo(() => {
    const termino = searchTerm
      .trim()
      .toLowerCase();

    return facturas.filter((factura) => {
      const numero = String(
        factura.nro_factura_proveedor || ""
      ).toLowerCase();

      const proveedor = String(
        factura.proveedor || ""
      ).toLowerCase();

      const observaciones = String(
        factura.observaciones || ""
      ).toLowerCase();

      const coincideBusqueda =
        !termino ||
        numero.includes(termino) ||
        proveedor.includes(termino) ||
        observaciones.includes(termino);

      const coincideEstado =
        filterEstado === "todos" ||
        factura.estado_pago === filterEstado;

      const fechaFactura =
        fechaParaInput(factura.fecha_emision);

      const coincideDesde =
        !fechaDesde ||
        fechaFactura >= fechaDesde;

      const coincideHasta =
        !fechaHasta ||
        fechaFactura <= fechaHasta;

      return (
        coincideBusqueda &&
        coincideEstado &&
        coincideDesde &&
        coincideHasta
      );
    });
  }, [
    facturas,
    searchTerm,
    filterEstado,
    fechaDesde,
    fechaHasta,
  ]);


  // =====================================================
  // TOTALES
  // =====================================================

  const totalPagado = facturasFiltradas
    .filter(
      (factura) =>
        factura.estado_pago === "pagado"
    )
    .reduce(
      (total, factura) =>
        total + Number(factura.precio_total),
      0
    );

  const totalPendiente = facturasFiltradas
    .filter(
      (factura) =>
        factura.estado_pago === "pendiente"
    )
    .reduce(
      (total, factura) =>
        total + Number(factura.monto_adeudado),
      0
    );

  const totalParcial = facturasFiltradas
    .filter(
      (factura) =>
        factura.estado_pago === "parcial"
    )
    .reduce(
      (total, factura) =>
        total + Number(factura.monto_adeudado),
      0
    );


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
    setNewFactura({
      ...FORM_VACIO,
      fecha_emision:
        new Date().toISOString().split("T")[0],
    });

    setSearchProveedor("");
    setShowSuggestions(false);
    setErrorForm("");
    setShowAddModal(true);
  }


  function cerrarAdd() {
    if (guardando) {
      return;
    }

    setShowAddModal(false);
    setErrorForm("");
    setShowSuggestions(false);
  }


  // =====================================================
  // MODAL VER Y EDITAR
  // =====================================================

  function abrirVer(factura) {
    setViewingFactura({
      ...factura,

      fecha_emision:
        fechaParaInput(factura.fecha_emision),

      vencimiento:
        fechaParaInput(factura.vencimiento),
    });

    setIsEditandoFactura(false);
    setErrorForm("");
    setShowViewModal(true);
  }


  function cerrarVer() {
    if (guardando) {
      return;
    }

    setShowViewModal(false);
    setViewingFactura(null);
    setIsEditandoFactura(false);
    setErrorForm("");
  }


  // =====================================================
  // CREAR FACTURA
  // =====================================================

  async function handleAddFactura(evento) {
    evento.preventDefault();
    setErrorForm("");

    if (!newFactura.id_proveedor) {
      setErrorForm(
        "Seleccioná un proveedor de la lista."
      );

      return;
    }

    if (newFactura.tipo_comprobante === 'factura' && !newFactura.nro_factura_proveedor.trim()) {
      setErrorForm("Ingresá el número de factura.");
      return;
    }

    if (!newFactura.fecha_emision || !newFactura.vencimiento) {
      setErrorForm("Completá las fechas de emisión y vencimiento.");
      return;
    }

    if (Number(newFactura.precio_total) <= 0) {
      setErrorForm("El precio total debe ser mayor que cero.");
      return;
    }

    setGuardando(true);

    try {
      const formData = new FormData();
      if(newFactura.tipo_comprobante === 'factura' && newFactura.nro_factura_proveedor.trim()) {
        formData.append("Nro_Factura_Proveedor", newFactura.nro_factura_proveedor.trim());
      }
      formData.append("Fecha_Emision", newFactura.fecha_emision);
      formData.append("Vencimiento", newFactura.vencimiento);
      formData.append("Precio_Total", Number(newFactura.precio_total));
      formData.append("Observaciones", newFactura.observaciones.trim());
      formData.append("Id_Proveedor", Number(newFactura.id_proveedor));
      formData.append("tipo_comprobante", newFactura.tipo_comprobante);
      
      if(newFactura.tipo_comprobante === 'factura' && newFactura.archivo_pdf_file) {
        formData.append("archivo_pdf", newFactura.archivo_pdf_file);
      }

      const respuesta = await fetch(
        `${API_URL}/facturasProveedor`,
        {
          method: "POST",
          body: formData,
        }
      );

      const datos =
        await leerRespuesta(respuesta);

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje ||
          datos.error ||
          "No se pudo crear la factura."
        );
      }

      setShowAddModal(false);
      setNewFactura(FORM_VACIO);

      mostrarExito(
        datos.mensaje ||
        "Factura agregada correctamente."
      );

      await cargarDatos();
    } catch (err) {
      console.error(
        "Error al crear la factura:",
        err
      );

      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  }


  // =====================================================
  // EDITAR FACTURA
  // =====================================================

  async function handleSaveFacturaChanges() {
    if (!viewingFactura) {
      return;
    }

    setErrorForm("");

    if (
      viewingFactura.tipo_comprobante === 'factura' &&
      !viewingFactura.nro_factura_proveedor?.trim()
    ) {
      setErrorForm("Ingresá el número de factura.");
      return;
    }

    if (
      !viewingFactura.fecha_emision ||
      !viewingFactura.vencimiento
    ) {
      setErrorForm(
        "Completá las fechas obligatorias."
      );

      return;
    }

    if (
      Number(viewingFactura.precio_total) <= 0
    ) {
      setErrorForm(
        "El precio total debe ser mayor que cero."
      );

      return;
    }

    setGuardando(true);

    try {
      const formData = new FormData();
      if(viewingFactura.tipo_comprobante === 'factura' && viewingFactura.nro_factura_proveedor?.trim()) {
        formData.append("Nro_Factura_Proveedor", viewingFactura.nro_factura_proveedor.trim());
      }
      formData.append("Fecha_Emision", viewingFactura.fecha_emision);
      formData.append("Vencimiento", viewingFactura.vencimiento);
      formData.append("Precio_Total", Number(viewingFactura.precio_total));
      formData.append("Observaciones", viewingFactura.observaciones?.trim() || "");
      formData.append("Id_Proveedor", Number(viewingFactura.id_proveedor));
      formData.append("tipo_comprobante", viewingFactura.tipo_comprobante);

      if(viewingFactura.tipo_comprobante === 'factura' && viewingFactura.archivo_pdf_file) {
        formData.append("archivo_pdf", viewingFactura.archivo_pdf_file);
      }

      const respuesta = await fetch(
        `${API_URL}/facturasProveedor/${viewingFactura.id_factura_proveedor}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      const datos =
        await leerRespuesta(respuesta);

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje ||
          datos.error ||
          "No se pudo actualizar la factura."
        );
      }

      setIsEditandoFactura(false);

      mostrarExito(
        datos.mensaje ||
        "Factura actualizada correctamente."
      );

      await cargarDatos();

      setShowViewModal(false);
      setViewingFactura(null);
    } catch (err) {
      console.error(
        "Error al actualizar la factura:",
        err
      );

      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  }


  // =====================================================
  // ELIMINAR FACTURA
  // =====================================================

  async function handleDelete(id) {
    const confirmar = window.confirm(
      "¿Está seguro de que desea eliminar esta factura?"
    );

    if (!confirmar) {
      return;
    }

    setGuardando(true);
    setErrorForm("");

    try {
      const respuesta = await fetch(
        `${API_URL}/facturasProveedor/${id}`,
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
          "No se pudo eliminar la factura."
        );
      }

      cerrarVer();

      mostrarExito(
        datos.mensaje ||
        "Factura eliminada correctamente."
      );

      await cargarDatos();
    } catch (err) {
      console.error(
        "Error al eliminar la factura:",
        err
      );

      setErrorForm(err.message);
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
            Compras (Pedidos a Proveedores)
          </h2>

          <p className="text-gray-500 text-sm mt-1">
            {facturasFiltradas.length} facturas registradas
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setTipoVista && setTipoVista("cliente")}
              className="flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-gray-600 hover:text-gray-800"
            >
              Clientes
            </button>
            <button
              onClick={() => setTipoVista && setTipoVista("proveedor")}
              className="flex items-center gap-2 px-4 py-2 rounded-md transition-colors bg-white text-red-700 shadow-sm"
            >
              Proveedores
            </button>
          </div>

          <button
            type="button"
            onClick={abrirAdd}
            className="flex items-center gap-2 bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors"
          >
            <Plus size={20} />
            Agregar factura
          </button>
        </div>
      </div>


      {/* FILTROS */}

      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 space-y-4">
        {/* Filtros de fecha primero */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Calendar
              size={20}
              className="text-gray-400"
            />
            <span className="text-sm text-gray-600">
              Filtrar por fecha de emisión:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">
              Desde:
            </label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(event) =>
                setFechaDesde(event.target.value)
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">
              Hasta:
            </label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(event) =>
                setFechaHasta(event.target.value)
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {(fechaDesde || fechaHasta) && (
            <button
              type="button"
              onClick={() => {
                setFechaDesde("");
                setFechaHasta("");
              }}
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Limpiar fechas
            </button>
          )}
        </div>

        {/* Filtro de coincidencia y estado abajo */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-100">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Buscar por factura, proveedor u observación..."
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
              Pago parcial
            </option>
            <option value="pagado">
              Pagada
            </option>
          </select>
        </div>
      </div>


      {/* TABLA */}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {cargando ? (
            <div className="p-8 text-center text-gray-500">
              Cargando facturas...
            </div>
          ) : facturasFiltradas.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No hay facturas para mostrar.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 tracking-wider">
                    Tipo
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 tracking-wider">
                    Nro. Comprobante
                  </th>

                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                    Proveedor
                  </th>

                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                    Emisión
                  </th>

                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                    Vencimiento
                  </th>

                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                    Total
                  </th>

                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                    Adeudado
                  </th>

                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>

                  <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {facturasFiltradas.map((factura) => (
                  <tr
                    key={
                      factura.id_factura_proveedor
                    }
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize leading-[1.25]">
                       <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${factura.tipo_comprobante === 'remito' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                         {factura.tipo_comprobante}
                       </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {factura.nro_factura_proveedor || "-"}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {factura.proveedor}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatearFecha(
                        factura.fecha_emision
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatearFecha(
                        factura.vencimiento
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      ${formatearDinero(
                        factura.precio_total
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      ${formatearDinero(
                        factura.monto_adeudado
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm">
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

                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            abrirVer(factura)
                          }
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                          title="Ver detalles"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const ventana = window.open("", "_blank");
                            if (ventana) {
                              ventana.document.write(`
                                <html>
                                <head>
                                  <title>Comprobante de Proveedor</title>
                                  <style>
                                    body { font-family: Arial, sans-serif; padding: 32px; color: #111827; }
                                    h1 { margin-bottom: 4px; color: #1e3a8a; }
                                    p { margin: 8px 0; font-size: 14px; }
                                    .box { border: 1px solid #d1d5db; padding: 20px; border-radius: 8px; margin-top: 20px; }
                                    .total { margin-top: 20px; font-size: 18px; font-weight: bold; }
                                  </style>
                                </head>
                                <body>
                                  <h1>${factura.tipo_comprobante === 'remito' ? 'Remito' : 'Factura'} de Proveedor</h1>
                                  <div class="box">
                                    <p><strong>Proveedor:</strong> ${factura.proveedor}</p>
                                    ${factura.tipo_comprobante !== 'remito' ? `<p><strong>Nro. Factura:</strong> ${factura.nro_factura_proveedor || '-'}</p>` : ''}
                                    <p><strong>Fecha de Emisión:</strong> ${formatearFecha(factura.fecha_emision)}</p>
                                    <p><strong>Vencimiento:</strong> ${formatearFecha(factura.vencimiento)}</p>
                                    <p><strong>Estado:</strong> ${estadoConfig[factura.estado_pago]?.label || factura.estado_pago}</p>
                                    <p><strong>Observaciones:</strong> ${factura.observaciones || '---'}</p>
                                    <p class="total">Monto Total: $${formatearDinero(factura.precio_total)}</p>
                                    <p class="total" style="color: #b91c1c;">Monto Adeudado: $${formatearDinero(factura.monto_adeudado)}</p>
                                  </div>
                                </body>
                                </html>
                              `);
                              ventana.document.close();
                              ventana.focus();
                              setTimeout(() => ventana.print(), 250);
                            } else {
                              alert("Por favor, permite ventanas emergentes para imprimir.");
                            }
                          }}
                          className="p-2 hover:bg-green-50 rounded-lg transition-colors text-green-600"
                          title="Imprimir Comprobante"
                        >
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


      {/* MODAL AGREGAR */}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl text-gray-800">
                Agregar factura de proveedor
              </h3>

              <button
                type="button"
                onClick={cerrarAdd}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleAddFactura}
              className="p-6 space-y-4"
            >
              {errorForm && (
                <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-lg text-sm">
                  {errorForm}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm mb-2 text-gray-700">
                    Proveedor *
                  </label>

                  <div className="relative">
                    <input
                      type="text"
                      value={searchProveedor}
                      onChange={(event) => {
                        setSearchProveedor(
                          event.target.value
                        );

                        setShowSuggestions(true);

                        setNewFactura((prev) => ({
                          ...prev,
                          id_proveedor: "",
                        }));
                      }}
                      onFocus={() =>
                        setShowSuggestions(true)
                      }
                      onBlur={() =>
                        setTimeout(
                          () =>
                            setShowSuggestions(
                              false
                            ),
                          200
                        )
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Buscar proveedor..."
                    />

                    {showSuggestions && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {proveedoresFiltrados.length >
                        0 ? (
                          proveedoresFiltrados.map(
                            (proveedor) => (
                              <button
                                key={
                                  proveedor.id_proveedor
                                }
                                type="button"
                                onMouseDown={() =>
                                  seleccionarProveedor(
                                    proveedor
                                  )
                                }
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors text-sm"
                              >
                                {
                                  proveedor.nombre_proveedor
                                }
                              </button>
                            )
                          )
                        ) : (
                          <div className="px-4 py-2 text-sm text-gray-500">
                            No se encontraron proveedores.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700">
                    Tipo de comprobante *
                  </label>
                  <select
                    value={newFactura.tipo_comprobante}
                    onChange={(event) =>
                      setNewFactura((prev) => ({
                        ...prev,
                        tipo_comprobante: event.target.value,
                        nro_factura_proveedor: event.target.value === 'remito' ? '' : prev.nro_factura_proveedor
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="factura">Factura</option>
                    <option value="remito">Remito</option>
                  </select>
                </div>

                {newFactura.tipo_comprobante === 'factura' && (
                  <div>
                    <label className="block text-sm mb-2 text-gray-700">
                      Número de factura *
                    </label>

                    <input
                      type="text"
                      value={
                        newFactura.nro_factura_proveedor
                      }
                      onChange={(event) =>
                        setNewFactura((prev) => ({
                          ...prev,

                          nro_factura_proveedor:
                            event.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej.: A-0001-00001234"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm mb-2 text-gray-700">
                    Precio total *
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={newFactura.precio_total}
                    onChange={(event) =>
                      setNewFactura((prev) => ({
                        ...prev,
                        precio_total: event.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="$ 0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700">
                    Fecha de emisión *
                  </label>

                  <input
                    type="date"
                    value={
                      newFactura.fecha_emision
                    }
                    onChange={(event) =>
                      setNewFactura((prev) => ({
                        ...prev,

                        fecha_emision:
                          event.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700">
                    Fecha de vencimiento *
                  </label>

                  <input
                    type="date"
                    value={
                      newFactura.vencimiento
                    }
                    onChange={(event) =>
                      setNewFactura((prev) => ({
                        ...prev,

                        vencimiento:
                          event.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {newFactura.tipo_comprobante === 'factura' && (
                  <div>
                    <label className="block text-sm mb-2 text-gray-700">
                      Archivo PDF (Opcional)
                    </label>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(event) =>
                        setNewFactura((prev) => ({
                          ...prev,
                          archivo_pdf_file: event.target.files[0]
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="block text-sm mb-2 text-gray-700">
                    Observaciones
                  </label>

                  <textarea
                    rows={3}
                    value={
                      newFactura.observaciones
                    }
                    onChange={(event) =>
                      setNewFactura((prev) => ({
                        ...prev,

                        observaciones:
                          event.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Notas adicionales..."
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={cerrarAdd}
                  disabled={guardando}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {guardando
                    ? "Guardando..."
                    : "Agregar factura"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* MODAL VER / EDITAR */}

      {showViewModal && viewingFactura && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl text-gray-800">
                {isEditandoFactura
                  ? "Editar factura"
                  : "Detalle de factura"}{" "}
                —{" "}
                {
                  viewingFactura.nro_factura_proveedor
                }
              </h3>

              <button
                type="button"
                onClick={cerrarVer}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {errorForm && (
                <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-lg text-sm">
                  {errorForm}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <p className="text-sm text-gray-500">
                    Proveedor
                  </p>

                  <p className="text-base text-gray-800">
                    {viewingFactura.proveedor}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-sm text-gray-500 mb-1">
                    Tipo de comprobante
                  </p>
                  
                  {isEditandoFactura ? (
                    <select
                      value={viewingFactura.tipo_comprobante || 'factura'}
                      onChange={(event) =>
                        setViewingFactura((prev) => ({
                          ...prev,
                          tipo_comprobante: event.target.value,
                          nro_factura_proveedor: event.target.value === 'remito' ? '' : prev.nro_factura_proveedor
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="factura">Factura</option>
                      <option value="remito">Remito</option>
                    </select>
                  ) : (
                    <p className="text-base text-gray-800 capitalize">
                      {viewingFactura.tipo_comprobante || 'Factura'}
                    </p>
                  )}
                </div>

                {(!viewingFactura.tipo_comprobante || viewingFactura.tipo_comprobante === 'factura') && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      Número de factura
                    </p>

                  {isEditandoFactura ? (
                    <input
                      type="text"
                      value={
                        viewingFactura.nro_factura_proveedor
                      }
                      onChange={(event) =>
                        setViewingFactura(
                          (prev) => ({
                            ...prev,

                            nro_factura_proveedor:
                              event.target.value,
                          })
                        )
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-base text-gray-800">
                      {
                        viewingFactura.nro_factura_proveedor
                      }
                    </p>
                  )}
                </div>
                )}

                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    Estado
                  </p>

                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs ${
                      estadoConfig[
                        viewingFactura.estado_pago
                      ]?.color ||
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {estadoConfig[
                      viewingFactura.estado_pago
                    ]?.label ||
                      viewingFactura.estado_pago}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    Fecha de emisión
                  </p>

                  {isEditandoFactura ? (
                    <input
                      type="date"
                      value={
                        viewingFactura.fecha_emision
                      }
                      onChange={(event) =>
                        setViewingFactura(
                          (prev) => ({
                            ...prev,

                            fecha_emision:
                              event.target.value,
                          })
                        )
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-base text-gray-800">
                      {formatearFecha(
                        viewingFactura.fecha_emision
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    Fecha de vencimiento
                  </p>

                  {isEditandoFactura ? (
                    <input
                      type="date"
                      value={
                        viewingFactura.vencimiento
                      }
                      onChange={(event) =>
                        setViewingFactura(
                          (prev) => ({
                            ...prev,

                            vencimiento:
                              event.target.value,
                          })
                        )
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-base text-gray-800">
                      {formatearFecha(
                        viewingFactura.vencimiento
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    Precio total
                  </p>

                  {isEditandoFactura ? (
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={viewingFactura.precio_total}
                      onChange={(event) =>
                        setViewingFactura((prev) => ({
                          ...prev,
                          precio_total: event.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="$ 0.00"
                    />
                  ) : (
                    <p className="text-lg text-gray-800">
                      $
                      {formatearDinero(
                        viewingFactura.precio_total
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    Monto adeudado
                  </p>

                  <p className="text-lg text-gray-800">
                    $
                    {formatearDinero(
                      viewingFactura.monto_adeudado
                    )}
                  </p>
                </div>

                {(!viewingFactura.tipo_comprobante || viewingFactura.tipo_comprobante === 'factura') && (
                  <div className="sm:col-span-2">
                    <p className="text-sm text-gray-500 mb-1">
                      Archivo PDF
                    </p>

                    {isEditandoFactura ? (
                       <div>
                       <input
                          type="file"
                          accept="application/pdf"
                          onChange={(event) =>
                            setViewingFactura((prev) => ({
                              ...prev,
                              archivo_pdf_file: event.target.files[0]
                            }))
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                        {viewingFactura.archivo_pdf && (
                           <p className="text-xs text-gray-500 mt-2">Ya existe un archivo cargado. Si seleccionás uno nuevo, se reemplazará.</p>
                        )}
                       </div>
                    ) : (
                      <div>
                        {viewingFactura.archivo_pdf ? (
                          <button 
                            type="button" 
                            onClick={async () => {
                                const url = `http://localhost:4000${viewingFactura.archivo_pdf}`;
                                try {
                                  const resp = await fetch(url);
                                  const blob = await resp.blob();
                                  const link = document.createElement("a");
                                  link.href = window.URL.createObjectURL(blob);
                                  link.download = `Factura_Proveedor_${viewingFactura.nro_factura_proveedor || viewingFactura.id_proveedor}.pdf`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  window.URL.revokeObjectURL(link.href);
                                } catch (err) {
                                  window.open(url, "_blank");
                                }
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors font-medium shadow-sm"
                          >
                             <Download size={18} />
                             Descargar Factura PDF
                          </button>
                        ) : (
                          <p className="text-base text-gray-500">Sin archivo adjunto</p>
                        )}
                      </div>
                    )}
                  </div>
                )}


                <div className="sm:col-span-2">
                  <p className="text-sm text-gray-500 mb-1">
                    Observaciones
                  </p>

                  {isEditandoFactura ? (
                    <textarea
                      rows={3}
                      value={
                        viewingFactura.observaciones ||
                        ""
                      }
                      onChange={(event) =>
                        setViewingFactura(
                          (prev) => ({
                            ...prev,

                            observaciones:
                              event.target.value,
                          })
                        )
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  ) : (
                    <p className="text-base text-gray-800">
                      {viewingFactura.observaciones ||
                        "—"}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-200">
                {isEditandoFactura ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditandoFactura(false);
                        setErrorForm("");
                      }}
                      disabled={guardando}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleSaveFacturaChanges
                      }
                      disabled={guardando}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {guardando
                        ? "Guardando..."
                        : "Guardar cambios"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const ventana = window.open("", "_blank");
                        if (ventana) {
                          ventana.document.write(`
                            <html>
                            <head>
                              <title>Comprobante de Proveedor</title>
                              <style>
                                body { font-family: Arial, sans-serif; padding: 32px; color: #111827; }
                                h1 { margin-bottom: 4px; color: #1e3a8a; }
                                p { margin: 8px 0; font-size: 14px; }
                                .box { border: 1px solid #d1d5db; padding: 20px; border-radius: 8px; margin-top: 20px; }
                                .total { margin-top: 20px; font-size: 18px; font-weight: bold; }
                              </style>
                            </head>
                            <body>
                              <h1>${viewingFactura.tipo_comprobante === 'remito' ? 'Remito' : 'Factura'} de Proveedor</h1>
                              <div class="box">
                                <p><strong>Proveedor:</strong> ${viewingFactura.proveedor}</p>
                                ${viewingFactura.tipo_comprobante !== 'remito' ? `<p><strong>Nro. Factura:</strong> ${viewingFactura.nro_factura_proveedor || '-'}</p>` : ''}
                                <p><strong>Fecha de Emisión:</strong> ${formatearFecha(viewingFactura.fecha_emision)}</p>
                                <p><strong>Vencimiento:</strong> ${formatearFecha(viewingFactura.vencimiento)}</p>
                                <p><strong>Estado:</strong> ${estadoConfig[viewingFactura.estado_pago]?.label || viewingFactura.estado_pago}</p>
                                <p><strong>Observaciones:</strong> ${viewingFactura.observaciones || '---'}</p>
                                <p class="total">Monto Total: $${formatearDinero(viewingFactura.precio_total)}</p>
                                <p class="total" style="color: #b91c1c;">Monto Adeudado: $${formatearDinero(viewingFactura.monto_adeudado)}</p>
                              </div>
                            </body>
                            </html>
                          `);
                          ventana.document.close();
                          ventana.focus();
                          setTimeout(() => ventana.print(), 250);
                        } else {
                          alert("Por favor, permite ventanas emergentes para imprimir.");
                        }
                      }}
                      className="px-4 py-2 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Printer size={16} />
                      Imprimir
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setIsEditandoFactura(true)
                      }
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit size={16} />
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(
                          viewingFactura.id_factura_proveedor
                        )
                      }
                      disabled={guardando}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
    </div>
  );
}