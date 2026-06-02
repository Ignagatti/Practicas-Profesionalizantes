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
          <h2 className="text-2xl text-gray-800">
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
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Buscar insumos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <th className="px-3 py-3 text-left text-xs text-gray-500 uppercase">
                  Categoría
                </th>
                <th className="px-3 py-3 text-left text-xs text-gray-500 uppercase">
                  Nombre del Insumo
                </th>
                <th className="px-3 py-3 text-left text-xs text-gray-500 uppercase">
                  Precio Unitario
                </th>
                <th className="px-3 py-3 text-right text-xs text-gray-500 uppercase"></th>
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
                    <td className="px-3 py-3 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          CATEGORIA_COLORS[insumo.categoria] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {insumo.categoria}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-800">
                      {insumo.nombre}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-800">
                      <div className="flex items-center gap-1">
                        <DollarSign size={16} className="text-green-600" />
                        {insumo.precioUnitario.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-right text-sm">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl text-gray-800">Agregar Nuevo Insumo</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddInsumo} className="p-6 space-y-4">
              <div>
                <label className="block text-sm mb-2 text-gray-700">
                  Categoría *
                </label>
                <select
                  value={newInsumo.categoria}
                  onChange={(e) =>
                    setNewInsumo({ ...newInsumo, categoria: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Modelo">Modelo</option>
                  <option value="Tela">Tela</option>
                  <option value="Lustre">Lustre y Acabado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700">
                  Nombre del Insumo *
                </label>
                <input
                  type="text"
                  value={newInsumo.nombre}
                  onChange={(e) =>
                    setNewInsumo({ ...newInsumo, nombre: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Silla Moderna, Tela Premium, Lustre Natural"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700">
                  Precio Unitario *
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl text-gray-800">Editar Insumo</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditInsumo} className="p-6 space-y-4">
              <div>
                <label className="block text-sm mb-2 text-gray-700">
                  Categoría *
                </label>
                <select
                  value={editingInsumo.categoria}
                  onChange={(e) =>
                    setEditingInsumo({
                      ...editingInsumo,
                      categoria: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Modelo">Modelo</option>
                  <option value="Tela">Tela</option>
                  <option value="Lustre">Lustre y Acabado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700">
                  Nombre del Insumo *
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700">
                  Precio Unitario *
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl text-gray-800 mb-4">
                Ajuste de Precios por Porcentaje
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Ingrese el porcentaje de aumento o descuento. Use valores
                positivos para aumentos y negativos para descuentos. El ajuste
                se aplicará solo a los {filteredInsumos.length} insumo(s)
                visible(s) según los filtros aplicados.
              </p>
              <div className="mb-6">
                <label className="block text-sm mb-2 text-gray-700">
                  Porcentaje (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={porcentaje}
                    onChange={(e) => setPorcentaje(e.target.value)}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowAjusteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAjustePorcentaje}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
