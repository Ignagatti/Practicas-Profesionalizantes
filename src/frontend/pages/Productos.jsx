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

    const handleSelectAll = (checked) => {
        if (checked) {
            setSeleccionados(pendientes.map(p => p.id_producto || p.Id_Producto));
        } else {
            setSeleccionados([]);
        }
    };

    return (
        <div className="space-y-6 text-gray-800">
            {/* Header Principal */}
            <div className="flex justify-between items-start mb-4 px-2">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 uppercase tracking-tight">Gestión de Productos</h3>
                    <p className="text-xs text-gray-500">{productos.length} productos registrados</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowSelectionModal(true)}
                        className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-lg flex items-center gap-2 font-bold hover:bg-gray-50 transition-all text-sm shadow-sm"
                    >
                        <Printer size={18} /> Imprimir Planilla
                    </button>
                    <button 
                        onClick={handleOpenAdd}
                        className="bg-[#b91c1c] text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-bold hover:bg-red-800 shadow-lg shadow-red-100 transition-all text-sm"
                    >
                        <Plus size={18} /> Agregar Producto
                    </button>
                </div>
            </div>

            {/* Barra de Filtros */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mx-2 space-y-4">
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="text" placeholder="Buscar por ID, modelo, tela, cliente..." 
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm transition-all"
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select 
                        className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-red-500"
                        value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
                    >
                        <option value="todos">Todos los Estados</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="en_produccion">En Producción</option>
                        <option value="terminado">Terminado</option>
                    </select>
                </div>
                <div className="flex items-center gap-6 px-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-gray-400 uppercase">Desde:</span>
                        <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 outline-none focus:ring-1 focus:ring-red-400" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-gray-400 uppercase">Hasta:</span>
                        <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 outline-none focus:ring-1 focus:ring-red-400" />
                    </div>
                </div>
            </div>

            {/* TABLA PRINCIPAL DE LA PÁGINA */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mx-2">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50">
                        <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                            <th className="px-5 py-4">ID</th>
                            <th className="px-5 py-4">CLIENTE</th>
                            <th className="px-5 py-4">MODELO</th>
                            <th className="px-5 py-4">CANT.</th>
                            <th className="px-5 py-4">TELA</th>
                            <th className="px-5 py-4">LUSTRE</th>
                            <th className="px-5 py-4">ESTADO</th>
                            <th className="px-5 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredProductos.map((p, idx) => {
                            const id = p.id_producto || p.Id_Producto;
                            const estado = (p.estado || p.Estado || "").toLowerCase();
                            return (
                                <tr key={id} className="hover:bg-gray-50/80 transition-colors">
                                    <td className="px-5 py-3 text-[11px] font-bold text-gray-400">#00{idx+1}</td>
                                    <td className="px-5 py-3 text-sm text-gray-500 font-medium">{p.cliente || 'Mueblería Del Sur'}</td>
                                    <td className="px-5 py-3 text-sm text-gray-800 font-bold">{p.modelo || p.Modelo}</td>
                                    <td className="px-5 py-3 text-sm text-gray-700 font-medium">{p.cantidad || p.Cantidad}</td>
                                    <td className="px-5 py-3 text-sm text-gray-400 truncate max-w-[100px]">{p.tela || p.Tela || '-'}</td>
                                    <td className="px-5 py-3 text-sm text-gray-700">{p.color_lustre || p.Color_Lustre || '-'}</td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold ${
                                            estado === 'pendiente' ? 'bg-gray-100 text-gray-500' : 
                                            estado === 'en_produccion' ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-500'
                                        }`}>
                                            {estado.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <button 
                                            onClick={() => {setSelectedProducto(p); setShowDetailModal(true);}}
                                            className="p-1.5 text-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all border border-blue-100"
                                        >
                                            <Eye size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* MODAL FORMULARIO */}
            {showFormModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-y-auto max-h-[92vh] animate-in zoom-in duration-200">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                            <h3 className="text-lg font-bold text-gray-800">{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                            <button onClick={() => setShowFormModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-all"><X size={20} className="text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Cliente *</label>
                                    <select className="w-full p-2.5 border border-gray-200 rounded-xl bg-white text-sm outline-none focus:ring-2 focus:ring-red-500">
                                        <option>Mueblería Del Sur</option>
                                        <option>Carpintería López</option>
                                    </select>
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Modelo *</label>
                                    <select 
                                        className="w-full p-2.5 border border-gray-200 rounded-xl bg-white text-sm outline-none focus:ring-2 focus:ring-red-500"
                                        required value={formData.modelo} onChange={(e) => setFormData({...formData, modelo: e.target.value})}
                                    >
                                        <option value="">Seleccionar...</option>
                                        <option value="Maitena">Maitena</option>
                                        <option value="Imperial">Imperial</option>
                                        <option value="Windsor">Windsor</option>
                                    </select>
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Nombre Tela</label>
                                    <input 
                                        type="text" placeholder="Ej: Pana Gris"
                                        className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500"
                                        value={formData.nombre_tela} onChange={(e) => setFormData({...formData, nombre_tela: e.target.value})}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Tipo Tela</label>
                                    <select 
                                        className="w-full p-2.5 border border-gray-200 rounded-xl bg-white text-sm outline-none focus:ring-2 focus:ring-red-500"
                                        value={formData.tipo_tela} onChange={(e) => setFormData({...formData, tipo_tela: e.target.value})}
                                    >
                                        <option value="Sin tela">Sin tela</option>
                                        <option value="Chenille">Chenille</option>
                                        <option value="Pana">Pana</option>
                                    </select>
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Lustre</label>
                                    <select 
                                        className="w-full p-2.5 border border-gray-200 rounded-xl bg-white text-sm outline-none focus:ring-2 focus:ring-red-500"
                                        value={formData.lustre} onChange={(e) => setFormData({...formData, lustre: e.target.value})}
                                    >
                                        <option value="Sin lustre">Sin lustre</option>
                                        <option value="Natural">Natural</option>
                                        <option value="Nogal">Nogal</option>
                                    </select>
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Cantidad</label>
                                    <input 
                                        type="number" required className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500"
                                        value={formData.cantidad} onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Fecha</label>
                                    <input 
                                        type="date" required className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500"
                                        value={formData.fecha_pedido} onChange={(e) => setFormData({...formData, fecha_pedido: e.target.value})}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <div className="p-3 bg-green-50 border border-green-100 rounded-xl flex justify-between items-center text-sm">
                                        <span className="text-[10px] font-bold text-green-600 uppercase">Precio Unitario Est.</span>
                                        <span className="font-bold text-green-700">$ {Number(formData.precio).toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Observaciones</label>
                                    <textarea 
                                        placeholder="Notas para producción..."
                                        className="w-full p-3 border border-gray-200 rounded-xl min-h-[60px] text-sm outline-none focus:ring-2 focus:ring-red-500"
                                        value={formData.observaciones} onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                                    ></textarea>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-gray-50">
                                <button type="button" onClick={() => setShowFormModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 text-sm">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg text-sm">
                                    {isEditing ? 'Guardar Cambios' : 'Crear Producto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DETALLE */}
            {showDetailModal && selectedProducto && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800">Detalle del Producto</h3>
                            <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="text-gray-400" size={20} /></button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Modelo</p>
                                    <p className="text-sm font-bold text-gray-800">{selectedProducto.modelo || selectedProducto.Modelo}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Estado Actual</p>
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-bold ${
                                        (selectedProducto.estado || selectedProducto.Estado || "").toLowerCase() === 'pendiente' ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-500'
                                    }`}>
                                        {(selectedProducto.estado || selectedProducto.Estado || "").replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Configuración de Tela</p>
                                    <p className="text-sm text-gray-700 font-medium">{selectedProducto.tela || selectedProducto.Tela || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Lustre / Madera</p>
                                    <p className="text-sm text-gray-700 font-medium">{selectedProducto.color_lustre || selectedProducto.Color_Lustre || '-'}</p>
                                </div>
                                <div className="col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Notas Especiales</p>
                                    <p className="text-xs text-gray-600 whitespace-pre-wrap italic leading-relaxed">
                                        {selectedProducto.observaciones || selectedProducto.Observaciones || 'Sin especificaciones adicionales.'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button onClick={() => handleOpenEdit(selectedProducto)} className="flex-[3] py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 text-sm shadow-md hover:bg-blue-700 transition-all">
                                    <Edit size={16} /> Editar Producto
                                </button>
                                <button onClick={() => handleEliminar(selectedProducto.id_producto || selectedProducto.Id_Producto)} className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold flex items-center justify-center hover:bg-red-100 transition-all">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL SELECCIÓN PRODUCCIÓN (REPLICANDO DISEÑO IMAGEN) */}
            {showSelectionModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in duration-200">
                        {/* Cabecera diseño imagen */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Seleccionar Productos para Producción</h3>
                                <p className="text-sm text-gray-500 mt-0.5">Solo se muestran productos con estado "Pendiente"</p>
                            </div>
                            <button onClick={() => setShowSelectionModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={24} /></button>
                        </div>

                        <div className="p-6">
                            {/* Checkbox seleccionar todos */}
                            <div className="flex items-center gap-2 mb-4 px-1">
                                <input 
                                    type="checkbox" 
                                    id="selectAll"
                                    className="w-4 h-4 rounded border-gray-300 accent-blue-600"
                                    checked={seleccionados.length === pendientes.length && pendientes.length > 0}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                />
                                <label htmlFor="selectAll" className="text-sm font-medium text-blue-600 cursor-pointer">Seleccionar todos</label>
                            </div>

                            {/* Tabla diseño imagen */}
                            <div className="border border-gray-100 rounded-xl overflow-hidden mb-6">
                                <table className="w-full text-left">
                                    <thead className="bg-[#f8f9fa] border-b border-gray-100">
                                        <tr className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                                            <th className="px-6 py-4 w-12 text-center"></th>
                                            <th className="px-4 py-4">CLIENTE</th>
                                            <th className="px-4 py-4">MODELO</th>
                                            <th className="px-4 py-4">CANT.</th>
                                            <th className="px-4 py-4">TELA</th>
                                            <th className="px-4 py-4">LUSTRE</th>
                                            <th className="px-4 py-4">OBSERVACIONES</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {pendientes.length === 0 ? (
                                            <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-400 italic">No hay productos pendientes para fabricar</td></tr>
                                        ) : pendientes.map(p => {
                                            const id = p.id_producto || p.Id_Producto;
                                            const isSelected = seleccionados.includes(id);
                                            return (
                                                <tr key={id} className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50/20' : ''}`}>
                                                    <td className="px-6 py-4 text-center">
                                                        <input 
                                                            type="checkbox" 
                                                            className="w-4 h-4 rounded border-gray-300 accent-[#4b5563]"
                                                            checked={isSelected}
                                                            onChange={() => setSeleccionados(prev => isSelected ? prev.filter(sid => sid !== id) : [...prev, id])}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-600">{p.cliente || 'Diseño Interior SA'}</td>
                                                    <td className="px-4 py-4 text-sm font-medium text-gray-800">{p.modelo || p.Modelo}</td>
                                                    <td className="px-4 py-4 text-sm text-gray-600">{p.cantidad || p.Cantidad}</td>
                                                    <td className="px-4 py-4 text-sm text-gray-400">{p.tela || p.Tela || '-'}</td>
                                                    <td className="px-4 py-4 text-sm text-gray-600">{p.color_lustre || p.Color_Lustre || '-'}</td>
                                                    <td className="px-4 py-4 text-sm text-gray-400 italic">{p.observaciones || p.Observaciones || '-'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer diseño imagen */}
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
                                <p className="text-sm text-gray-500">
                                    <span className="font-medium text-gray-800">{seleccionados.length}</span> producto(s) seleccionado(s) de <span className="font-medium text-gray-800">{pendientes.length}</span>
                                </p>
                                <div className="flex gap-4 w-full sm:w-auto">
                                    <button 
                                        onClick={() => setShowSelectionModal(false)}
                                        className="flex-1 sm:px-12 py-3.5 border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        onClick={handleEnviarAProduccion}
                                        disabled={seleccionados.length === 0}
                                        className={`flex-1 sm:px-12 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                                            seleccionados.length > 0 
                                            ? 'bg-[#d1d5db] text-gray-700 hover:bg-gray-300' 
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        <Printer size={20} /> Imprimir y Enviar a Producción
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Productos;
