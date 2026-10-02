import React from 'react';
import logoAcuaber from './assets/logo-acuaber.png';
import {
    LayoutGrid,
    Package,
    ShoppingCart,
    Wallet,
    List,
    Users,
    X
} from 'lucide-react';

const Sidebar = ({ seccionActual, setSeccion, isOpen = false, onClose = () => { } }) => {
    const menuItems = [
        { id: 'dashboard', nombre: 'Panel de control', icono: LayoutGrid },
        { id: 'productos', nombre: 'Productos', icono: Package },
        { id: 'pedidos', nombre: 'Pedidos', icono: ShoppingCart },
        { id: 'pagos', nombre: 'Pagos', icono: Wallet },
        { id: 'insumos', nombre: 'Lista de Precios', icono: List },
        { id: 'clientes', nombre: 'Clientes', icono: Users },
        { id: 'proveedores', nombre: 'Proveedores', icono: Users },
    ];

    const handleSelect = (id) => {
        setSeccion(id);
        onClose();
    };

    return (
        <>
            {/* Backdrop para pantallas pequeñas / ventanas no maximizadas */}
            {isOpen && (
                <div
                    onClick={onClose}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
                    aria-hidden="true"
                />
            )}

            <div
                className={`w-56 xl:w-64 min-h-screen bg-[#8b0000] text-white flex flex-col fixed left-0 top-0 border-r border-black z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    }`}
            >
                {/* Logo y Título */}
                <div className="p-4 sm:p-5 bg-white border-b border-gray-200 flex flex-col items-center text-center shadow-sm relative">
                    <button
                        onClick={onClose}
                        className="lg:hidden absolute top-2.5 right-2.5 p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Cerrar menú"
                    >
                        <X size={18} />
                    </button>
                    <img src={logoAcuaber} alt="Acuaber Logo" className="h-12 sm:h-14 w-auto object-contain mb-2" />
                    <p className="text-[11px] sm:text-xs text-gray-700 font-medium">Sistema de Gestión</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Esperanza, Santa Fe</p>
                </div>

                {/* Menú de Navegación */}
                <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
                    {menuItems.map((item) => {
                        const Icono = item.icono;
                        const activo = seccionActual === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleSelect(item.id)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-left ${activo
                                        ? 'bg-red-600 shadow-lg text-white'
                                        : 'text-red-100 hover:bg-black/20'
                                    }`}
                            >
                                <Icono size={18} />
                                <span className="text-xs sm:text-sm font-medium">{item.nombre}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Footer del Sidebar */}
                <div className="p-4 text-[10px] text-red-300 border-t border-red-900">
                    <p>Esperanza, Santa Fe</p>
                    <p>© 2026 Acuaber</p>
                </div>
            </div>
        </>
    );
};

export default Sidebar;

