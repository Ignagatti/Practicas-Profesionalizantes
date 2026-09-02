import { useState } from "react";
import {
  Search,
  Plus,
  Trash2,
  Percent,
  Edit2,
  DollarSign,
  X,
} from "lucide-react";

// Datos iniciales de ejemplo — reemplazá esto con tu fuente de datos real
// o conectá al contexto: const { insumos, setInsumos } = useAppContext();
const INSUMOS_INICIALES = [
  { id: 1, categoria: "Modelo", nombre: "Silla Moderna", precioUnitario: 15000 },
  { id: 2, categoria: "Tela", nombre: "Tela Premium", precioUnitario: 8000 },
  { id: 3, categoria: "Lustre", nombre: "Lustre Natural", precioUnitario: 3500 },
];

const CATEGORIA_COLORS = {
  Modelo: "bg-red-100 text-red-700",
  Tela: "bg-pink-100 text-pink-700",
  Lustre: "bg-rose-100 text-rose-700",
};

export function Precios() {
  // Si usás AppContext, reemplazá estas dos líneas por:
  // const { insumos, setInsumos } = useAppContext();
  const [insumos, setInsumos] = useState(INSUMOS_INICIALES);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("todas");
  const [showAjusteModal, setShowAjusteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [porcentaje, setPorcentaje] = useState("");
  const [editingInsumo, setEditingInsumo] = useState(null);
  const [newInsumo, setNewInsumo] = useState({
    categoria: "Modelo",
    nombre: "",
    precioUnitario: 0,
  });

  // ── Filtrado ──────────────────────────────────────────────
  const filteredInsumos = insumos.filter((insumo) => {
    const matchesSearch =
      insumo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      insumo.categoria.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategoria =
      filterCategoria === "todas" || insumo.categoria === filterCategoria;

    return matchesSearch && matchesCategoria;
  });

  // ── Conteos por categoría ─────────────────────────────────
  const conteosPorCategoria = {
    Modelo: insumos.filter((i) => i.categoria === "Modelo").length,
    Tela: insumos.filter((i) => i.categoria === "Tela").length,
    Lustre: insumos.filter((i) => i.categoria === "Lustre").length,
  };

  // ── Handlers ──────────────────────────────────────────────
  const handleAjustePorcentaje = () => {
    const porcentajeNum = parseFloat(porcentaje);
    if (isNaN(porcentajeNum)) {
      alert("Por favor ingrese un porcentaje válido");
      return;
    }

    const idsVisibles = new Set(filteredInsumos.map((i) => i.id));

    setInsumos((prev) =>
      prev.map((insumo) => {
        if (idsVisibles.has(insumo.id)) {
          return {
            ...insumo,
            precioUnitario: Math.round(
              insumo.precioUnitario * (1 + porcentajeNum / 100)
            ),
          };
        }
        return insumo;
      })
    );

    alert(
      `Ajuste del ${porcentaje}% aplicado a ${filteredInsumos.length} insumo(s) visible(s)`
    );
    setShowAjusteModal(false);
    setPorcentaje("");
  };

  const handleAddInsumo = (e) => {
    e.preventDefault();
    const newId =
      insumos.length > 0 ? Math.max(...insumos.map((i) => i.id)) + 1 : 1;
    setInsumos([...insumos, { ...newInsumo, id: newId }]);
    setShowAddModal(false);
    setNewInsumo({ categoria: "Modelo", nombre: "", precioUnitario: 0 });
  };

  const handleEditInsumo = (e) => {
    e.preventDefault();
    if (!editingInsumo) return;

    setInsumos((prev) =>
      prev.map((insumo) =>
        insumo.id === editingInsumo.id ? editingInsumo : insumo
      )
    );
    setShowEditModal(false);
    setEditingInsumo(null);
  };

  const handleDelete = (id) => {
    if (confirm("¿Está seguro que desea eliminar este insumo?")) {
      setInsumos((prev) => prev.filter((i) => i.id !== id));
    }
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Lista de Precios - Insumos
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAjusteModal(true)}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Percent size={20} />
            Ajuste por %
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors"
          >
            <Plus size={20} />
            Agregar Insumo
          </button>
        </div>
      </div>

      {/* Resumen por categoría */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Object.entries(conteosPorCategoria).map(([categoria, cantidad]) => (
          <div
            key={categoria}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-3"
          >
            <span
              className={`px-3 py-1 rounded-full text-sm ${CATEGORIA_COLORS[categoria]}`}
            >
              {categoria}
            </span>
            <span className="text-gray-600 text-sm">
              {cantidad} insumo{cantidad !== 1 ? "s" : ""}
            </span>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Buscar insumos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-20 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todas">Todas las Categorías</option>
            <option value="Modelo">Modelos</option>
            <option value="Tela">Telas</option>
            <option value="Lustre">Lustres y Acabados</option>
          </select>
        </div>
      </div>

      {/* Tabla de Insumos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Nombre del Insumo
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Precio Unitario
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInsumos.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-8 text-center text-gray-400 text-sm"
                  >
                    No se encontraron insumos
                  </td>
                </tr>
              ) : (
                filteredInsumos.map((insumo) => (
                  <tr
                    key={insumo.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          CATEGORIA_COLORS[insumo.categoria] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {insumo.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {insumo.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      <div className="flex items-center gap-1">
                        <DollarSign size={16} className="text-green-600" />
                        {insumo.precioUnitario.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingInsumo({ ...insumo });
                            setShowEditModal(true);
                          }}
                          className="p-2 hover:bg-orange-50 rounded-lg transition-colors text-orange-600"
                          title="Editar insumo"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(insumo.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal: Agregar Insumo ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 text-left animate-in zoom-in-95 duration-200">
            <div className="p-5 sm:p-6 border-b border-gray-200 bg-gray-50/80 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Agregar Nuevo Insumo</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddInsumo} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 bg-white">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Categoría <span className="text-red-600 font-bold">*</span>
                </label>
                <select
                  value={newInsumo.categoria}
                  onChange={(e) =>
                    setNewInsumo({ ...newInsumo, categoria: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all"
                  required
                >
                  <option value="Modelo">Modelo</option>
                  <option value="Tela">Tela</option>
                  <option value="Lustre">Lustre y Acabado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Nombre del Insumo <span className="text-red-600 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={newInsumo.nombre}
                  onChange={(e) =>
                    setNewInsumo({ ...newInsumo, nombre: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all"
                  placeholder="Ej: Silla Moderna, Tela Premium, Lustre Natural"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Precio Unitario <span className="text-red-600 font-bold">*</span>
                </label>
                <div className="relative">
                  <DollarSign
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="number"
                    value={newInsumo.precioUnitario || ""}
                    onChange={(e) =>
                      setNewInsumo({
                        ...newInsumo,
                        precioUnitario: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm font-bold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Usar 0 para telas provistas o sin acabado
                </p>
              </div>

              <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-200 flex justify-end items-center gap-3 rounded-b-2xl -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm"
                >
                  Agregar Insumo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Editar Insumo ── */}
      {showEditModal && editingInsumo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 text-left animate-in zoom-in-95 duration-200">
            <div className="p-5 sm:p-6 border-b border-gray-200 bg-gray-50/80 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Editar Insumo</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditInsumo} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 bg-white">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Categoría <span className="text-red-600 font-bold">*</span>
                </label>
                <select
                  value={editingInsumo.categoria}
                  onChange={(e) =>
                    setEditingInsumo({
                      ...editingInsumo,
                      categoria: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all"
                  required
                >
                  <option value="Modelo">Modelo</option>
                  <option value="Tela">Tela</option>
                  <option value="Lustre">Lustre y Acabado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Nombre del Insumo <span className="text-red-600 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={editingInsumo.nombre}
                  onChange={(e) =>
                    setEditingInsumo({
                      ...editingInsumo,
                      nombre: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Precio Unitario <span className="text-red-600 font-bold">*</span>
                </label>
                <div className="relative">
                  <DollarSign
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="number"
                    value={editingInsumo.precioUnitario}
                    onChange={(e) =>
                      setEditingInsumo({
                        ...editingInsumo,
                        precioUnitario: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm font-bold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-200 flex justify-end items-center gap-3 rounded-b-2xl -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 mt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Ajuste por Porcentaje ── */}
      {showAjusteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 text-left animate-in zoom-in-95 duration-200">
            <div className="p-5 sm:p-6 border-b border-gray-200 bg-gray-50/80 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">
                Ajuste de Precios por Porcentaje
              </h3>
              <button
                onClick={() => setShowAjusteModal(false)}
                className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 bg-white">
              <p className="text-sm text-gray-600">
                Ingrese el porcentaje de aumento o descuento. Use valores
                positivos para aumentos y negativos para descuentos. El ajuste
                se aplicará solo a los {filteredInsumos.length} insumo(s)
                visible(s) según los filtros aplicados.
              </p>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Porcentaje (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={porcentaje}
                    onChange={(e) => setPorcentaje(e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-xl text-sm font-bold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all"
                    placeholder="Ej: 15 o -10"
                    step="0.01"
                  />
                  <Percent
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Se aplicará a todos los insumos visibles en la lista
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-200 flex justify-end items-center gap-3 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setShowAjusteModal(false)}
                className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAjustePorcentaje}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm"
              >
                Aplicar Ajuste
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
