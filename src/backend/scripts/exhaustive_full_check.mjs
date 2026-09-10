import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../..');

// Mockear entorno del navegador (DOM) para pruebas de renderizado SSR de componentes React
globalThis.window = {
  location: { reload: () => {} },
  addEventListener: () => {},
  removeEventListener: () => {},
  matchMedia: () => ({ matches: false, addListener: () => {}, removeListener: () => {} }),
  ResizeObserver: class { observe() {} unobserve() {} disconnect() {} }
};
globalThis.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: () => ({ appendChild: () => {}, setAttribute: () => {} }),
  body: { appendChild: () => {}, removeChild: () => {} },
  addEventListener: () => {},
  removeEventListener: () => {}
};
globalThis.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {}
};
globalThis.sessionStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {}
};
globalThis.ResizeObserver = globalThis.window.ResizeObserver;
globalThis.fetch = async (url) => {
  return {
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => []
  };
};

import React from 'react';
import ReactDOMServer from 'react-dom/server';

async function runExhaustiveCheck() {
  console.log('======================================================================');
  console.log('🔬 AUDITORÍA EXHAUSTIVA DE RENDERIZADO Y DECLARACIONES EN REACT & NODE');
  console.log('======================================================================\n');

  // Inicializar servidor de Vite para cargar módulos JSX dinámicamente
  const vite = await createServer({
    root: projectRoot,
    server: { middlewareMode: true },
    appType: 'custom'
  });

  const errors = [];
  const passed = [];

  // Lista de todas las páginas y componentes del frontend
  const frontendFiles = [
    'src/frontend/components/ui/ErrorBoundary.jsx',
    'src/frontend/components/ui/ToastContext.jsx',
    'src/frontend/components/ui/ConfirmContext.jsx',
    'src/frontend/components/entidades/EntidadesPanel.jsx',
    'src/frontend/Sidebar.jsx',
    'src/frontend/pages/Dashboard.jsx',
    'src/frontend/pages/Productos.jsx',
    'src/frontend/pages/Insumos.jsx',
    'src/frontend/pages/Clientes.jsx',
    'src/frontend/pages/Proveedores.jsx',
    'src/frontend/pages/Movimientos.jsx',
    'src/frontend/pages/Pagos.jsx',
    'src/frontend/pages/Pedidos.jsx',
    'src/frontend/pages/PedidosCliente.jsx',
    'src/frontend/pages/PedidosProveedor.jsx',
    'src/frontend/pages/Precios.jsx',
    'src/frontend/pages/Saldos.jsx',
    'src/frontend/App.jsx'
  ];

  for (const relPath of frontendFiles) {
    const fullPath = path.resolve(projectRoot, relPath);
    console.log(`⏳ Analizando y renderizando: ${relPath}...`);

    try {
      // 1. Cargar módulo JSX vía Vite SSR
      const mod = await vite.ssrLoadModule(fullPath);
      
      // Buscar el componente por export default o por nombre
      const Component = mod.default || mod[Object.keys(mod)[0]];

      if (!Component || typeof Component !== 'function') {
        throw new Error(`El archivo ${relPath} no exporta un componente React válido.`);
      }

      // Cargar los Providers para inyectar el contexto necesario
      const toastMod = await vite.ssrLoadModule(path.resolve(projectRoot, 'src/frontend/components/ui/ToastContext.jsx'));
      const confirmMod = await vite.ssrLoadModule(path.resolve(projectRoot, 'src/frontend/components/ui/ConfirmContext.jsx'));
      const ToastProvider = toastMod.ToastProvider;
      const ConfirmProvider = confirmMod.ConfirmProvider;

      // 2. Renderizar componente a HTML usando ReactDOMServer envuelto en los Providers
      const props = {
        tipoVista: 'cliente',
        setTipoVista: () => {},
        seccionActual: 'dashboard',
        setSeccion: () => {},
        tipoInicial: 'cliente',
        pagosPendientes: []
      };

      const innerElement = React.createElement(Component, props);
      const wrappedElement = React.createElement(
        ToastProvider,
        null,
        React.createElement(ConfirmProvider, null, innerElement)
      );

      const html = ReactDOMServer.renderToString(wrappedElement);

      if (typeof html === 'string') {
        passed.push(`✅ Componente [${relPath}]: Renderizado exitoso (${html.length} bytes HTML generados)`);
      }
    } catch (err) {
      console.error(`❌ ERROR EN [${relPath}]:`, err.message);
      errors.push({ file: relPath, error: err.message, stack: err.stack });
    }
  }

  await vite.close();

  console.log('\n======================================================================');
  console.log('📋 RESULTADOS DEL ANÁLISIS EXHAUSTIVO DE RENDERIZADO:');
  console.log('======================================================================');
  passed.forEach(p => console.log(p));

  if (errors.length > 0) {
    console.log('\n🚨 ERRORES ENCONTRADOS:');
    errors.forEach(e => console.log(`- ${e.file}: ${e.error}`));
    process.exit(1);
  } else {
    console.log('\n🎉 TODOS LOS COMPONENTES REACT RENDERIZAN AL 100% SIN NINGUNA EXCEPCIÓN.');
    process.exit(0);
  }
}

runExhaustiveCheck().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
