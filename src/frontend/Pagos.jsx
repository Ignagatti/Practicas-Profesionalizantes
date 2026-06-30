import { useState, createContext, useContext } from "react";
import {
  Search,
  Plus,
  Eye,
  Trash2,
  DollarSign,
  X,
  CreditCard,
  Wallet,
  Users,
  Truck,
} from "lucide-react";

const AppContext = createContext();

const AppProvider = ({ children }) => {
  const [pagos, setPagos] = useState([]);

  return (
    <AppContext.Provider
      value={{
        pagos,
        setPagos,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

const useAppContext = () => useContext(AppContext);

const clientesRegistrados = [
  "Mueblería Del Sur",
  "Carpintería López",
  "Diseño Interior SA",
  "Muebles Modernos",
];

const proveedoresRegistrados = [
  "Maderería Guatambú SA",
  "Textiles Premium SRL",
  "Herrajes del Norte",
  "Maderas del Litoral",
];

const metodoPagoConfig = {
  efectivo: {
    label: "Efectivo",
    color: "bg-green-100 text-green-700",
  },
  transferencia: {
    label: "Transferencia",
    color: "bg-blue-100 text-blue-700",
  },
  cheque: {
    label: "Cheque",
    color: "bg-purple-100 text-purple-700",
  },
  tarjeta: {
    label: "Tarjeta",
    color: "bg-orange-100 text-orange-700",
  },
};

function PagosContent() {
  const { pagos, setPagos } = useAppContext();

  const [tipoVista, setTipoVista] = useState("cliente");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingPago, setViewingPago] = useState(null);

  const [newPago, setNewPago] = useState({
    entidad: "",
    fecha: new Date().toISOString().split("T")[0],
    montoTotal: "",
    metodoPago: "efectivo",
    concepto: "",
    observaciones: "",
  });

  const filteredPagos = pagos.filter((pago) => {
    return (
      pago.tipo === tipoVista &&
      (pago.entidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pago.numeroPago.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const handleAddPago = (e) => {
    e.preventDefault();

    const newId = pagos.length + 1;

    const numeroPago = `${tipoVista === "cliente" ? "PC" : "PP"}-${String(
      newId
    ).padStart(3, "0")}`;

    const pagoCompleto = {
      id: newId,
      numeroPago,
      tipo: tipoVista,
      ...newPago,
      montoTotal: Number(newPago.montoTotal),
    };

    setPagos([...pagos, pagoCompleto]);

    setShowAddModal(false);

    setNewPago({
      entidad: "",
      fecha: new Date().toISOString().split("T")[0],
      montoTotal: "",
      metodoPago: "efectivo",
      concepto: "",
      observaciones: "",
    });
  };

  const handleDelete = (id) => {
    if (confirm("¿Eliminar pago?")) {
      setPagos(pagos.filter((p) => p.id !== id));
    }
  };

  const totalPagos = filteredPagos.reduce(
    (sum, p) => sum + p.montoTotal,
    0
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Gestión de Pagos
          </h1>

          <p className="text-gray-500 mt-1">
            {filteredPagos.length} pagos registrados
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-800"
        >
          <Plus size={18} />
          Registrar Pago
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTipoVista("cliente")}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            tipoVista === "cliente"
              ? "bg-red-700 text-white"
              : "bg-gray-200"
          }`}
        >
          <Users size={18} />
          Clientes
        </button>

        <button
          onClick={() => setTipoVista("proveedor")}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            tipoVista === "proveedor"
              ? "bg-red-700 text-white"
              : "bg-gray-200"
          }`}
        >
          <Truck size={18} />
          Proveedores
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-green-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign />
            <span>Efectivo</span>
          </div>

          <p className="text-2xl font-bold">
            $
            {filteredPagos
              .filter((p) => p.metodoPago === "efectivo")
              .reduce((s, p) => s + p.montoTotal, 0)
              .toLocaleString()}
          </p>
        </div>

        <div className="bg-blue-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard />
            <span>Transferencia</span>
          </div>

          <p className="text-2xl font-bold">
            $
            {filteredPagos
              .filter((p) => p.metodoPago === "transferencia")
              .reduce((s, p) => s + p.montoTotal, 0)
              .toLocaleString()}
          </p>
        </div>

        <div className="bg-purple-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet />
            <span>Cheque</span>
          </div>

          <p className="text-2xl font-bold">
            $
            {filteredPagos
              .filter((p) => p.metodoPago === "cheque")
              .reduce((s, p) => s + p.montoTotal, 0)
              .toLocaleString()}
          </p>
        </div>

        <div className="bg-orange-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard />
            <span>Tarjeta</span>
          </div>

          <p className="text-2xl font-bold">
            $
            {filteredPagos
              .filter((p) => p.metodoPago === "tarjeta")
              .reduce((s, p) => s + p.montoTotal, 0)
              .toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />

          <input
            type="text"
            placeholder="Buscar pagos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-20 pr-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-3">N° Pago</th>
              <th className="text-left p-3">Entidad</th>
              <th className="text-left p-3">Fecha</th>
              <th className="text-left p-3">Monto</th>
              <th className="text-left p-3">Método</th>
              <th className="text-right p-3">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {filteredPagos.map((pago) => (
              <tr key={pago.id} className="border-t hover:bg-gray-50">
                <td className="p-3">{pago.numeroPago}</td>
                <td className="p-3">{pago.entidad}</td>
                <td className="p-3">{pago.fecha}</td>

                <td className="p-3">
                  ${pago.montoTotal.toLocaleString()}
                </td>

                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      metodoPagoConfig[pago.metodoPago].color
                    }`}
                  >
                    {metodoPagoConfig[pago.metodoPago].label}
                  </span>
                </td>

                <td className="p-3 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setViewingPago(pago);
                      setShowViewModal(true);
                    }}
                    className="p-2 hover:bg-gray-200 rounded-lg"
                  >
                    <Eye size={18} />
                  </button>

                  <button
                    onClick={() => handleDelete(pago.id)}
                    className="p-2 hover:bg-red-100 text-red-600 rounded-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-right text-xl font-bold text-gray-800">
        Total: ${totalPagos.toLocaleString()}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Registrar Pago</h2>

              <button onClick={() => setShowAddModal(false)}>
                <X />
              </button>
            </div>

            <form onSubmit={handleAddPago} className="space-y-4">
              <div>
                <label className="block mb-2">Entidad</label>

                <select
                  value={newPago.entidad}
                  onChange={(e) =>
                    setNewPago({ ...newPago, entidad: e.target.value })
                  }
                  className="w-full border rounded-lg p-2"
                  required
                >
                  <option value="">Seleccionar</option>

                  {(tipoVista === "cliente"
                    ? clientesRegistrados
                    : proveedoresRegistrados
                  ).map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2">Fecha</label>

                <input
                  type="date"
                  value={newPago.fecha}
                  onChange={(e) =>
                    setNewPago({ ...newPago, fecha: e.target.value })
                  }
                  className="w-full border rounded-lg p-2"
                  required
                />
              </div>

              <div>
                <label className="block mb-2">Monto</label>

                <input
                  type="number"
                  value={newPago.montoTotal}
                  onChange={(e) =>
                    setNewPago({
                      ...newPago,
                      montoTotal: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg p-2"
                  required
                />
              </div>

              <div>
                <label className="block mb-2">Método de Pago</label>

                <select
                  value={newPago.metodoPago}
                  onChange={(e) =>
                    setNewPago({
                      ...newPago,
                      metodoPago: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg p-2"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="cheque">Cheque</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>
              </div>

              <div>
                <label className="block mb-2">Concepto</label>

                <input
                  type="text"
                  value={newPago.concepto}
                  onChange={(e) =>
                    setNewPago({
                      ...newPago,
                      concepto: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block mb-2">Observaciones</label>

                <textarea
                  value={newPago.observaciones}
                  onChange={(e) =>
                    setNewPago({
                      ...newPago,
                      observaciones: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-red-700 text-white py-3 rounded-lg hover:bg-red-800"
              >
                Guardar Pago
              </button>
            </form>
          </div>
        </div>
      )}

      {showViewModal && viewingPago && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {viewingPago.numeroPago}
              </h2>

              <button onClick={() => setShowViewModal(false)}>
                <X />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-gray-500 text-sm">Entidad</p>
                <p className="text-lg">{viewingPago.entidad}</p>
              </div>

              <div>
                <p className="text-gray-500 text-sm">Fecha</p>
                <p className="text-lg">{viewingPago.fecha}</p>
              </div>

              <div>
                <p className="text-gray-500 text-sm">Monto</p>

                <p className="text-lg font-bold">
                  ${viewingPago.montoTotal.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-gray-500 text-sm">Concepto</p>
                <p>{viewingPago.concepto || "-"}</p>
              </div>

              <div>
                <p className="text-gray-500 text-sm">Observaciones</p>
                <p>{viewingPago.observaciones || "-"}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Pagos() {
  return (
    <AppProvider>
      <PagosContent />
    </AppProvider>
  );
}