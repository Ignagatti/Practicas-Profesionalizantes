import { useState } from 'react';
import Productos from './pages/Productos.jsx';
import Insumos from './pages/Insumos.jsx';

function App() {
    const [seccion, setSeccion] = useState('productos');

    return (
        <div>
            <div style={{ background: '#333', padding: '10px', color: 'white' }}>
                <button onClick={() => setSeccion('productos')}>Ver Productos</button>
                <button onClick={() => setSeccion('insumos')}>Ver Insumos</button>
            </div>

            <div style={{ padding: '20px' }}>
                {seccion === 'productos' ? <Productos /> : <Insumos />}
            </div>
        </div>
    );
}

export default App;
