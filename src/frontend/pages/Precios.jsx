import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Trash2,
  Percent,
  Edit2,
  DollarSign,
  X,
  Package,
  Layers,
  Palette,
  AlertCircle
} from "lucide-react";
import { useToast } from "../components/ui/ToastContext.jsx";
import { useConfirm } from "../components/ui/ConfirmContext.jsx";

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
  const toast = useToast();
  const confirm = useConfirm();

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
  const [fieldErrorsAdd, setFieldErrorsAdd] = useState({});
  const [fieldErrorsEdit, setFieldErrorsEdit] = useState({});
  const [newInsumo, setNewInsumo] = useState({
    categoria: "Modelo",
    nombre: "",
    precioUnitario: 0,
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowAjusteModal(false);
        setShowAddModal(false);
        setShowEditModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
      toast.error("Por favor ingrese un porcentaje válido");
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

    toast.success(
      `Ajuste del ${porcentaje}% aplicado a ${filteredInsumos.length} insumo(s) visible(s)`
    );
    setShowAjusteModal(false);
    setPorcentaje("");
  };

  const handleAddInsumo = (e) => {
    e.preventDefault();
    const errors = {};
    if (!newInsumo.categoria) errors.categoria = "La categoría es obligatoria";
    if (!newInsumo.nombre || !newInsumo.nombre.trim()) errors.nombre = "El nombre es obligatorio";
    if (newInsumo.precioUnitario === "" || newInsumo.precioUnitario === null || newInsumo.precioUnitario < 0) errors.precioUnitario = "Ingrese un precio válido (≥ 0)";
    setFieldErrorsAdd(errors);
    if (Object.keys(errors).length > 0) return;

    const newId =
      insumos.length > 0 ? Math.max(...insumos.map((i) => i.id)) + 1 : 1;
    setInsumos([...insumos, { ...newInsumo, id: newId }]);
    setShowAddModal(false);
    setNewInsumo({ categoria: "Modelo", nombre: "", precioUnitario: 0 });
    setFieldErrorsAdd({});
    toast.success("Insumo agregado con éxito.");
  };

  const handleEditInsumo = (e) => {
    e.preventDefault();
    if (!editingInsumo) return;
    const errors = {};
    if (!editingInsumo.categoria) errors.categoria = "La categoría es obligatoria";
    if (!editingInsumo.nombre || !editingInsumo.nombre.trim()) errors.nombre = "El nombre es obligatorio";
    if (editingInsumo.precioUnitario === "" || editingInsumo.precioUnitario === null || editingInsumo.precioUnitario < 0) errors.precioUnitario = "Ingrese un precio válido (≥ 0)";
    setFieldErrorsEdit(errors);
    if (Object.keys(errors).length > 0) return;

    setInsumos((prev) =>
      prev.map((insumo) =>
        insumo.id === editingInsumo.id ? editingInsumo : insumo
      )
    );
    setShowEditModal(false);
    setEditingInsumo(null);
    setFieldErrorsEdit({});
    toast.success("Insumo actualizado con éxito.");
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: "Eliminar Insumo",
      message: "¿Está seguro que desea eliminar este insumo?",
      confirmText: "Eliminar",
      type: "danger",
    });
    if (ok) {
      setInsumos((prev) => prev.filter((i) => i.id !== id));
      toast.success("Insumo eliminado con éxito.");
    }
  };

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('acuaber:cambiar_titulo', { detail: 'Lista de Precios' }));
  }, []);

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header con Indicadores y Botones de Acción en la misma línea */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Indicadores KPI: Modelos, Telas, Lustres compactos */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-3.5 py-2 flex items-center justify-between gap-3 min-w-[170px]">
            <div>
              <p className="text-xs font-semibold text-gray-500 whitespace-nowrap">
                Modelos Registrados
              </p>
              <p className="text-lg font-extrabold text-gray-900 leading-tight mt-0.5">
                {conteosPorCategoria.Modelo || 0}
              </p>
            </div>
            <div className="p-2 bg-red-50 text-red-700 rounded-lg flex items-center justify-center shrink-0">
              <Package size={18} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-3.5 py-2 flex items-center justify-between gap-3 min-w-[170px]">
            <div>
              <p className="text-xs font-semibold text-gray-500 whitespace-nowrap">
                Telas Registradas
              </p>
              <p className="text-lg font-extrabold text-gray-900 leading-tight mt-0.5">
                {conteosPorCategoria.Tela || 0}
              </p>
            </div>
            <div className="p-2 bg-pink-50 text-pink-700 rounded-lg flex items-center justify-center shrink-0">
              <Layers size={18} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-3.5 py-2 flex items-center justify-between gap-3 min-w-[170px]">
            <div>
              <p className="text-xs font-semibold text-gray-500 whitespace-nowrap">
                Lustres Registrados
              </p>
              <p className="text-lg font-extrabold text-gray-900 leading-tight mt-0.5">
                {conteosPorCategoria.Lustre || 0}
              </p>
            </div>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg flex items-center justify-center shrink-0">
              <Palette size={18} />
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAjusteModal(true)}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3.5 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-semibold text-sm"
          >
            <Percent size={17} />
            Ajustar por %
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors text-sm font-semibold shadow-sm"
          >
            <Plus size={18} />
            Agregar a Lista de Precios
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-3.5 sm:p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Buscar insumos por nombre o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700 text-sm bg-white"
            />
          </div>
          <select
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700 text-sm bg-white"
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
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[500px] lg:min-w-0 text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-2.5 py-2 sm:px-3 sm:py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Categoría
                </th>
                <th className="px-2.5 py-2 sm:px-3 sm:py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Nombre del Insumo
                </th>
                <th className="px-2.5 py-2 sm:px-3 sm:py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Precio Unitario
                </th>
                <th className="px-2.5 py-2 sm:px-3 sm:py-2.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInsumos.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-8 text-center text-gray-400 text-xs sm:text-sm"
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
                    <td className="px-2.5 py-2 sm:px-3 sm:py-2.5 whitespace-nowrap text-xs sm:text-sm">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          CATEGORIA_COLORS[insumo.categoria] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {insumo.categoria}
                      </span>
                    </td>
                    <td className="px-2.5 py-2 sm:px-3 sm:py-2.5 whitespace-nowrap text-xs sm:text-sm text-gray-800">
                      {insumo.nombre}
                    </td>
                    <td className="px-2.5 py-2 sm:px-3 sm:py-2.5 whitespace-nowrap text-xs sm:text-sm text-gray-800">
                      <div className="flex items-center gap-1">
                        <DollarSign size={16} className="text-green-600" />
                        {insumo.precioUnitario.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-2.5 py-2 sm:px-3 sm:py-2.5 whitespace-nowrap text-center text-xs sm:text-sm">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingInsumo({ ...insumo });
                            setShowEditModal(true);
                          }}
                          className="p-1.5 hover:bg-orange-50 rounded-lg transition-colors text-orange-600"
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
                  onChange={(e) => {
                    setNewInsumo({ ...newInsumo, categoria: e.target.value });
                    if (fieldErrorsAdd.categoria) setFieldErrorsAdd(prev => ({ ...prev, categoria: null }));
                  }}
                  className={`w-full px-4 py-2.5 border ${fieldErrorsAdd.categoria ? 'border-red-500 bg-red-50/30' : 'border-gray-300 bg-white'} rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all`}
                >
                  <option value="Modelo">Modelo</option>
                  <option value="Tela">Tela</option>
                  <option value="Lustre">Lustre y Acabado</option>
                </select>
                {fieldErrorsAdd.categoria && (
                  <p className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle size={13} className="shrink-0" />
                    {fieldErrorsAdd.categoria}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Nombre del Insumo <span className="text-red-600 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={newInsumo.nombre}
                  onChange={(e) => {
                    setNewInsumo({ ...newInsumo, nombre: e.target.value });
                    if (fieldErrorsAdd.nombre) setFieldErrorsAdd(prev => ({ ...prev, nombre: null }));
                  }}
                  className={`w-full px-4 py-2.5 border ${fieldErrorsAdd.nombre ? 'border-red-500 bg-red-50/30' : 'border-gray-300 bg-white'} rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all`}
                  placeholder="Ej: Silla Moderna, Tela Premium, Lustre Natural"
                />
                {fieldErrorsAdd.nombre && (
                  <p className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle size={13} className="shrink-0" />
                    {fieldErrorsAdd.nombre}
                  </p>
                )}
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
                    onChange={(e) => {
                      setNewInsumo({
                        ...newInsumo,
                        precioUnitario: parseFloat(e.target.value) || 0,
                      });
                      if (fieldErrorsAdd.precioUnitario) setFieldErrorsAdd(prev => ({ ...prev, precioUnitario: null }));
                    }}
                    className={`w-full pl-10 pr-4 py-2.5 border ${fieldErrorsAdd.precioUnitario ? 'border-red-500 bg-red-50/30' : 'border-gray-300 bg-white'} rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all`}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
                {fieldErrorsAdd.precioUnitario && (
                  <p className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle size={13} className="shrink-0" />
                    {fieldErrorsAdd.precioUnitario}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Usar 0 para telas provistas o sin acabado
                </p>
              </div>

              <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-200 flex justify-end items-center gap-3 rounded-b-2xl -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 mt-3">
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
                  onChange={(e) => {
                    setEditingInsumo({
                      ...editingInsumo,
                      categoria: e.target.value,
                    });
                    if (fieldErrorsEdit.categoria) setFieldErrorsEdit(prev => ({ ...prev, categoria: null }));
                  }}
                  className={`w-full px-4 py-2.5 border ${fieldErrorsEdit.categoria ? 'border-red-500 bg-red-50/30' : 'border-gray-300 bg-white'} rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all`}
                >
                  <option value="Modelo">Modelo</option>
                  <option value="Tela">Tela</option>
                  <option value="Lustre">Lustre y Acabado</option>
                </select>
                {fieldErrorsEdit.categoria && (
                  <p className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle size={13} className="shrink-0" />
                    {fieldErrorsEdit.categoria}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Nombre del Insumo <span className="text-red-600 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={editingInsumo.nombre}
                  onChange={(e) => {
                    setEditingInsumo({
                      ...editingInsumo,
                      nombre: e.target.value,
                    });
                    if (fieldErrorsEdit.nombre) setFieldErrorsEdit(prev => ({ ...prev, nombre: null }));
                  }}
                  className={`w-full px-4 py-2.5 border ${fieldErrorsEdit.nombre ? 'border-red-500 bg-red-50/30' : 'border-gray-300 bg-white'} rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all`}
                />
                {fieldErrorsEdit.nombre && (
                  <p className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle size={13} className="shrink-0" />
                    {fieldErrorsEdit.nombre}
                  </p>
                )}
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
                    onChange={(e) => {
                      setEditingInsumo({
                        ...editingInsumo,
                        precioUnitario: parseFloat(e.target.value) || 0,
                      });
                      if (fieldErrorsEdit.precioUnitario) setFieldErrorsEdit(prev => ({ ...prev, precioUnitario: null }));
                    }}
                    className={`w-full pl-10 pr-4 py-2.5 border ${fieldErrorsEdit.precioUnitario ? 'border-red-500 bg-red-50/30' : 'border-gray-300 bg-white'} rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all`}
                    min="0"
                    step="0.01"
                  />
                </div>
                {fieldErrorsEdit.precioUnitario && (
                  <p className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle size={13} className="shrink-0" />
                    {fieldErrorsEdit.precioUnitario}
                  </p>
                )}
              </div>

              <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-200 flex justify-end items-center gap-3 rounded-b-2xl -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 mt-3">
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

            <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-200 flex justify-end items-center gap-3 rounded-b-2xl">
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
