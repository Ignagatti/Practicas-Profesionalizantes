import { useEffect, useState } from 'react';
import { Search, Plus, Edit, Trash2, X } from "lucide-react";
import { 
    obtenerInsumos, 
    crearInsumo, 
    actualizarInsumo, 
    eliminarInsumo 
} from '../services/insumosService';

const INSUMO_VACIO = {
    nombre: '',
    categoria: '',
    precio_unitario: 0
};

function Insumos() {
    const [insumos, setInsumos] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [newInsumo, setNewInsumo] = useState(INSUMO_VACIO);

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

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await crearInsumo(newInsumo);
            setNewInsumo(INSUMO_VACIO);
            setShowAddModal(false);
            cargarInsumos();
        } catch (error) {
            alert(error.message);
        }
    };

    const filteredInsumos = insumos.filter(i => 
        i.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header AcuApp Style */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h2 className="text-2xl text-gray-800">Gestión de Insumos</h2>
                    <p className="text-gray-500 text-sm mt-1">{filteredInsumos.length} insumos registrados</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors"
                >
                    <Plus size={20} />
                    Agregar Insumo
                </button>
            </div>

            {/* Buscador */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o categoría..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Categoría</th>
                                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Precio Unit.</th>
                                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredInsumos.map((i) => (
                                <tr key={i.id_insumo} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{i.nombre}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{i.categoria || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${i.precio_unitario}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <button className="text-blue-600 hover:text-blue-800 p-2"><Edit size={16} /></button>
                                        <button 
                                            onClick={async () => { if(confirm('¿Borrar?')) { await eliminarInsumo(i.id_insumo); cargarInsumos(); }}}
                                            className="text-red-600 hover:text-red-800 p-2"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Agregar Insumo */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-xl text-gray-800">Agregar Nuevo Insumo</h3>
                            <button onClick={() => setShowAddModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAdd} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm mb-2 text-gray-700">Nombre *</label>
                                <input 
                                    type="text" required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    value={newInsumo.nombre}
                                    onChange={(e) => setNewInsumo({...newInsumo, nombre: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-2 text-gray-700">Precio Unitario *</label>
                                <input 
                                    type="number" step="0.01" required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    value={newInsumo.precio_unitario}
                                    onChange={(e) => setNewInsumo({...newInsumo, precio_unitario: e.target.value})}
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg">Cancelar</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Insumos;
