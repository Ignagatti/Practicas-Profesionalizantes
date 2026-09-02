import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Printer, Calendar, Filter, X, Eye, CheckCircle2 } from "lucide-react";
import { 
    obtenerProductos, 
    crearProducto, 
    actualizarProducto, 
    eliminarProducto,
    terminarProductosMasivo
} from '../services/productosService';
import { obtenerInsumos } from '../services/insumosService';

const PRODUCTO_VACIO = {
    id_cliente: '',
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
    const [showTerminarModal, setShowTerminarModal] = useState(false);
    
    // Popup personalizado para alertas y confirmaciones
    const [confirmModal, setConfirmModal] = useState({ 
        show: false, 
        title: '', 
        message: '', 
        type: 'confirm', // 'confirm' o 'alert'
        color: 'red',    // 'red' o 'blue'
        onConfirm: null 
    });
    
    // Estados de datos
    const [selectedProducto, setSelectedProducto] = useState(null);
    const [formData, setFormData] = useState(PRODUCTO_VACIO);
    const [seleccionados, setSeleccionados] = useState([]); // Para impresión / mandar a producción
    const [seleccionadosTerminar, setSeleccionadosTerminar] = useState([]); // Para pasar a terminado
    const [listaPrecios, setListaPrecios] = useState([]);
    const [clientes, setClientes] = useState([]);

    useEffect(() => {
        cargarProductos();
        cargarListaPrecios();
        cargarClientes();
    }, []);

    const cargarClientes = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : 'http://localhost:4000/api';
            const res = await fetch(`${API_URL}/clientes`);
            const data = await res.json();
            const activos = data.filter(c => c.estado !== 'bloqueado');
            setClientes(activos);
        } catch (error) {
            console.error('Error al cargar clientes:', error);
        }
    };

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
        setSelectedProducto(null);
        setFormData(PRODUCTO_VACIO);
        setIsEditing(false);
        setShowFormModal(true);
    };

    const handleOpenDetail = (p) => {
        setSelectedProducto(p);
        setShowDetailModal(true);
    };

    const handleOpenEdit = (p) => {
        setSelectedProducto(p);
        setFormData({
            ...p,
            id_cliente: p.id_cliente || p.Id_Cliente || '',
            modelo: p.modelo || p.Modelo || '',
            nombre_tela: p.tela || p.Tela || '',
            tipo_tela: p.tipo_tela || p.Tipo_Tela || 'Sin tela',
            lustre: p.color_lustre || p.Color_Lustre || 'Sin lustre',
            cantidad: p.cantidad || p.Cantidad || 1,
            fecha_pedido: p.fecha_pedido || p.Fecha_Pedido ? new Date(p.fecha_pedido || p.Fecha_Pedido).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            observaciones: p.observaciones || p.Observaciones || '',
            precio: p.precio || p.Precio || 0,
            estado: p.estado || p.Estado || 'pendiente'
        });
        setIsEditing(true);
        setShowDetailModal(false);
        setShowFormModal(true);
    };

    const guardarCambios = async (payload) => {
        try {
            if (isEditing) {
                await actualizarProducto(formData.id_producto || formData.Id_Producto, payload);
            } else {
                await crearProducto(payload);
            }
            setShowFormModal(false);
            cargarProductos();
        } catch (error) {
            setConfirmModal({
                show: true,
                title: 'Error de servidor',
                message: error.message,
                type: 'alert',
                color: 'red',
                onConfirm: null
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            color_lustre: formData.lustre,
            tela: formData.nombre_tela,
            tipo_tela: formData.tipo_tela,
            estado: isEditing ? (formData.estado || formData.Estado) : 'pendiente'
        };

        // VALIDACIÓN: Si cambiamos el estado al editar, confirmar con el popup personalizado
        if (isEditing && selectedProducto) {
            const estadoOrig = (selectedProducto.estado || selectedProducto.Estado || 'pendiente').toLowerCase();
            const estadoNuev = (payload.estado || 'pendiente').toLowerCase();
            
            if (estadoOrig !== estadoNuev) {
                setConfirmModal({
                    show: true,
                    title: 'Confirmar Cambio de Estado',
                    message: `¿Estás seguro de que querés cambiar el estado de este producto de "${estadoOrig.replace('_',' ').toUpperCase()}" a "${estadoNuev.replace('_',' ').toUpperCase()}"?`,
                    type: 'confirm',
                    color: 'blue',
                    onConfirm: () => guardarCambios(payload)
                });
                return;
            }
        }

        // Si no hay cambio de estado o es un producto nuevo, guardar directamente
        guardarCambios(payload);
    };

    const handleEliminar = async (id) => {
        const p = productos.find(prod => (prod.id_producto || prod.Id_Producto) === id);
        
        if ((p.estado || p.Estado || "").toLowerCase() === 'en_produccion') {
            setConfirmModal({
                show: true,
                title: 'Eliminación bloqueada',
                message: 'No se puede eliminar un producto que ya está en producción en el taller.',
                type: 'alert',
                color: 'red',
                onConfirm: null
            });
            return;
        }

        setConfirmModal({
            show: true,
            title: 'Confirmar Eliminación',
            message: '¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.',
            type: 'confirm',
            color: 'red',
            onConfirm: async () => {
                try {
                    await eliminarProducto(id);
                    cargarProductos();
                    setShowDetailModal(false);
                    setShowFormModal(false);
                } catch (error) {
                    setConfirmModal({
                        show: true,
                        title: 'Error al eliminar',
                        message: error.message,
                        type: 'alert',
                        color: 'red',
                        onConfirm: null
                    });
                }
            }
        });
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
            // Recolectar datos para la impresión
            const productosAImprimir = seleccionados.map(id => 
                productos.find(prod => (prod.id_producto || prod.Id_Producto) === id)
            );
            
            // Generar HTML para imprimir
            const productosHTML = productosAImprimir.map(p => `
                <tr>
                    <td style="padding: 10px; border: 1px solid #ccc; text-align: center;">${p.cantidad || p.Cantidad}</td>
                    <td style="padding: 10px; border: 1px solid #ccc;">${p.cliente || 'Sin cliente'}</td>
                    <td style="padding: 10px; border: 1px solid #ccc;"><strong>${p.modelo || p.Modelo}</strong></td>
                    <td style="padding: 10px; border: 1px solid #ccc;">${p.tela || p.Tela || '-'} ${p.tipo_tela || p.Tipo_Tela ? `(${p.tipo_tela || p.Tipo_Tela})` : ''}</td>
                    <td style="padding: 10px; border: 1px solid #ccc;">${p.color_lustre || p.Color_Lustre || '-'}</td>
                </tr>
            `).join("");
            
            const ventana = window.open("", "_blank");
            if (ventana) {
                ventana.document.write(`
                    <html>
                    <head>
                        <title>Planilla de Producción</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
                            h2 { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                            table { width: 100%; border-collapse: collapse; }
                            th { background-color: #f5f5f5; padding: 12px; border: 1px solid #ccc; text-align: left; }
                            td { font-size: 14px; }
                            @media print { 
                                @page { margin: 1.5cm; }
                                body { padding: 0; }
                            }
                        </style>
                    </head>
                    <body>
                        <h2>Planilla de Producción - ${new Date().toLocaleDateString('es-AR')}</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 80px; text-align: center;">Cant.</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cliente</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Modelo</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tela</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Lustre</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${productosHTML}
                            </tbody>
                        </table>
                    </body>
                    </html>
                `);
                ventana.document.close();
                ventana.focus();
                
                // Esperar un momento para asegurar que carguen estilos
                setTimeout(() => {
                    ventana.print();
                    ventana.close();
                }, 250);
            } else {
                alert("Por favor, permite las ventanas emergentes (pop-ups) para imprimir la planilla.");
            }
            // Actualizar el estado en el backend
            const promesas = seleccionados.map(id => {
                const p = productos.find(prod => (prod.id_producto || prod.Id_Producto) === id);
                return actualizarProducto(id, { ...p, estado: 'en_produccion' });
            });
            await Promise.all(promesas);
            setSeleccionados([]);
            setShowSelectionModal(false);
            cargarProductos();
        } catch (error) {
            setConfirmModal({
                show: true,
                title: 'Error al mandar a producción',
                message: error.message,
                type: 'alert',
                color: 'red',
                onConfirm: null
            });
        }
    };

    const handlePasarATerminadosMasivo = async () => {
        if (seleccionadosTerminar.length === 0) return;
        try {
            await terminarProductosMasivo(seleccionadosTerminar);
            setSeleccionadosTerminar([]);
            setShowTerminarModal(false);
            cargarProductos();
        } catch (error) {
            setConfirmModal({
                show: true,
                title: 'Error al terminar productos',
                message: error.message,
                type: 'alert',
                color: 'red',
                onConfirm: null
            });
        }
    };

    const pendientes = productos.filter(p => (p.estado || p.Estado || "").toLowerCase() === 'pendiente');
    const enProduccion = productos.filter(p => (p.estado || p.Estado || "").toLowerCase() === 'en_produccion');

    // Listas auxiliares de nombres registrados para verificar históricos
    const modelosRegistrados = listaPrecios.filter(lp => lp.categoria === 'Modelo').map(lp => lp.nombre);
    const telasRegistradas = listaPrecios.filter(lp => lp.categoria === 'Tela').map(lp => lp.nombre);
    const lustresRegistrados = listaPrecios.filter(lp => lp.categoria === 'Lustre').map(lp => lp.nombre);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Gestión de Productos</h2>
                    <p className="text-gray-500 text-sm mt-1">{filteredProductos.length} productos registrados</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowSelectionModal(true)} className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 font-semibold shadow-sm text-sm"><Printer size={18} /> Imprimir Planilla</button>
                    <button onClick={() => setShowTerminarModal(true)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold shadow-md text-sm"><CheckCircle2 size={18} /> Terminar Productos</button>
                    <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-red-700 text-white px-5 py-2 rounded-lg hover:bg-red-800 font-semibold shadow-md text-sm"><Plus size={20} /> Agregar Producto</button>
                </div>
            </div>

            {/* Buscador y Filtros (Sin lupa) */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 flex gap-4">
                <div className="flex-1">
                    <input 
                        type="text" 
                        placeholder="Buscar productos..." 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                </div>
                <select className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 outline-none focus:ring-2 focus:ring-red-500 shadow-sm" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                    <option value="todos">Todos los Estados</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="en_produccion">En Producción</option>
                    <option value="terminado">Terminado</option>
                    <option value="enviado">Enviado</option>
                </select>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">CLIENTE</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">MODELO</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">CANT.</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">TELA / TIPO</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">LUSTRE</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ESTADO</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredProductos.map((p, idx) => (
                                <tr key={p.id_producto || p.Id_Producto} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-400 font-medium">#00{idx+1}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">{p.cliente || 'Sin cliente'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{p.modelo || p.Modelo}</td>
                                    <td className="px-6 py-4 text-sm text-gray-800 text-center">{p.cantidad || p.Cantidad}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-800 font-medium">{p.tela || p.Tela || '-'}</div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase">{p.tipo_tela || p.Tipo_Tela || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">{p.color_lustre || p.Color_Lustre || '-'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                            (p.estado || p.Estado || "").toLowerCase() === 'pendiente' ? 'bg-gray-100 text-gray-500' :
                                            (p.estado || p.Estado || "").toLowerCase() === 'en_produccion' ? 'bg-blue-100 text-blue-700' : 
                                            (p.estado || p.Estado || "").toLowerCase() === 'terminado' ? 'bg-green-100 text-green-700' : 
                                            (p.estado || p.Estado || "").toLowerCase() === 'enviado' ? 'bg-purple-100 text-purple-700' : 
                                            'bg-red-100 text-red-700'
                                        }`}>{ (p.estado || p.Estado || "pendiente").replace('_',' ') }</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleOpenDetail(p)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors" title="Visualizar detalles"><Eye size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL FORMULARIO */}
            {showFormModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 text-left border border-gray-100">
                        <div className="p-5 sm:p-6 border-b border-gray-200 bg-gray-50/80 flex items-center justify-between">
                            <h3 className="text-xl text-gray-800 font-bold">{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                            <button onClick={() => setShowFormModal(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 bg-white">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Estado Selector (SOLO EDICIÓN) */}
                                {isEditing && (
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Estado actual del Producto <span className="text-red-600 font-bold">*</span></label>
                                        <select 
                                            className="w-full px-4 py-2.5 border border-blue-300 bg-blue-50/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-bold text-blue-800"
                                            value={formData.estado} 
                                            onChange={(e) => setFormData({...formData, estado: e.target.value})}
                                        >
                                            <option value="pendiente">PENDIENTE</option>
                                            <option value="en_produccion">EN PRODUCCIÓN</option>
                                            <option value="terminado">TERMINADO</option>
                                            <option value="enviado">ENVIADO</option>
                                        </select>
                                    </div>
                                )}

                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Cliente <span className="text-red-600 font-bold">*</span></label>
                                    <select 
                                        required
                                        className="w-full px-3.5 py-1.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all"
                                        value={formData.id_cliente || ''}
                                        onChange={(e) => setFormData({...formData, id_cliente: e.target.value})}
                                    >
                                        <option value="">Seleccionar Cliente...</option>
                                        {clientes.map(c => {
                                             const nombre = (c.nombre || c.Nombre || "").trim();
                                             const apellido = (c.apellido || c.Apellido || "").trim();
                                             const contacto = `${nombre} ${apellido}`.trim();
                                             const razonSocial = (c.razon_social || c.Razon_Social || "").trim();
                                             const label = contacto || razonSocial || `Cliente #${c.id_cliente || c.Id_Cliente}`;
                                             return (
                                                 <option key={c.id_cliente || c.Id_Cliente} value={c.id_cliente || c.Id_Cliente}>
                                                     {label}
                                                 </option>
                                             );
                                         })}
                                    </select>
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Modelo <span className="text-red-600 font-bold">*</span></label>
                                    <select required className="w-full px-3.5 py-1.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all" value={formData.modelo} onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData({...formData, modelo: val, precio: calcularPrecioTotal(val, formData.tipo_tela, formData.lustre)});
                                    }}>
                                        <option value="">Seleccionar...</option>
                                        {formData.modelo && !modelosRegistrados.includes(formData.modelo) && (
                                            <option value={formData.modelo}>{formData.modelo} (No registrado)</option>
                                        )}
                                        {listaPrecios.filter(lp => lp.categoria === 'Modelo').map(lp => <option key={lp.id_insumo} value={lp.nombre}>{lp.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Tipo de Tela <span className="text-red-600 font-bold">*</span></label>
                                    <select required className="w-full px-3.5 py-1.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all" value={formData.tipo_tela} onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData({...formData, tipo_tela: val, precio: calcularPrecioTotal(formData.modelo, val, formData.lustre)});
                                    }}>
                                        <option value="Sin tela">Sin tela (o seleccionar...)</option>
                                        {formData.tipo_tela && formData.tipo_tela !== 'Sin tela' && !telasRegistradas.includes(formData.tipo_tela) && (
                                            <option value={formData.tipo_tela}>{formData.tipo_tela} (No registrado)</option>
                                        )}
                                        {listaPrecios.filter(lp => lp.categoria === 'Tela').map(lp => <option key={lp.id_insumo} value={lp.nombre}>{lp.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Nombre de Tela (Estampado/Color)</label>
                                    <input type="text" placeholder="Ej: Pana Gris 04" className="w-full px-3.5 py-1.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all" value={formData.nombre_tela} onChange={(e) => setFormData({...formData, nombre_tela: e.target.value})} />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Lustre <span className="text-red-600 font-bold">*</span></label>
                                    <select required className="w-full px-3.5 py-1.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all" value={formData.lustre} onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData({...formData, lustre: val, precio: calcularPrecioTotal(formData.modelo, formData.tipo_tela, val)});
                                    }}>
                                        <option value="Sin lustre">Sin lustre</option>
                                        {formData.lustre && formData.lustre !== 'Sin lustre' && !lustresRegistrados.includes(formData.lustre) && (
                                            <option value={formData.lustre}>{formData.lustre} (No registrado)</option>
                                        )}
                                        {listaPrecios.filter(lp => lp.categoria === 'Lustre').map(lp => <option key={lp.id_insumo} value={lp.nombre}>{lp.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Cantidad</label>
                                    <input type="number" required className="w-full px-3.5 py-1.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all" value={formData.cantidad} onChange={(e) => setFormData({...formData, cantidad: e.target.value})} />
                                </div>
                                <div className="col-span-2">
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex justify-between items-center shadow-inner">
                                        <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Costo Total</span>
                                        <span className="text-xl font-black text-green-700">$ {(Number(formData.precio) * Number(formData.cantidad || 1)).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-200 flex justify-end items-center gap-3 shrink-0 rounded-b-2xl -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 mt-3">
                                <button type="button" onClick={() => setShowFormModal(false)} className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors">Cancelar</button>
                                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm">
                                    {isEditing ? 'Guardar Cambios' : 'Crear Producto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DETALLE */}
            {showDetailModal && selectedProducto && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200 text-left border border-gray-100 overflow-hidden">
                        <div className="p-5 sm:p-6 border-b border-gray-200 bg-gray-50/80 flex items-center justify-between">
                            <h3 className="text-xl text-gray-800 font-bold">Detalle del Producto</h3>
                            <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-5 sm:p-6 space-y-4 bg-white">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><p className="text-xs text-gray-600 font-bold uppercase tracking-wider mb-1">Modelo</p><p className="font-bold text-gray-800">{selectedProducto.modelo || selectedProducto.Modelo}</p></div>
                                <div><p className="text-xs text-gray-600 font-bold uppercase tracking-wider mb-1">Cant.</p><p className="font-bold text-gray-800 text-lg">{selectedProducto.cantidad || selectedProducto.Cantidad}</p></div>
                                <div className="col-span-2"><p className="text-xs text-gray-600 font-bold uppercase tracking-wider mb-1">Tela (Tipo - Nombre)</p><p className="text-gray-800 font-bold">{(selectedProducto.tipo_tela || selectedProducto.Tipo_Tela || 'Sin tipo')} - {(selectedProducto.tela || selectedProducto.Tela || 'Sin nombre')}</p></div>
                                <div><p className="text-xs text-gray-600 font-bold uppercase tracking-wider mb-1">Lustre</p><p className="text-gray-800 font-medium">{selectedProducto.color_lustre || selectedProducto.Color_Lustre || '-'}</p></div>
                                <div className="col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-200"><p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1 text-center">Costo Total</p><p className="text-2xl font-black text-gray-800 text-center">$ {(Number(selectedProducto.precio || selectedProducto.Precio || 0) * Number(selectedProducto.cantidad || selectedProducto.Cantidad || 1)).toLocaleString()}</p></div>
                            </div>
                        </div>
                        <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-200 flex justify-end items-center gap-3 rounded-b-2xl">
                            <button onClick={() => handleOpenEdit(selectedProducto)} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"><Edit size={16} /> Editar</button>
                            <button onClick={() => handleEliminar(selectedProducto.id_producto || selectedProducto.Id_Producto)} className="px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-sm"><Trash2 size={16} /> Eliminar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL SELECCIÓN PARA IMPRESIÓN / PRODUCCIÓN */}
            {showSelectionModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
                        <div className="p-5 sm:p-6 border-b border-gray-200 bg-gray-50/80 flex items-center justify-between text-left">
                            <div><h3 className="text-xl text-gray-800 font-bold">Seleccionar Productos para Producción</h3></div>
                            <button onClick={() => setShowSelectionModal(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-white">
                            <div className="border border-gray-200 rounded-xl overflow-hidden mb-6 shadow-sm">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-[11px] font-bold tracking-wider">
                                        <tr>
                                            <th className="p-3 text-center w-12">
                                                <input 
                                                    type="checkbox" 
                                                    className="w-4 h-4 rounded border-gray-300 accent-red-700 cursor-pointer"
                                                    checked={seleccionados.length === pendientes.length && pendientes.length > 0}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSeleccionados(pendientes.map(p => p.id_producto || p.Id_Producto));
                                                        } else {
                                                            setSeleccionados([]);
                                                        }
                                                    }}
                                                />
                                            </th>
                                            <th className="p-3">CLIENTE</th>
                                            <th className="p-3">MODELO</th>
                                            <th className="p-3 text-center">CANT.</th>
                                            <th className="p-3">TELA</th>
                                            <th className="p-3">LUSTRE</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {pendientes.map(p => {
                                            const id = p.id_producto || p.Id_Producto;
                                            const isSelected = seleccionados.includes(id);
                                            return (
                                                <tr key={id} className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-red-50/20' : ''}`}><td className="p-3 text-center"><input type="checkbox" className="w-4 h-4 accent-red-700" checked={isSelected} onChange={() => setSeleccionados(prev => isSelected ? prev.filter(sid => sid !== id) : [...prev, id])} /></td><td className="p-3 text-sm text-gray-600">{p.cliente || 'Sin cliente'}</td><td className="p-3 text-sm font-semibold text-gray-900">{p.modelo || p.Modelo}</td><td className="p-3 text-sm text-gray-800 text-center font-bold">{p.cantidad || p.Cantidad}</td><td className="p-3 text-sm text-gray-500">{p.tela || p.Tela || '-'}</td><td className="p-3 text-sm text-gray-600">{p.color_lustre || p.Color_Lustre || 'Natural'}</td></tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-200 flex justify-end items-center gap-3 rounded-b-2xl">
                            <button onClick={() => setShowSelectionModal(false)} className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors">Cancelar</button>
                            <button onClick={handleEnviarAProduccion} disabled={seleccionados.length === 0} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-sm">Imprimir y Producción</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL SELECCIONAR PARA PASAR A TERMINADO */}
            {showTerminarModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
                        <div className="p-5 sm:p-6 border-b border-gray-200 bg-gray-50/80 flex items-center justify-between text-left">
                            <div>
                                <h3 className="text-xl text-gray-800 font-bold">Seleccionar Productos para Terminar</h3>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">Marcá los productos actualmente en taller para pasarlos a terminados</p>
                            </div>
                            <button onClick={() => setShowTerminarModal(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-white text-left">
                            <div className="border border-gray-200 rounded-xl overflow-hidden mb-6 shadow-sm">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-[11px] font-bold tracking-wider">
                                        <tr>
                                            <th className="p-3 text-center w-12">
                                                <input 
                                                    type="checkbox" 
                                                    className="w-4 h-4 rounded border-gray-300 accent-green-600 cursor-pointer"
                                                    checked={seleccionadosTerminar.length === enProduccion.length && enProduccion.length > 0}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSeleccionadosTerminar(enProduccion.map(p => p.id_producto || p.Id_Producto));
                                                        } else {
                                                            setSeleccionadosTerminar([]);
                                                        }
                                                    }}
                                                />
                                            </th>
                                            <th className="p-3">CLIENTE</th>
                                            <th className="p-3">MODELO</th>
                                            <th className="p-3 text-center">CANT.</th>
                                            <th className="p-3">TELA</th>
                                            <th className="p-3">LUSTRE</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {enProduccion.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="p-6 text-center text-sm font-medium text-gray-400">No hay productos en producción actualmente.</td>
                                            </tr>
                                        ) : (
                                            enProduccion.map(p => {
                                                const id = p.id_producto || p.Id_Producto;
                                                const isSelected = seleccionadosTerminar.includes(id);
                                                return (
                                                    <tr 
                                                        key={id} 
                                                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-green-50/30' : ''}`}
                                                        onClick={() => setSeleccionadosTerminar(prev => isSelected ? prev.filter(sid => sid !== id) : [...prev, id])}
                                                    >
                                                        <td className="p-3 text-center">
                                                            <input
                                                                type="checkbox"
                                                                className="w-4 h-4 accent-green-600 pointer-events-none"
                                                                checked={isSelected}
                                                                readOnly
                                                            />
                                                        </td>
                                                        <td className="p-3 text-sm text-gray-600">{p.cliente || 'Sin cliente'}</td>
                                                        <td className="p-3 text-sm font-semibold text-gray-900">{p.modelo || p.Modelo}</td>
                                                        <td className="p-3 text-sm text-gray-800 text-center font-bold">{p.cantidad || p.Cantidad}</td>
                                                        <td className="p-3 text-sm text-gray-500">{p.tela || p.Tela || '-'}</td>
                                                        <td className="p-3 text-sm text-gray-600">{p.color_lustre || p.Color_Lustre || 'Natural'}</td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-200 flex justify-end items-center gap-3 rounded-b-2xl">
                            <button onClick={() => setShowTerminarModal(false)} className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors">Cancelar</button>
                            <button
                                onClick={handlePasarATerminadosMasivo}
                                disabled={seleccionadosTerminar.length === 0}
                                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                Pasar a Terminado ({seleccionadosTerminar.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* POPUP DE CONFIRMACIÓN ALERTA */}
            {confirmModal.show && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-left border border-gray-100 animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{confirmModal.title}</h3>
                        <p className="text-sm text-gray-600 mb-6">{confirmModal.message}</p>
                        <div className="flex justify-end gap-3">
                            {confirmModal.type === 'confirm' ? (
                                <>
                                    <button 
                                        onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                                        className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if (confirmModal.onConfirm) confirmModal.onConfirm();
                                            setConfirmModal({ ...confirmModal, show: false });
                                        }}
                                        className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-sm ${
                                            confirmModal.color === 'red' ? 'bg-red-700 hover:bg-red-800' : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                    >
                                        Confirmar
                                    </button>
                                </>
                            ) : (
                                <button 
                                    onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                                    className="px-5 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-sm font-bold transition-colors"
                                >
                                    Entendido
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Productos;