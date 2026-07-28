import { useState, useEffect } from "react";
import Sidebar from "./Sidebar.jsx";
import Productos from "./pages/Productos.jsx";
import Insumos from "./pages/Insumos.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Clientes } from "./pages/Clientes.jsx";
import { Proveedores } from "./pages/Proveedores.jsx";
import { Movimientos } from "./pages/Movimientos.jsx";
import Pagos from "./pages/Pagos.jsx";
import { Pedidos } from "./pages/Pedidos.jsx";
import { Facturas } from "./pages/Facturas.jsx";
import { Precios } from "./pages/Precios.jsx";
import { Saldos } from "./pages/Saldos.jsx";

const API_URL = "http://localhost:4000/api";

function App() {
  const [seccion, setSeccion] = useState("dashboard");
  const [pagosPendientes, setPagosPendientes] = useState([]);

  useEffect(() => {
    async function cargarPendientes() {
      try {
        const respuesta = await fetch(`${API_URL}/facturasProveedor`);
        if (!respuesta.ok) return;
        
        const datos = await respuesta.json();
        const listaFacturas = Array.isArray(datos) ? datos : datos.facturas || [];
        
        const pendientes = listaFacturas
          .filter(f => Number(f.monto_adeudado || f.Monto_Adeudado) > 0)
          .map(f => {
            const idFactura = f.id_factura_proveedor || f.Id_Factura_Proveedor || f.id;
            const nro = f.nro_factura_proveedor || f.Nro_Factura_Proveedor || "S/N";
            
            const razonSocial = f.razon_social || f.Razon_Social || "";
            const nombreCompleto = f.nombre || f.Nombre ? `${f.nombre||f.Nombre} ${f.apellido||f.Apellido}`.trim() : "";
            const proveedorN = f.proveedor || razonSocial || nombreCompleto || "Proveedor Desconocido";
            
            return {
              id: idFactura,
              tipo: "proveedor",
              nombre: proveedorN,
              fecha_vencimiento: (f.fecha_vencimiento || f.Fecha_Vencimiento || f.fecha_emision || "").split("T")[0],
              monto_adeudado: Number(f.monto_adeudado || f.Monto_Adeudado),
              concepto: `Factura N° ${nro}`
            };
          });
          
        setPagosPendientes(pendientes);
      } catch (err) {
        console.error("Error al cargar facturas pendientes:", err);
      }
    }
    
    cargarPendientes();
  }, []);

  const handleBellClick = (e) => {
    e.preventDefault();
    if (seccion !== "dashboard") {
      setSeccion("dashboard");
      sessionStorage.setItem("scroll_to_payments", "true");
    } else {
      const target = document.getElementById("section-pagos-pendientes");
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const obtenerTituloSeccion = () => {
    const titulos = {
      dashboard: "Dashboard",
      productos: "Productos",
      insumos: "Insumos",
      clientes: "Clientes",
      proveedores: "Proveedores",
      movimientos: "Historial de movimientos",
      pagos: "Gestión de Pagos",
    };

    return titulos[seccion] || "Dashboard";
  };

  const renderContenido = () => {
    switch (seccion) {
      case "dashboard":
        return <Dashboard pagosPendientes={pagosPendientes} />;

      case "productos":
        return <Productos />;

      case "insumos":
        return <Insumos />;

      case "clientes":
        return <Clientes />;

      case "proveedores":
        return <Proveedores />;

      case "movimientos":
        return <Movimientos />;

      case "pagos":
        return <Pagos />;

      case "pedidos":
        return <Pedidos />;

      case "facturas":
        return <Facturas />;

      case "precios":
        return <Precios />;

      case "saldos":
        return <Saldos />;

      default:
        return <Dashboard pagosPendientes={pagosPendientes} />;
    }
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar
        seccionActual={seccion}
        setSeccion={setSeccion}
      />

      <main className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {obtenerTituloSeccion()}
            </h2>
            <p className="text-sm text-gray-500">
              Gestión Administrativa - Fabricación de Sillas y Sillones
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Botón de Campana de Notificaciones global */}
            <button
              onClick={handleBellClick}
              className="relative p-1.5 text-gray-500 hover:text-red-750 transition-colors focus:outline-none rounded-full hover:bg-gray-200 flex items-center justify-center"
              title="Avisos de pagos pendientes"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
              </svg>
              {pagosPendientes.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                  {pagosPendientes.length}
                </span>
              )}
            </button>

            <div className="h-6 w-px bg-gray-300"></div>

            <div className="w-10 h-10 bg-red-700 rounded-full flex items-center justify-center text-white font-bold">
              A
            </div>

            <div className="text-right">
              <p className="text-sm font-bold text-gray-800 leading-none">
                Administración
              </p>
              <p className="text-xs text-gray-500">
                Acuaber
              </p>
            </div>
          </div>
        </header>

        <div className="animate-in fade-in duration-500">
          {renderContenido()}
        </div>
      </main>
    </div>
  );
}

export default App;