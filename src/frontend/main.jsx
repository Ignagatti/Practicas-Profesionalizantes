import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'

// Interceptor global de red para inyectar la clave de licencia en todas las peticiones a la API
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config = {}] = args;
  
  const licenseKey = localStorage.getItem('acuaber_license_key');
  const url = typeof resource === 'string' ? resource : resource?.url || '';

  if (licenseKey && url.includes('/api/') && !url.includes('/api/licencia/verificar')) {
    const headers = new Headers(config.headers || {});
    if (!headers.has('x-license-key')) {
      headers.set('x-license-key', licenseKey);
    }
    config.headers = headers;
  }

  const response = await originalFetch(resource, config);

  // Si el backend rechaza la petición por licencia revocada o inválida
  if (response.status === 403 && url.includes('/api/')) {
    try {
      const cloned = response.clone();
      const body = await cloned.json();
      if (body?.codigo === 'LICENCIA_INVALIDA' || body?.codigo === 'LICENCIA_REQUERIDA') {
        window.dispatchEvent(new CustomEvent('acuaber:licencia_revocada', { detail: body }));
      }
    } catch (_) {}
  }

  return response;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

