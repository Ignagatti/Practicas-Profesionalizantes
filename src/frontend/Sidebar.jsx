import React from 'react';
import logoAcuaber from './assets/logo-acuaber.png';
import { 
    LayoutGrid, 
    Package, 
    ShoppingCart, 
    Wallet, 
    DollarSign, 
    List, 
    Users 
} from 'lucide-react';

const Sidebar = ({ seccionActual, setSeccion }) => {
    const menuItems = [
        { id: 'dashboard', nombre: 'Panel de control', icono: LayoutGrid },
        { id: 'productos', nombre: 'Productos', icono: Package },
        { id: 'pedidos', nombre: 'Pedidos', icono: ShoppingCart },
        { id: 'pagos', nombre: 'Pagos', icono: Wallet },
        { id: 'insumos', nombre: 'Lista de Precios', icono: List },
        { id: 'clientes', nombre: 'Clientes', icono: Users },
        { id: 'proveedores', nombre: 'Proveedores', icono: Users },
    ];

    return (
        <div className="w-64 min-h-screen bg-[#8b0000] text-white flex flex-col fixed left-0 top-0 border-r border-black">
            {/* Logo y Título */}
            <div className="p-6 bg-white border-b border-gray-200 flex flex-col items-center text-center shadow-sm">
                <img src={logoAcuaber} alt="Acuaber Logo" className="h-16 w-auto object-contain mb-3" />
                <p className="text-xs text-gray-700 font-medium">Sistema de Gestión</p>
                <p className="text-[10px] text-gray-500 mt-1">Esperanza, Santa Fe</p>
            </div>

            {/* Menú de Navegación */}
            <nav className="flex-1 px-4 py-6 space-y-2">
                {menuItems.map((item) => {
                    const Icono = item.icono;
                    const activo = seccionActual === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setSeccion(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                activo 
                                ? 'bg-red-600 shadow-lg text-white' 
                                : 'text-red-100 hover:bg-black/20'
                            }`}
                        >
                            <Icono size={20} />
                            <span className="text-sm font-medium">{item.nombre}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Footer del Sidebar */}
            <div className="p-6 text-[10px] text-red-300 border-t border-red-900">
                <p>Esperanza, Santa Fe</p>
                <p>© 2025 Acuaber</p>
            </div>
        </div>
    );
};

export default Sidebar;
