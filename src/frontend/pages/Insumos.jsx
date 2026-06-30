import { useEffect, useState } from 'react';
import { Search, Plus, Edit, Trash2, X, Percent } from "lucide-react";
import { 
    obtenerInsumos, 
    crearInsumo, 
    actualizarInsumo, 
    eliminarInsumo,
    ajustarPreciosPorcentaje
} from '../services/insumosService';

const CATEGORIAS = ['Modelo', 'Tela', 'Lustre'];

const INSUMO_VACIO = {
    nombre: '',
    categoria: '',
    precio_unitario: 0
};

function Insumos() {
    const [insumos, setInsumos] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filtroCategoria, setFiltroCategoria] = useState("todos");
    
    // Modales
    const [showFormModal, setShowFormModal] = useState(false);
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    
    // Estados de datos
    const [formData, setFormData] = useState(INSUMO_VACIO);
    const [porcentajeAjuste, setPorcentajeAjuste] = useState("");

    useEffect(() => {
        cargarInsumos();
    }, []);

    const cargarInsumos = async () => {
        try {
            const data = await obtenerInsumos();
            setInsumos(data);
        } catch (error) {
            console.error('Error al cargar insumos:', error);
        }
    };

    const handleOpenAdd = () => {
        setFormData(INSUMO_VACIO);
        setIsEditing(false);
        setShowFormModal(true);
    };

    const handleOpenEdit = (insumo) => {
        setFormData({
            id: insumo.id_insumo || insumo.Id_Insumo,
            nombre: insumo.nombre || insumo.Nombre,
            categoria: insumo.categoria || insumo.Categoria,
            precio_unitario: insumo.precio_unitario || insumo.Precio_Unitario
        });
        setIsEditing(true);
        setShowFormModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await actualizarInsumo(formData.id, formData);
            } else {
                await crearInsumo(formData);
            }
            setShowFormModal(false);
            cargarInsumos();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleEliminar = async (id) => {
        if (!confirm("¿Seguro quieres eliminar este insumo?")) return;
        try {
            await eliminarInsumo(id);
            cargarInsumos();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleAjustarPrecios = async () => {
        if (!porcentajeAjuste || porcentajeAjuste === 0) return;
        
        try {
            await ajustarPreciosPorcentaje(porcentajeAjuste, filtroCategoria);
            setPorcentajeAjuste("");
            setShowAdjustModal(false);
            cargarInsumos();
        } catch (error) {
            alert(error.message);
        }
    };

    const filteredInsumos = insumos.filter(i => {
        const nombre = (i.nombre || i.Nombre || "").toLowerCase();
        const categoria = (i.categoria || i.Categoria || "");
        const coincideBusqueda = nombre.includes(searchTerm.toLowerCase());
        const coincideCategoria = filtroCategoria === "todos" || categoria === filtroCategoria;
        return coincideBusqueda && coincideCategoria;
    });

    return (
        <div className="space-y-8 px-8 py-6">
            {/* Header Principal */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h2 className="text-2xl text-gray-800 font-bold tracking-tight">Lista de Precios</h2>
                    <p className="text-gray-500 text-sm mt-1">{filteredInsumos.length} insumos registrados</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowAdjustModal(true)}
                        className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-semibold text-sm"
                    >
                        <Percent size={18} /> Ajustar por %
                    </button>
                    <button 
                        onClick={handleOpenAdd}
                        className="flex items-center gap-2 bg-red-700 text-white px-5 py-2 rounded-lg hover:bg-red-800 transition-colors font-semibold text-sm"
                    >
                        <Plus size={20} /> Agregar Insumo
                    </button>
                </div>
            </div>

            {/* Barra de Filtros */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input 
                            type="text" placeholder="Buscar por nombre..." 
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select 
                        className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 outline-none focus:ring-2 focus:ring-red-500 shadow-sm"
                        value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}
                    >
                        <option value="todos">Todas las Categorías</option>
                        {CATEGORIAS.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* TABLA PRINCIPAL */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr className="text-xs text-gray-500 uppercase tracking-tight font-bold">
                                <th className="px-6 py-4">CATEGORÍA</th>
                                <th className="px-6 py-4">NOMBRE DEL INSUMO</th>
                                <th className="px-6 py-4">PRECIO UNITARIO</th>
                                <th className="px-6 py-4 text-right">ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredInsumos.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-10 text-center text-gray-400 italic">No se encontraron insumos.</td>
                                </tr>
                            ) : filteredInsumos.map((i) => (
                                <tr key={i.id_insumo || i.Id_Insumo} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium">
                                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                            {i.categoria || i.Categoria}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-800 font-bold">
                                        {i.nombre || i.Nombre}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-800 font-bold">
                                        $ {(Number(i.precio_unitario || i.Precio_Unitario) || 0).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button 
                                                onClick={() => handleOpenEdit(i)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleEliminar(i.id_insumo || i.Id_Insumo)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Borrar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL FORMULARIO INSUMO */}
            {showFormModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-[9999] p-6">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full animate-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-xl text-gray-800 font-bold">{isEditing ? 'Editar Insumo' : 'Nuevo Insumo'}</h3>
                            <button onClick={() => setShowFormModal(false)} className="p-2 hover:bg-gray-100 rounded-lg font-bold"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-4 text-left">
                                <div>
                                    <label className="block text-sm mb-1 text-gray-500 font-medium tracking-tight">Categoría *</label>
                                    <select 
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700 text-sm"
                                        required value={formData.categoria} onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div >
                                    <label className="block text-sm mb-1 text-gray-500 font-medium tracking-tight">Nombre del Insumo *</label>
                                    <input 
                                        type="text" required placeholder="Ej: Pana Gris Importada"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700 text-sm"
                                        value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                                    />
                                </div>
                                <div >
                                    <label className="block text-sm mb-1 text-gray-500 font-medium tracking-tight">Precio Unitario ($) *</label>
                                    <input 
                                        type="number" required step="0.01"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700 text-sm font-bold"
                                        value={formData.precio_unitario} onChange={(e) => setFormData({...formData, precio_unitario: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4 border-t border-gray-200">
                                <button type="button" onClick={() => setShowFormModal(false)} className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-bold">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors text-sm font-bold shadow-lg shadow-red-100">
                                    {isEditing ? 'Guardar Cambios' : 'Crear Insumo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL AJUSTE PORCENTAJE - CALCADO DE LA IMAGEN */}
            {showAdjustModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-[9999] p-6">
                    <div className="bg-white rounded-[25px] shadow-2xl max-w-lg w-full animate-in zoom-in duration-200">
                        <div className="p-8 space-y-6 text-left">
                            <h2 className="text-2xl font-bold text-gray-800">Ajuste de Precios por Porcentaje</h2>
                            
                            <p className="text-gray-500 text-[15px] leading-relaxed">
                                Ingrese el porcentaje de aumento o descuento. Use valores positivos para aumentos y negativos para descuentos. El ajuste se aplicará solo a los <span className="font-semibold text-gray-700">{filteredInsumos.length} insumo(s) visible(s)</span> según los filtros aplicados.
                            </p>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-800">Porcentaje (%)</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        placeholder="Ej: 15 o -10" 
                                        className="w-full h-14 pl-5 pr-12 bg-white border border-gray-200 rounded-2xl text-gray-700 text-lg outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all placeholder:text-gray-300"
                                        value={porcentajeAjuste}
                                        onChange={(e) => setPorcentajeAjuste(e.target.value)}
                                        autoFocus
                                    />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xl text-gray-300">%</span>
                                </div>
                                <p className="text-xs text-gray-400 pl-1">
                                    {filtroCategoria === 'todos' ? "Se aplicará a todos los insumos de la lista" : `Se aplicará solo a la categoría: ${filtroCategoria}`}
                                </p>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    onClick={() => setShowAdjustModal(false)}
                                    className="flex-1 h-14 border border-gray-200 rounded-2xl font-bold text-gray-800 hover:bg-gray-50 transition-all text-base"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleAjustarPrecios}
                                    className="flex-1 h-14 bg-[#9900ff] text-white font-bold rounded-2xl hover:bg-[#8800ee] shadow-lg shadow-purple-100 transition-all text-base"
                                >
                                    Aplicar Ajuste
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Insumos;
