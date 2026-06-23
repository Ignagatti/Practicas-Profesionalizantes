import { useEffect, useState } from 'react';
import { Search, Plus, Edit, Trash2, Printer, Calendar, Filter, X, Eye, CheckCircle2 } from "lucide-react";
import { 
    obtenerProductos, 
    crearProducto, 
    actualizarProducto, 
    eliminarProducto 
} from '../services/productosService';
import { obtenerInsumos } from '../services/insumosService';

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
    const [listaPrecios, setListaPrecios] = useState([]);

    useEffect(() => {
        cargarProductos();
        cargarListaPrecios();
    }, []);

    const cargarListaPrecios = async () => {
        try {
            const data = await obtenerInsumos();
            setListaPrecios(data);
        } catch (error) {
            console.error('Error al cargar lista de precios:', error);
        }
    };

    const cargarProductos = async () => {
        try {
            const data = await obtenerProductos();
            setProductos(data);
        } catch (error) {
            console.error('Error al cargar:', error);
        }
    };

    const calcularPrecioTotal = (nuevoModelo, nuevoTipoTela, nuevoLustre) => {
        const pModelo = listaPrecios.find(lp => (lp.nombre || lp.Nombre) === nuevoModelo && (lp.categoria || lp.Categoria) === 'Modelo');
        const pTela = listaPrecios.find(lp => (lp.nombre || lp.Nombre) === nuevoTipoTela && (lp.categoria || lp.Categoria) === 'Tela');
        const pLustre = listaPrecios.find(lp => (lp.nombre || lp.Nombre) === nuevoLustre && (lp.categoria || lp.Categoria) === 'Lustre');

        const vModelo = Number(pModelo?.precio_unitario || pModelo?.Precio_Unitario || 0);
        const vTela = Number(pTela?.precio_unitario || pTela?.Precio_Unitario || 0);
        const vLustre = Number(pLustre?.precio_unitario || pLustre?.Precio_Unitario || 0);

        return vModelo + vTela + vLustre;
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
            tipo_tela: p.tipo_tela || p.Tipo_Tela || 'Sin tela',
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
                tipo_tela: formData.tipo_tela,
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
        if ((p.estado || p.Estado || "").toLowerCase() === 'en_produccion') {
            alert("No se puede eliminar un producto en producción.");
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

    const filteredProductos = productos.filter((p, idx) => {
        const term = searchTerm.toLowerCase();
        const coalesce = (val) => (val || "").toLowerCase();
        const match = coalesce(p.modelo || p.Modelo).includes(term) || 
                      coalesce(p.tela || p.Tela).includes(term) ||
                      coalesce(p.cliente).includes(term);
        
        const estadoMatch = filtroEstado === "todos" || coalesce(p.estado || p.Estado) === filtroEstado;
        return match && estadoMatch;
    });

    const handleEnviarAProduccion = async () => {
        if (seleccionados.length === 0) return;
        try {
            const promesas = seleccionados.map(id => {
                const p = productos.find(prod => (prod.id_producto || prod.Id_Producto) === id);
                return actualizarProducto(id, { ...p, estado: 'en_produccion' });
            });
            await Promise.all(promesas);
            setSeleccionados([]);
            setShowSelectionModal(false);
            cargarProductos();
        } catch (error) {
            alert(error.message);
        }
    };

    const pendientes = productos.filter(p => (p.estado || p.Estado || "").toLowerCase() === 'pendiente');

    return (
        <div className="space-y-8 px-8 py-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h2 className="text-2xl text-gray-800 font-bold">Gestión de Productos</h2>
                    <p className="text-gray-500 text-sm mt-1">{filteredProductos.length} productos registrados</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowSelectionModal(true)} className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 font-semibold shadow-sm text-sm"><Printer size={18} /> Imprimir Planilla</button>
                    <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-red-700 text-white px-5 py-2 rounded-lg hover:bg-red-800 font-semibold shadow-md text-sm"><Plus size={20} /> Agregar Producto</button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input type="text" placeholder="Buscar productos..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <select className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 outline-none focus:ring-2 focus:ring-red-500 shadow-sm" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                    <option value="todos">Todos los Estados</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="en_produccion">En Producción</option>
                    <option value="terminado">Terminado</option>
                </select>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr className="text-xs text-gray-500 uppercase tracking-tight font-bold">
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">CLIENTE</th>
                                <th className="px-6 py-4">MODELO</th>
                                <th className="px-6 py-4 text-center">CANT.</th>
                                <th className="px-6 py-4">TELA / TIPO</th>
                                <th className="px-6 py-4">LUSTRE</th>
                                <th className="px-6 py-4">ESTADO</th>
                                <th className="px-6 py-4 text-right">ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredProductos.map((p, idx) => (
                                <tr key={p.id_producto || p.Id_Producto} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-400 font-medium">#00{idx+1}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">{p.cliente || 'Mueblería Del Sur'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-800 font-bold">{p.modelo || p.Modelo}</td>
                                    <td className="px-6 py-4 text-sm text-gray-800 font-bold text-center">{p.cantidad || p.Cantidad}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-800 font-bold">{p.tela || p.Tela || '-'}</div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase">{p.tipo_tela || p.Tipo_Tela || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">{p.color_lustre || p.Color_Lustre || '-'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                            (p.estado || p.Estado || "").toLowerCase() === 'pendiente' ? 'bg-gray-100 text-gray-500' :
                                            (p.estado || p.Estado || "").toLowerCase() === 'en_produccion' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                        }`}>{ (p.estado || p.Estado || "pendiente").replace('_',' ') }</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => {setSelectedProducto(p); setShowDetailModal(true);}} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"><Eye size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showFormModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-[9999] p-6">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200 text-left">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-xl text-gray-800 font-bold">{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                            <button onClick={() => setShowFormModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Cliente *</label>
                                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700 text-sm">
                                        <option>Mueblería Del Sur</option>
                                        <option>Carpintería López</option>
                                    </select>
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Modelo *</label>
                                    <select required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700 text-sm" value={formData.modelo} onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData({...formData, modelo: val, precio: calcularPrecioTotal(val, formData.tipo_tela, formData.lustre)});
                                    }}>
                                        <option value="">Seleccionar...</option>
                                        {listaPrecios.filter(lp => lp.categoria === 'Modelo').map(lp => <option key={lp.id_insumo} value={lp.nombre}>{lp.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tipo de Tela *</label>
                                    <select required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700 text-sm" value={formData.tipo_tela} onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData({...formData, tipo_tela: val, precio: calcularPrecioTotal(formData.modelo, val, formData.lustre)});
                                    }}>
                                        <option value="Sin tela">Seleccionar tipo...</option>
                                        {listaPrecios.filter(lp => lp.categoria === 'Tela').map(lp => <option key={lp.id_insumo} value={lp.nombre}>{lp.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nombre de Tela (Estampado/Color)</label>
                                    <input type="text" placeholder="Ej: Pana Gris 04" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700 text-sm font-medium" value={formData.nombre_tela} onChange={(e) => setFormData({...formData, nombre_tela: e.target.value})} />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Lustre *</label>
                                    <select required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700 text-sm" value={formData.lustre} onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData({...formData, lustre: val, precio: calcularPrecioTotal(formData.modelo, formData.tipo_tela, val)});
                                    }}>
                                        <option value="Sin lustre">Sin lustre</option>
                                        {listaPrecios.filter(lp => lp.categoria === 'Lustre').map(lp => <option key={lp.id_insumo} value={lp.nombre}>{lp.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Cantidad</label>
                                    <input type="number" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700 text-sm" value={formData.cantidad} onChange={(e) => setFormData({...formData, cantidad: e.target.value})} />
                                </div>
                                <div className="col-span-2">
                                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex justify-between items-center shadow-inner">
                                        <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Suma de Insumos</span>
                                        <span className="text-xl font-black text-green-700">$ {Number(formData.precio).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4 border-t border-gray-200">
                                <button type="button" onClick={() => setShowFormModal(false)} className="flex-1 py-3 border border-gray-300 rounded-lg font-bold text-gray-500">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg shadow-blue-100">{isEditing ? 'Guardar Cambios' : 'Crear Producto'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDetailModal && selectedProducto && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-[9999] p-6 text-left">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-xl text-gray-800 font-bold">Detalle del Producto</h3>
                            <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-lg font-bold"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Modelo</p><p className="font-bold text-gray-800">{selectedProducto.modelo || selectedProducto.Modelo}</p></div>
                                <div><p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Cant.</p><p className="font-bold text-gray-800 text-lg">{selectedProducto.cantidad || selectedProducto.Cantidad}</p></div>
                                <div className="col-span-2"><p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Tela (Tipo - Nombre)</p><p className="text-gray-800 font-bold">{(selectedProducto.tipo_tela || selectedProducto.Tipo_Tela || 'Sin tipo')} - {(selectedProducto.tela || selectedProducto.Tela || 'Sin nombre')}</p></div>
                                <div><p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Lustre</p><p className="text-gray-800 font-medium">{selectedProducto.color_lustre || selectedProducto.Color_Lustre || '-'}</p></div>
                                <div className="col-span-2 bg-gray-50 p-3 rounded-lg border border-gray-100"><p className="text-[10px] text-gray-400 font-bold uppercase mb-1 text-center">Precio Total Insumos</p><p className="text-xl font-black text-gray-800 text-center">$ {Number(selectedProducto.precio || selectedProducto.Precio || 0).toLocaleString()}</p></div>
                            </div>
                            <div className="flex gap-4 pt-4 border-t border-gray-200">
                                <button onClick={() => handleOpenEdit(selectedProducto)} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 font-bold shadow-md"><Edit size={16} /> Editar</button>
                                <button onClick={() => handleEliminar(selectedProducto.id_producto || selectedProducto.Id_Producto)} className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={20} /></button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showSelectionModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-[9999] p-6">
                    <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div><h3 className="text-xl text-gray-800 font-bold">Seleccionar Productos para Producción</h3></div>
                            <button onClick={() => setShowSelectionModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={24} /></button>
                        </div>
                        <div className="p-6">
                            <div className="border border-gray-200 rounded-xl overflow-hidden mb-6 shadow-sm">
                                <table className="w-full text-left">
                                    <thead className="bg-[#f8f9fa] border-b border-gray-200"><tr className="text-[11px] font-bold text-gray-500 uppercase tracking-tight"><th className="px-6 py-4 w-12 text-center"></th><th className="px-4 py-4">CLIENTE</th><th className="px-4 py-4">MODELO</th><th className="px-4 py-4">CANT.</th><th className="px-4 py-4">TELA</th><th className="px-4 py-4">LUSTRE</th></tr></thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {pendientes.map(p => {
                                            const id = p.id_producto || p.Id_Producto;
                                            const isSelected = seleccionados.includes(id);
                                            return (
                                                <tr key={id} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50/20' : ''}`}><td className="px-6 py-4 text-center"><input type="checkbox" className="w-4 h-4" checked={isSelected} onChange={() => setSeleccionados(prev => isSelected ? prev.filter(sid => sid !== id) : [...prev, id])}/></td><td className="px-4 py-4 text-sm text-gray-600">{p.cliente}</td><td className="px-4 py-4 text-sm font-bold text-gray-800">{p.modelo || p.Modelo}</td><td className="px-4 py-4 text-sm text-gray-800 font-bold text-center">{p.cantidad}</td><td className="px-4 py-4 text-sm text-gray-400">{p.tela}</td><td className="px-4 py-4 text-sm text-gray-600">{p.color_lustre}</td></tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex justify-end gap-4"><button onClick={()=>setShowSelectionModal(false)} className="px-8 py-3 border border-gray-200 rounded-xl font-bold">Cancelar</button><button onClick={handleEnviarAProduccion} disabled={seleccionados.length === 0} className="px-8 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold">Imprimir y Producción</button></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Productos;
