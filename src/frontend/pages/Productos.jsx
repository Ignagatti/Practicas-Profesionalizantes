import { useEffect, useState } from 'react';
import { Search, Plus, Edit, Trash2, Eye, X } from "lucide-react";
import { 
    obtenerProductos, 
    crearProducto, 
    actualizarProducto, 
    eliminarProducto 
} from '../services/productosService';

const PRODUCTO_VACIO = {
    modelo: '',
    tela: '',
    color_lustre: '',
    estado: 'pendiente',
    cantidad: 1,
    precio: 0
};

function Productos() {
    const [productos, setProductos] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedProducto, setSelectedProducto] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [newProducto, setNewProducto] = useState(PRODUCTO_VACIO);

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

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await crearProducto(newProducto);
            setNewProducto(PRODUCTO_VACIO);
            setShowAddModal(false);
            cargarProductos();
        } catch (error) {
            alert(error.message);
        }
    };

    const filteredProductos = productos.filter(p => 
        p.modelo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header igual al de Clientes */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h2 className="text-2xl text-gray-800">Gestión de Productos</h2>
                    <p className="text-gray-500 text-sm mt-1">{filteredProductos.length} productos registrados</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors"
                >
                    <Plus size={20} />
                    Agregar Producto
                </button>
            </div>

            {/* Buscador Estilo AcuApp */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por modelo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Tabla Estilo AcuApp */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Modelo</th>
                                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Tela</th>
                                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Precio</th>
                                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredProductos.map((p) => (
                                <tr key={p.id_producto} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.modelo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.tela || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${p.precio}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                                            {p.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <button className="text-blue-600 hover:text-blue-800 p-2" title="Editar"><Edit size={16} /></button>
                                        <button 
                                            onClick={async () => { if(confirm('¿Borrar?')) { await eliminarProducto(p.id_producto); cargarProductos(); }}}
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

            {/* Modal Agregar Producto (Igual al de Clientes) */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-xl text-gray-800">Agregar Nuevo Producto</h3>
                            <button onClick={() => setShowAddModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAdd} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm mb-2 text-gray-700">Modelo *</label>
                                    <input 
                                        type="text" required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                        value={newProducto.modelo}
                                        onChange={(e) => setNewProducto({...newProducto, modelo: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm mb-2 text-gray-700">Precio *</label>
                                    <input 
                                        type="number" required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                        value={newProducto.precio}
                                        onChange={(e) => setNewProducto({...newProducto, precio: e.target.value})}
                                    />
                                </div>
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

export default Productos;
