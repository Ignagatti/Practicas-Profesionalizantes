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
    const [showFormModal, setShowFormModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showSelectionModal, setShowSelectionModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    
    // Estados de datos
    const [selectedProducto, setSelectedProducto] = useState(null);
    const [formData, setFormData] = useState(PRODUCTO_VACIO);
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

    const handleOpenAdd = () => {
        setFormData(PRODUCTO_VACIO);
        setIsEditing(false);
        setShowFormModal(true);
    };

    const handleOpenEdit = (p) => {
        setFormData({
            ...p,
            modelo: p.modelo || p.Modelo || '',
            nombre_tela: p.tela || p.Tela || '',
            tipo_tela: p.tipo_tela || 'Sin tela',
            lustre: p.color_lustre || p.Color_Lustre || 'Sin lustre',
            cantidad: p.cantidad || p.Cantidad || 1,
            fecha_pedido: p.fecha_pedido || p.Fecha_Pedido ? new Date(p.fecha_pedido || p.Fecha_Pedido).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            observaciones: p.observaciones || p.Observaciones || '',
            precio: p.precio || p.Precio || 0
        });
        setIsEditing(true);
        setShowDetailModal(false);
        setShowFormModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                color_lustre: formData.lustre,
                tela: formData.nombre_tela,
                // Si es nuevo, estado pendiente, si es edición, mantenemos el que tenga
                estado: isEditing ? (formData.estado || formData.Estado) : 'pendiente'
            };

            if (isEditing) {
                await actualizarProducto(formData.id_producto || formData.Id_Producto, payload);
            } else {
                await crearProducto(payload);
            }
            
            setShowFormModal(false);
            cargarProductos();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleEliminar = async (id) => {
        const p = productos.find(prod => (prod.id_producto || prod.Id_Producto) === id);
        const estado = (p.estado || p.Estado || "").toLowerCase();

        if (estado === 'en_produccion') {
            alert("No se puede eliminar un producto que ya ha sido enviado a producción.");
            return;
        }

        if (!confirm("¿Seguro quieres eliminar este producto?")) return;
        try {
            await eliminarProducto(id);
            cargarProductos();
            setShowDetailModal(false);
        } catch (error) {
            alert(error.message);
        }
    };

    const handleEnviarAProduccion = async () => {
        if (seleccionados.length === 0) return;
        try {
            const promesas = seleccionados.map(id => {
                const p = productos.find(prod => (prod.id_producto || prod.Id_Producto) === id);
                return actualizarProducto(id, { 
                    ...p, 
                    estado: 'en_produccion',
                    color_lustre: p.color_lustre || p.Color_Lustre,
                    tela: p.tela || p.Tela,
                    modelo: p.modelo || p.Modelo,
                    cantidad: p.cantidad || p.Cantidad,
                    precio: p.precio || p.Precio,
                    fecha_pedido: p.fecha_pedido || p.Fecha_Pedido,
                    observaciones: p.observaciones || p.Observaciones
                });
            });
            await Promise.all(promesas);
            setSeleccionados([]);
            setShowSelectionModal(false);
            cargarProductos();
        } catch (error) {
            alert("Error al actualizar estados: " + error.message);
        }
    };

    const filteredProductos = productos.filter((p, idx) => {
        const term = searchTerm.toLowerCase();
        const idStr = `PROD-00${idx + 1}`.toLowerCase();
        const clienteStr = (p.cliente || "Mueblería Del Sur").toLowerCase();
        const modeloStr = (p.modelo || p.Modelo || "").toLowerCase();
        const telaStr = (p.tela || p.Tela || "").toLowerCase();
        const lustreStr = (p.color_lustre || p.Color_Lustre || "").toLowerCase();
        const obsStr = (p.observaciones || p.Observaciones || "").toLowerCase();

        const coincideBusqueda = 
            idStr.includes(term) || clienteStr.includes(term) || modeloStr.includes(term) || 
            telaStr.includes(term) || lustreStr.includes(term) || obsStr.includes(term);

        const estado = (p.estado || p.Estado || "").toLowerCase();
        const coincideEstado = filtroEstado === "todos" || estado === filtroEstado;
        
        const fechaProd = new Date(p.fecha_pedido || p.Fecha_Pedido || new Date());
        const desde = fechaDesde ? new Date(fechaDesde) : null;
        const hasta = fechaHasta ? new Date(fechaHasta) : null;
        const coincideFecha = (!desde || fechaProd >= desde) && (!hasta || fechaProd <= hasta);

        return coincideBusqueda && coincideEstado && coincideFecha;
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
                    onClick={handleOpenAdd}
                    className="bg-[#b91c1c] text-white px-8 py-3 rounded-xl flex items-center gap-2 font-bold hover:bg-red-800 shadow-lg shadow-red-100 transition-all"
                >
                    <Plus size={20} /> Agregar Producto
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
                                className="w-full pl-20 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
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
                            <Printer size={20} /> Imprimir Planilla
                        </button>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-500">Desde:</span>
                            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-400 outline-none" />
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-500">Hasta:</span>
                            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-400 outline-none" />
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
                                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">{p.cliente || 'Mueblería Del Sur'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-800 font-bold">{p.modelo || p.Modelo}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">{p.cantidad || p.Cantidad}</td>
                                    <td className="px-6 py-4 text-sm text-gray-400">{p.tela || p.Tela || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">{p.color_lustre || p.Color_Lustre || 'Natural'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{p.fecha_pedido ? new Date(p.fecha_pedido).toLocaleDateString() : '2026-04-10'}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                                            estado === 'pendiente' ? 'bg-gray-100 text-gray-500' : 
                                            estado === 'en_produccion' ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-500'
                                        }`}>
                                            {estado.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-400 truncate max-w-[150px]">
                                        {p.observaciones || p.Observaciones || '-'}
                                    </td>
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

            {/* MODAL FORMULARIO (MANTIENE DISEÑO PREMIUM) */}
            {showFormModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-y-auto max-h-[95vh] animate-in slide-in-from-bottom-4 duration-300">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="text-xl font-bold text-gray-800">{isEditing ? 'Editar Producto' : 'Agregar Nuevo Producto'}</h3>
                            <button onClick={() => setShowFormModal(false)}><X size={24} className="text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            {/* Cliente */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Cliente *</label>
                                <select className="w-full p-4 border border-gray-200 rounded-2xl bg-white outline-none focus:ring-2 focus:ring-red-500 transition-all">
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
                                        required value={formData.modelo} onChange={(e) => setFormData({...formData, modelo: e.target.value})}
                                    >
                                        <option value="">Seleccionar modelo</option>
                                        <option value="Maitena">Maitena</option>
                                        <option value="Imperial">Imperial</option>
                                        <option value="Windsor">Windsor</option>
                                    </select>
                                </div>
                                {/* Nombre de Tela */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Nombre de Tela</label>
                                    <input 
                                        type="text" placeholder="Ej: Cuero negro, Tela beige..."
                                        className="w-full p-4 border border-gray-200 rounded-2xl bg-gray-50/50 outline-none"
                                        value={formData.nombre_tela} onChange={(e) => setFormData({...formData, nombre_tela: e.target.value})}
                                    />
                                </div>
                                {/* Tipo de Tela */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Tipo de Tela (Opcional)</label>
                                    <select 
                                        className="w-full p-4 border border-gray-200 rounded-2xl bg-white outline-none focus:ring-2 focus:ring-red-500"
                                        value={formData.tipo_tela} onChange={(e) => setFormData({...formData, tipo_tela: e.target.value})}
                                    >
                                        <option value="Sin tela">Sin tela</option>
                                        <option value="Chenille">Chenille</option>
                                        <option value="Pana">Pana</option>
                                    </select>
                                </div>
                                {/* Lustre */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Lustre/Acabado (Opcional)</label>
                                    <select 
                                        className="w-full p-4 border border-gray-200 rounded-2xl bg-white outline-none focus:ring-2 focus:ring-red-500"
                                        value={formData.lustre} onChange={(e) => setFormData({...formData, lustre: e.target.value})}
                                    >
                                        <option value="Sin lustre">Sin lustre</option>
                                        <option value="Natural">Natural</option>
                                        <option value="Nogal">Nogal</option>
                                    </select>
                                </div>
                                {/* Cantidad */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Cantidad *</label>
                                    <input 
                                        type="number" required className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500"
                                        value={formData.cantidad} onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
                                    />
                                </div>
                                {/* Fecha */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Fecha de Pedido *</label>
                                    <input 
                                        type="date" required className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500"
                                        value={formData.fecha_pedido} onChange={(e) => setFormData({...formData, fecha_pedido: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* Precio Calculado */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Precio Unitario Calculado</label>
                                <div className="flex justify-between items-center p-4 bg-green-50 border border-green-100 rounded-2xl">
                                    <span className="text-2xl font-bold text-green-600">$ {Number(formData.precio).toLocaleString()}</span>
                                    <span className="text-[10px] font-bold text-green-800 uppercase tracking-widest">(Modelo + Tela + Lustre)</span>
                                </div>
                            </div>

                            {/* Observaciones */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Observaciones</label>
                                <textarea 
                                    placeholder="Notas adicionales..."
                                    className="w-full p-6 border border-gray-200 rounded-3xl min-h-[120px] outline-none focus:ring-2 focus:ring-red-500"
                                    value={formData.observaciones} onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                                ></textarea>
                            </div>

                            {/* Botones Finales */}
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowFormModal(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-800 hover:bg-gray-50 transition-all">Cancelar</button>
                                <button type="submit" className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all">
                                    {isEditing ? 'Guardar Cambios' : 'Agregar Producto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DETALLE (PERFECTO) */}
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
                                    <p className="text-xs text-gray-400 font-medium mb-1">Modelo</p>
                                    <p className="text-base font-medium text-gray-800">{selectedProducto.modelo || selectedProducto.Modelo}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-medium mb-1">Nombre de Tela</p>
                                    <p className="text-base font-medium text-gray-800">{selectedProducto.tela || selectedProducto.Tela || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-medium mb-1">Lustre/Acabado</p>
                                    <p className="text-base font-medium text-gray-800">{selectedProducto.color_lustre || selectedProducto.Color_Lustre || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-medium mb-1">Cantidad</p>
                                    <p className="text-base font-medium text-gray-800">{selectedProducto.cantidad || selectedProducto.Cantidad} unidades</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-medium mb-1">Estado</p>
                                    <span className="bg-blue-50 text-blue-500 px-4 py-1 rounded-full text-[10px] font-bold uppercase">
                                        {(selectedProducto.estado || selectedProducto.Estado || "").replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-gray-50 mt-4">
                                <p className="text-xs text-gray-400 font-medium mb-1">Observaciones</p>
                                <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl min-h-[60px] whitespace-pre-wrap italic">
                                    {selectedProducto.observaciones || selectedProducto.Observaciones || 'Sin observaciones.'}
                                </p>
                            </div>
                            <div className="flex gap-4 pt-6 border-t border-gray-50">
                                <button onClick={() => handleOpenEdit(selectedProducto)} className="flex-[3] py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100">
                                    <Edit size={18} /> Editar Producto
                                </button>
                                <button onClick={() => handleEliminar(selectedProducto.id_producto || selectedProducto.Id_Producto)} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold flex items-center justify-center">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL SELECCIÓN PRODUCCIÓN */}
            {showSelectionModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Enviar a Producción</h3>
                                <p className="text-sm text-gray-500 mt-1">Solo se muestran productos pendientes</p>
                            </div>
                            <button onClick={() => setShowSelectionModal(false)}><X size={24} /></button>
                        </div>
                        <div className="p-8">
                            <div className="border border-gray-100 rounded-2xl overflow-hidden mb-8">
                                <table className="w-full text-left font-bold text-gray-700">
                                    <thead className="bg-gray-50/50 text-[10px] text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-3 w-10"></th>
                                            <th className="px-6 py-3">MODELO</th>
                                            <th className="px-6 py-3">CANT.</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 font-medium">
                                        {pendientes.map(p => (
                                            <tr key={p.id_producto || p.Id_Producto}>
                                                <td className="px-6 py-4">
                                                    <input 
                                                        type="checkbox" className="w-5 h-5 rounded border-gray-300"
                                                        checked={seleccionados.includes(p.id_producto || p.Id_Producto)}
                                                        onChange={() => setSeleccionados(prev => prev.includes(p.id_producto || p.Id_Producto) ? prev.filter(id => id !== (p.id_producto || p.Id_Producto)) : [...prev, (p.id_producto || p.Id_Producto)])}
                                                    />
                                                </td>
                                                <td className="px-6 py-4">{p.modelo || p.Modelo}</td>
                                                <td className="px-6 py-4">{p.cantidad || p.Cantidad}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <button onClick={handleEnviarAProduccion} disabled={seleccionados.length === 0} className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${seleccionados.length > 0 ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                                <Printer size={20} /> Generar Planilla y Enviar a Producción ({seleccionados.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Productos;
