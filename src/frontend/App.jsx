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
import { Precios } from "./pages/Precios.jsx";
import { Saldos } from "./pages/Saldos.jsx";
import { ToastProvider } from "./components/ui/ToastContext.jsx";
import { ConfirmProvider } from "./components/ui/ConfirmContext.jsx";
import { ErrorBoundary } from "./components/ui/ErrorBoundary.jsx";
import LicenciaModal from "./components/LicenciaModal.jsx";
import logoAcuaber from "./assets/logo-acuaber.png";
import { ShieldCheck, Loader2 } from "lucide-react";

const API_URL = "http://localhost:4000/api";

function App() {
  const [seccion, setSeccion] = useState("dashboard");
  const [pagosPendientes, setPagosPendientes] = useState([]);

  // Estados del Sistema de Licencia
  const [licenciaActiva, setLicenciaActiva] = useState(false);
  const [verificandoLicencia, setVerificandoLicencia] = useState(true);
  const [modalLicenciaAbierto, setModalLicenciaAbierto] = useState(false);
  const [errorLicencia, setErrorLicencia] = useState(null);
  const [titularLicencia, setTitularLicencia] = useState(localStorage.getItem('acuaber_license_titular') || null);

  // Comprobación inicial de la licencia con Neon
  useEffect(() => {
    async function verificarLicenciaInicial() {
      const clave = localStorage.getItem('acuaber_license_key');
      if (!clave) {
        setVerificandoLicencia(false);
        setModalLicenciaAbierto(true);
        return;
      }

      try {
        const resp = await fetch(`${API_URL}/licencia/verificar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clave })
        });

        const data = await resp.json();

        if (resp.ok && data.ok) {
          setLicenciaActiva(true);
          setTitularLicencia(data.titular);
          localStorage.setItem('acuaber_license_titular', data.titular);
        } else {
          setLicenciaActiva(false);
          setErrorLicencia(data.error || 'La licencia guardada fue revocada en Neon.');
          setModalLicenciaAbierto(true);
        }
      } catch (err) {
        console.error('Error comprobando licencia inicial:', err);
        setErrorLicencia('No se pudo verificar la licencia con la base de datos.');
        setModalLicenciaAbierto(true);
      } finally {
        setVerificandoLicencia(false);
      }
    }

    verificarLicenciaInicial();

    // Escuchar revocaciones en tiempo real disparadas por peticiones con error 403
    const handleRevocada = (event) => {
      setLicenciaActiva(false);
      setErrorLicencia(event.detail?.error || 'Tu clave de licencia ha sido revocada o desactivada.');
      setModalLicenciaAbierto(true);
    };

    window.addEventListener('acuaber:licencia_revocada', handleRevocada);
    return () => window.removeEventListener('acuaber:licencia_revocada', handleRevocada);
  }, []);

  useEffect(() => {
    if (!licenciaActiva) return;

    async function cargarPendientes() {
      try {
        const [respFacturas, respPedidos] = await Promise.all([
          fetch(`${API_URL}/facturasProveedor`),
          fetch(`${API_URL}/pedidos`)
        ]);
        
        let pendientesFacturas = [];
        if (respFacturas.ok) {
          const datos = await respFacturas.json();
          const listaFacturas = Array.isArray(datos) ? datos : datos.facturas || [];
          pendientesFacturas = listaFacturas
            .filter(f => Number(f.monto_adeudado || f.Monto_Adeudado) > 0)
            .map(f => {
              const idFactura = f.id_factura_proveedor || f.Id_Factura_Proveedor || f.id;
              const nro = f.nro_factura_proveedor || f.Nro_Factura_Proveedor || "S/N";
              const razonSocial = f.razon_social || f.Razon_Social || "";
              const nombreCompleto = f.nombre || f.Nombre ? `${f.nombre||f.Nombre} ${f.apellido||f.Apellido}`.trim() : "";
              const proveedorN = f.proveedor || razonSocial || nombreCompleto || "Proveedor Desconocido";
              return {
                id: `prov-${idFactura}`,
                tipo: "proveedor",
                nombre: proveedorN,
                fecha_vencimiento: (f.fecha_vencimiento || f.Fecha_Vencimiento || f.fecha_emision || "").split("T")[0],
                monto_adeudado: Number(f.monto_adeudado || f.Monto_Adeudado),
                concepto: `Factura N° ${nro}`
              };
            });
        }

        let pendientesPedidos = [];
        if (respPedidos.ok) {
          const datos = await respPedidos.json();
          const listaPedidos = Array.isArray(datos) ? datos : datos.pedidos || [];
          pendientesPedidos = listaPedidos
            .filter(p => Number(p.monto_adeudado || p.Monto_Adeudado) > 0)
            .map(p => {
              const idPedido = p.id_pedido || p.Id_Pedido || p.id;
              const razonSocial = p.razon_social || p.Razon_Social || "";
              const nombreCompleto = p.nombre || p.Nombre ? `${p.nombre||p.Nombre} ${p.apellido||p.Apellido}`.trim() : "";
              const clienteN = p.cliente || razonSocial || nombreCompleto || "Cliente Desconocido";
              return {
                id: `cli-${idPedido}`,
                tipo: "cliente",
                nombre: clienteN,
                fecha_vencimiento: p.vencimiento || p.Vencimiento ? (p.vencimiento || p.Vencimiento).split("T")[0] : "—",
                monto_adeudado: Number(p.monto_adeudado || p.Monto_Adeudado),
                concepto: `Pedido N° ${idPedido}`
              };
            });
        }
          
        setPagosPendientes([...pendientesFacturas, ...pendientesPedidos]);
      } catch (err) {
        console.error("Error al cargar pendientes:", err);
      }
    }
    
    cargarPendientes();
  }, [licenciaActiva]);

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
      pedidos: "Gestión de Pedidos",
      precios: "Historial de Precios",
      saldos: "Control de Saldos",
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

      case "precios":
        return <Precios />;

      case "saldos":
        return <Saldos />;

      default:
        return <Dashboard pagosPendientes={pagosPendientes} />;
    }
  };

  if (verificandoLicencia) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800">
        <div className="w-20 h-20 bg-white rounded-2xl shadow-xl p-3 flex items-center justify-center mb-5 animate-pulse border border-gray-100">
          <img src={logoAcuaber} alt="Acuaber" className="max-h-full max-w-full object-contain" />
        </div>
        <div className="flex items-center gap-2.5 text-[#8b0000] font-semibold text-sm mb-1.5">
          <Loader2 className="animate-spin" size={20} />
          <span>Validando licencia con Neon Cloud...</span>
        </div>
        <p className="text-xs text-gray-400">Sistema de Gestión Acuaber</p>
      </div>
    );
  }

  // Si no hay licencia activa, bloquear toda la vista y mostrar únicamente el modal de activación
  if (!licenciaActiva) {
    return (
      <LicenciaModal
        abierto={true}
        esBloqueante={true}
        titularActual={titularLicencia}
        errorInicial={errorLicencia}
        alActivar={(datos) => {
          setLicenciaActiva(true);
          setModalLicenciaAbierto(false);
          setTitularLicencia(datos.titular);
          setErrorLicencia(null);
        }}
      />
    );
  }

  return (
    <ErrorBoundary onReset={() => setSeccion("dashboard")}>
      <ToastProvider>
        <ConfirmProvider>
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
                  {/* Badge de Licencia de Software con opción de ver / cambiar clave */}
                  <button
                    onClick={() => setModalLicenciaAbierto(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-full text-xs font-medium transition-all shadow-sm cursor-pointer"
                    title="Licencia de Software Activa - Clic para cambiar clave"
                  >
                    <ShieldCheck size={15} className="text-emerald-600" />
                    <span className="font-semibold">{titularLicencia || "Licencia Activa"}</span>
                  </button>

                  {/* Botón de Campana de Notificaciones global */}
                  <button
                    onClick={handleBellClick}
                    className="relative p-1.5 text-gray-500 hover:text-red-750 transition-colors focus:outline-none rounded-full hover:bg-gray-200 flex items-center justify-center"
                    title="Avisos de pagos pendientes"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                <ErrorBoundary onReset={() => setSeccion("dashboard")}>
                  {renderContenido()}
                </ErrorBoundary>
              </div>
            </main>
          </div>

          {/* Modal para ver o cambiar la clave desde el sistema */}
          <LicenciaModal
            abierto={modalLicenciaAbierto}
            esBloqueante={!licenciaActiva}
            titularActual={titularLicencia}
            errorInicial={errorLicencia}
            onCerrar={() => setModalLicenciaAbierto(false)}
            alActivar={(datos) => {
              setLicenciaActiva(true);
              setModalLicenciaAbierto(false);
              setTitularLicencia(datos.titular);
              setErrorLicencia(null);
            }}
          />
        </ConfirmProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;