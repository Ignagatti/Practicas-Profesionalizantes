import { useEffect, useState } from 'react';
import { Search, Plus, Edit, Trash2, Printer, Calendar, Filter, X, Eye, CheckCircle2 } from "lucide-react";
import { 
    obtenerProductos, 
    crearProducto, 
    actualizarProducto, 
    eliminarProducto 
} from '../services/productosService';

const PRODUCTO_VACIO = {
    modelo: '',
    nombre_tela: '',
    tipo_tela: 'Sin tela',
    lustre: 'Sin lustre',
    cantidad: 1,
    fecha_pedido: new Date().toISOString().split('T')[0],
    observaciones: '',
    precio: 0
};

function Productos() {
    const [productos, setProductos] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("todos");
    const [fechaDesde, setFechaDesde] = useState("");
    const [fechaHasta, setFechaHasta] = useState("");
    
    // Modales
    const [showAddModal, setShowAddModal] = useState(false);
    const [showSelectionModal, setShowSelectionModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    
    // Estados de datos
    const [selectedProducto, setSelectedProducto] = useState(null);
    const [newProducto, setNewProducto] = useState(PRODUCTO_VACIO);
    const [seleccionados, setSeleccionados] = useState([]);

    useEffect(() => {
        cargarProductos();
    }, []);

    const cargarProductos = async () => {
        try {
            const data = await obtenerProductos();
            setProductos(data);
        } catch (error) {
            console.error('Error al cargar:', error);
        }
    };

    const handleCrear = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newProducto,
                color_lustre: newProducto.lustre,
                tela: newProducto.nombre_tela,
                estado: 'pendiente'
            };
            await crearProducto(payload);
            setNewProducto(PRODUCTO_VACIO);
            setShowAddModal(false);
            cargarProductos();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleEliminar = async (id) => {
        if (!confirm("¿Seguro quieres eliminar este producto?")) return;
        try {
            await eliminarProducto(id);
            cargarProductos();
            setShowDetailModal(false);
        } catch (error) {
            alert(error.message);
        }
    };

    const toggleSeleccionarTodo = () => {
        const pendientes = productos.filter(p => (p.estado || p.Estado) === 'pendiente');
        if (seleccionados.length === pendientes.length) {
            setSeleccionados([]);
        } else {
            setSeleccionados(pendientes.map(p => p.id_producto || p.Id_Producto));
        }
    };

    const filteredProductos = productos.filter(p => {
        const modelo = p.modelo || p.Modelo || "";
        const porNombre = modelo.toLowerCase().includes(searchTerm.toLowerCase());
        const estado = (p.estado || p.Estado || "").toLowerCase();
        const porEstado = filtroEstado === "todos" || estado === filtroEstado;
        
        const fechaProd = new Date(p.fecha_pedido || p.Fecha_Pedido || new Date());
        const desde = fechaDesde ? new Date(fechaDesde) : null;
        const hasta = fechaHasta ? new Date(fechaHasta) : null;
        const porFecha = (!desde || fechaProd >= desde) && (!hasta || fechaProd <= hasta);

        return porNombre && porEstado && porFecha;
    });

    const pendientes = productos.filter(p => (p.estado || p.Estado || "").toLowerCase() === 'pendiente');

    return (
        <div className="space-y-6 text-gray-800">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">Gestión de Productos</h3>
                    <p className="text-sm text-gray-500">{productos.length} productos registrados</p>
                </div>
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="bg-[#b91c1c] text-white px-8 py-3 rounded-xl flex items-center gap-2 font-bold hover:bg-red-800 shadow-lg shadow-red-100 transition-all font-bold"
                >
                    <Plus size={20} />
                    Agregar Producto
                </button>
            </div>

            {/* BARRA DE FILTROS */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <div className="flex flex-col gap-4">
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input 
                                type="text" placeholder="Buscar productos..." 
                                className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select 
                            className="bg-white border border-gray-200 rounded-xl px-6 py-3 font-medium text-gray-700 outline-none"
                            value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
                        >
                            <option value="todos">Todos los Estados</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="en_produccion">En Producción</option>
                            <option value="terminado">Terminado</option>
                        </select>
                        <button 
                            onClick={() => setShowSelectionModal(true)}
                            className="bg-white border border-gray-200 px-6 py-3 rounded-xl flex items-center gap-2 font-bold text-gray-700 hover:bg-gray-100 transition-all shadow-sm"
                        >
                            <Printer size={20} />
                            Imprimir Planilla
                        </button>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-500">Desde:</span>
                            <input 
                                type="date" 
                                value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)}
                                className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-400 outline-none" 
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-500">Hasta:</span>
                            <input 
                                type="date" 
                                value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)}
                                className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-400 outline-none" 
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* TABLA PRINCIPAL */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <th className="px-6 py-4">Nº PRODUCTO</th>
                            <th className="px-6 py-4">CLIENTE</th>
                            <th className="px-6 py-4">MODELO</th>
                            <th className="px-6 py-4">CANTIDAD</th>
                            <th className="px-6 py-4">TELA</th>
                            <th className="px-6 py-4">LUSTRE</th>
                            <th className="px-6 py-4">FECHA</th>
                            <th className="px-6 py-4">ESTADO</th>
                            <th className="px-6 py-4">OBSERVACIONES</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredProductos.map((p, idx) => {
                            const id = p.id_producto || p.Id_Producto;
                            const estado = (p.estado || p.Estado || "").toLowerCase();
                            return (
                                <tr key={id} className="hover:bg-gray-50/80 transition-colors group">
                                    <td className="px-6 py-4 text-sm font-bold text-gray-400">PROD-00{idx+1}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">Mueblería Del Sur</td>
                                    <td className="px-6 py-4 text-sm text-gray-800 font-bold">{p.modelo || p.Modelo}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">{p.cantidad || p.Cantidad}</td>
                                    <td className="px-6 py-4 text-sm text-gray-400">{p.tela || p.Tela || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">{p.color_lustre || p.Color_Lustre || 'Natural'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{p.fecha_pedido ? new Date(p.fecha_pedido).toLocaleDateString() : '2026-04-10'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                                            estado === 'pendiente' ? 'bg-gray-100 text-gray-500' : 
                                            estado === 'en_produccion' ? 'bg-blue-50 text-blue-500' : 
                                            'bg-green-50 text-green-500'
                                        }`}>
                                            {estado.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-400">-</td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => {setSelectedProducto(p); setShowDetailModal(true);}}
                                            className="p-2 text-blue-500 bg-blue-50 rounded-full transition-all hover:bg-blue-100"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* MODAL 1: ALTA NUEVO PRODUCTO (COMPLETO) */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-y-auto max-h-[95vh] animate-in slide-in-from-bottom-4 duration-300">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="text-xl font-bold text-gray-800">Agregar Nuevo Producto</h3>
                            <button onClick={() => setShowAddModal(false)}><X size={24} className="text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleCrear} className="p-8 space-y-6">
                            {/* Cliente */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Cliente *</label>
                                <select className="w-full p-4 border border-gray-200 rounded-2xl bg-white outline-none focus:ring-2 focus:ring-red-500">
                                    <option>Seleccionar cliente</option>
                                    <option>Mueblería Del Sur</option>
                                    <option>Carpintería López</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                {/* Modelo */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Modelo * <span className="text-red-600">(Obligatorio)</span></label>
                                    <select 
                                        className="w-full p-4 border border-gray-200 rounded-2xl bg-white outline-none focus:ring-2 focus:ring-red-500"
                                        required onChange={(e) => setNewProducto({...newProducto, modelo: e.target.value})}
                                    >
                                        <option value="">Seleccionar modelo</option>
                                        <option value="Maitena">Maitena</option>
                                        <option value="Imperial">Imperial</option>
                                    </select>
                                </div>
                                {/* Nombre de Tela */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Nombre de Tela</label>
                                    <input 
                                        type="text" placeholder="Ej: Cuero negro, Tela beige..."
                                        className="w-full p-4 border border-gray-200 rounded-2xl bg-gray-50/50 outline-none" 
                                        onChange={(e) => setNewProducto({...newProducto, nombre_tela: e.target.value})} 
                                    />
                                </div>
                                {/* Tipo de Tela */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Tipo de Tela (Opcional)</label>
                                    <select 
                                        className="w-full p-4 border border-gray-200 rounded-2xl bg-white outline-none focus:ring-2 focus:ring-red-500"
                                        onChange={(e) => setNewProducto({...newProducto, tipo_tela: e.target.value})}
                                    >
                                        <option>Sin tela</option>
                                        <option>Chenille</option>
                                        <option>Pana</option>
                                    </select>
                                </div>
                                {/* Lustre */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Lustre/Acabado (Opcional)</label>
                                    <select 
                                        className="w-full p-4 border border-gray-200 rounded-2xl bg-white outline-none focus:ring-2 focus:ring-red-500"
                                        onChange={(e) => setNewProducto({...newProducto, lustre: e.target.value})}
                                    >
                                        <option>Sin lustre</option>
                                        <option>Natural</option>
                                        <option>Nogal</option>
                                    </select>
                                </div>
                                {/* Cantidad */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Cantidad *</label>
                                    <input 
                                        type="number" className="w-full p-4 border border-gray-200 rounded-2xl outline-none" 
                                        required min="1" value={newProducto.cantidad} onChange={(e) => setNewProducto({...newProducto, cantidad: e.target.value})} 
                                    />
                                </div>
                                {/* Fecha */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Fecha de Pedido *</label>
                                    <input 
                                        type="date" className="w-full p-4 border border-gray-200 rounded-2xl outline-none" 
                                        required value={newProducto.fecha_pedido} onChange={(e) => setNewProducto({...newProducto, fecha_pedido: e.target.value})} 
                                    />
                                </div>
                            </div>

                            {/* Precio Calculado */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Precio Unitario Calculado</label>
                                <div className="flex justify-between items-center p-4 bg-green-50 border border-green-100 rounded-2xl">
                                    <span className="text-2xl font-bold text-green-600">$ 0</span>
                                    <span className="text-[10px] font-bold text-green-800 uppercase tracking-widest">(Modelo + Tela + Lustre)</span>
                                </div>
                            </div>

                            {/* Observaciones */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Observaciones</label>
                                <textarea 
                                    placeholder="Notas adicionales sobre el producto..."
                                    className="w-full p-6 border border-gray-200 rounded-3xl min-h-[120px] outline-none focus:ring-2 focus:ring-red-500"
                                    onChange={(e) => setNewProducto({...newProducto, observaciones: e.target.value})}
                                ></textarea>
                            </div>

                            {/* Botones */}
                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button" onClick={() => setShowAddModal(false)} 
                                    className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-800 hover:bg-gray-50 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all font-bold"
                                >
                                    Agregar Producto
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: SELECCIÓN PARA PRODUCCIÓN */}
            {showSelectionModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Seleccionar Productos para Producción</h3>
                                <p className="text-sm text-gray-500 mt-1">Solo se muestran productos con estado "Pendiente"</p>
                            </div>
                            <button onClick={() => setShowSelectionModal(false)}><X className="text-gray-400" size={24} /></button>
                        </div>
                        <div className="p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <input 
                                    type="checkbox" className="w-5 h-5 rounded"
                                    checked={seleccionados.length === pendientes.length && pendientes.length > 0}
                                    onChange={toggleSeleccionarTodo}
                                />
                                <span className="text-sm font-bold text-blue-600">Seleccionar todos</span>
                            </div>
                            <div className="border border-gray-100 rounded-2xl overflow-hidden p-2">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50 border-b border-gray-100 uppercase text-[10px] text-gray-400 font-bold">
                                        <tr>
                                            <th className="px-6 py-3"></th>
                                            <th className="px-6 py-3">CLIENTE</th>
                                            <th className="px-6 py-3">MODELO</th>
                                            <th className="px-6 py-3">CANT.</th>
                                            <th className="px-6 py-3">LUSTRE</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {pendientes.map(p => (
                                            <tr key={p.id_producto || p.Id_Producto}>
                                                <td className="px-6 py-4">
                                                    <input 
                                                        type="checkbox" className="w-5 h-5 rounded"
                                                        checked={seleccionados.includes(p.id_producto || p.Id_Producto)}
                                                        onChange={() => setSeleccionados(prev => prev.includes(p.id_producto || p.Id_Producto) ? prev.filter(id => id !== (p.id_producto || p.Id_Producto)) : [...prev, (p.id_producto || p.Id_Producto)])}
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-700">{p.cliente || 'Mueblería Del Sur'}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-800">{p.modelo || p.Modelo}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-700">{p.cantidad || p.Cantidad}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 font-medium">{p.color_lustre || p.Color_Lustre || 'Natural'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex gap-4 mt-8">
                                <button onClick={() => setShowSelectionModal(false)} className="flex-1 py-4 border border-gray-200 rounded-xl font-bold uppercase text-gray-500">Cancelar</button>
                                <button className="flex-[2] py-4 bg-gray-200 text-gray-400 font-bold rounded-xl flex items-center justify-center gap-2">
                                    <Printer size={20} /> Imprimir y Enviar a Producción
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: DETALLE DEL PRODUCTO */}
            {showDetailModal && selectedProducto && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800">Detalle del Producto</h3>
                            <button onClick={() => setShowDetailModal(false)}><X className="text-gray-400" size={24} /></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-y-6">
                                <div>
                                    <p className="text-xs text-gray-400 font-medium mb-1">Nº Producto</p>
                                    <p className="text-base font-medium text-gray-800">PROD-001</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-medium mb-1">Cliente</p>
                                    <p className="text-base font-medium text-gray-800">{selectedProducto.cliente || 'Mueblería Del Sur'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-medium mb-1">Modelo</p>
                                    <p className="text-base font-medium text-gray-800">{selectedProducto.modelo || selectedProducto.Modelo}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-medium mb-1">Nombre de Tela</p>
                                    <p className="text-base font-medium text-gray-800">{selectedProducto.tela || selectedProducto.Tela || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-medium mb-1">Lustre/Acabado</p>
                                    <p className="text-base font-medium text-gray-800">{selectedProducto.color_lustre || selectedProducto.Color_Lustre || 'Natural'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-medium mb-1">Cantidad</p>
                                    <p className="text-base font-medium text-gray-800">{selectedProducto.cantidad || selectedProducto.Cantidad} unidades</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-medium mb-1">Precio Unitario</p>
                                    <p className="text-base font-bold text-green-600">$ {Number(selectedProducto.precio || selectedProducto.Precio || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-medium mb-1">Precio Total</p>
                                    <p className="text-base font-bold text-green-600">$ {(Number(selectedProducto.precio || selectedProducto.Precio || 0) * (selectedProducto.cantidad || selectedProducto.Cantidad)).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-medium mb-1">Fecha de Pedido</p>
                                    <p className="text-base font-medium text-gray-800">
                                        {selectedProducto.fecha_pedido ? new Date(selectedProducto.fecha_pedido).toLocaleDateString() : '2026-04-10'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-medium mb-1">Estado</p>
                                    <span className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-bold ${
                                        (selectedProducto.estado || selectedProducto.Estado || "").toLowerCase() === 'pendiente' ? 'bg-gray-100 text-gray-500' : 
                                        (selectedProducto.estado || selectedProducto.Estado || "").toLowerCase() === 'en_produccion' ? 'bg-blue-50 text-blue-500' : 
                                        'bg-green-50 text-green-500'
                                    }`}>
                                        {(selectedProducto.estado || selectedProducto.Estado || "").replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-6 border-t border-gray-50">
                                <button className="flex-[3] py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100">
                                    <Edit size={18} /> Editar Producto
                                </button>
                                <button 
                                    onClick={() => handleEliminar(selectedProducto.id_producto || selectedProducto.Id_Producto)}
                                    className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-100"
                                >
                                    <Trash2 size={18} /> Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Productos;
