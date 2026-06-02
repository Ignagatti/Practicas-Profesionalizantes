import React from 'react';
import { createRoot } from 'react-dom/client';
import Clientes from './pages/Clientes.jsx';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Clientes />
    </React.StrictMode>
);