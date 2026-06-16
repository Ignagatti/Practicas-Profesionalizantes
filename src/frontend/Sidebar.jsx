import React from 'react';
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
        { id: 'insumos', nombre: 'Insumos', icono: DollarSign }, // Usamos insumos aquí como ejemplo
        { id: 'precios', nombre: 'Lista de Precios', icono: List },
        { id: 'clientes', nombre: 'Clientes/Proveedores', icono: Users },
    ];

    return (
        <div className="w-64 min-h-screen bg-[#8b0000] text-white flex flex-col fixed left-0 top-0">
            {/* Logo y Título */}
            <div className="p-6 border-b border-red-900">
                <h1 className="text-2xl font-bold">AcuApp</h1>
                <p className="text-xs text-red-200">Sistema de Gestión</p>
                <p className="text-[10px] text-red-300 mt-1">Acuaber - Esperanza, Santa Fe</p>
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
