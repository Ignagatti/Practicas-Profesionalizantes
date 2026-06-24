import { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import Productos from './pages/Productos.jsx';
import Insumos from './pages/Insumos.jsx';
import { Dashboard } from './Dashboard.jsx';
import { Clientes } from './pages/Clientes.jsx';
import { Proveedores } from './pages/Proveedores.jsx';

function App() {
    const [seccion, setSeccion] = useState('dashboard');

    const renderContenido = () => {
        switch (seccion) {
            case 'dashboard':
                return <Dashboard />;

            case 'productos':
                return <Productos />;

            case 'insumos':
                return <Insumos />;

            case 'clientes':
                return <Clientes />;

            case 'proveedores':
                return <Proveedores />;

            default:
                return <Dashboard />;
        }
    };

    return (
        <div className="flex bg-gray-100 min-h-screen">
            <Sidebar seccionActual={seccion} setSeccion={setSeccion} />

            <main className="flex-1 ml-64 p-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 capitalize">
                            {seccion}
                        </h2>
                        <p className="text-sm text-gray-500">
                            Gestión Administrativa - Fabricación de Sillas y Sillones
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-red-700 rounded-full flex items-center justify-center text-white font-bold">
                            A
                        </div>

                        <div className="text-right">
                            <p className="text-sm font-bold text-gray-800 leading-none">
                                Administración
                            </p>
                            <p className="text-xs text-gray-500">Acuaber</p>
                        </div>
                    </div>
                </header>

                <div className="animate-in fade-in duration-500">
                    {renderContenido()}
                </div>
            </main>
        </div>
    );
}

export default App;