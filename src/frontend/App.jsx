import { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import Productos from './pages/Productos.jsx';
import Insumos from './pages/Insumos.jsx';
import { Dashboard } from './Dashboard.jsx';
import { Clientes } from './pages/Clientes.jsx';
import { Proveedores } from './pages/Proveedores.jsx';

function App() {
    const [seccion, setSeccion] = useState('dashboard');
    const [pagosPendientes, setPagosPendientes] = useState([
        { id: 1, tipo: 'cliente', nombre: 'Mueblería Del Sur', fecha_vencimiento: '2026-05-05', monto_adeudado: 127000, concepto: 'Saldo de pedido muebles' },
        { id: 2, tipo: 'proveedor', nombre: 'Maderería Guatambú SA', fecha_vencimiento: '2026-04-30', monto_adeudado: 85000, concepto: 'Maderas para fábrica' },
        { id: 3, tipo: 'cliente', nombre: 'Diseño Interior SA', fecha_vencimiento: '2026-05-10', monto_adeudado: 88800, concepto: 'Proyecto remodelación' },
        { id: 4, tipo: 'proveedor', nombre: 'Textiles Premium SRL', fecha_vencimiento: '2026-05-02', monto_adeudado: 45000, concepto: 'Rollos de pana gris' }
    ]);

    const handleBellClick = (e) => {
        e.preventDefault();
        if (seccion !== 'dashboard') {
            setSeccion('dashboard');
            sessionStorage.setItem('scroll_to_payments', 'true');
        } else {
            const target = document.getElementById('section-pagos-pendientes');
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    const renderContenido = () => {
        switch (seccion) {
            case 'dashboard':
                return <Dashboard pagosPendientes={pagosPendientes} />;

            case 'productos':
                return <Productos />;

            case 'insumos':
                return <Insumos />;

            case 'clientes':
                return <Clientes />;

            case 'proveedores':
                return <Proveedores />;

            default:
                return <Dashboard pagosPendientes={pagosPendientes} />;
        }
    };

    return (
        <div className="flex bg-gray-100 min-h-screen">
            <Sidebar seccionActual={seccion} setSeccion={setSeccion} />

            <main className="flex-1 ml-64 p-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 capitalize">
                            {seccion === 'dashboard' ? 'Panel de control' : seccion}
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
                            <p className="text-xs text-gray-500">Acuaber</p>
                        </div>
                    </div>
                </header>

                {/* Zona de renderizado de páginas */}
                <div className="animate-in fade-in duration-500">
                    {renderContenido()}
                </div>
            </main>
        </div>
    );
}

export default App;