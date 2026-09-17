import React, { useState } from 'react';
import { AlertCircle, Loader2, Lock } from 'lucide-react';
import logoAcuaber from '../assets/logo-acuaber.png';

const API_URL = 'http://localhost:4000/api';

export function LicenciaModal({ 
  abierto, 
  esBloqueante = true, 
  alActivar, 
  onCerrar, 
  errorInicial = null 
}) {
  const [clave, setClave] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(errorInicial);

  if (!abierto) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const claveLimpia = clave.trim().toUpperCase();

    if (!claveLimpia) {
      setError('Por favor, ingresa una clave válida.');
      return;
    }

    setCargando(true);
    setError(null);

    try {
      const resp = await fetch(`${API_URL}/licencia/verificar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clave: claveLimpia })
      });

      const data = await resp.json();

      if (!resp.ok || !data.ok) {
        throw new Error(data.error || 'La clave ingresada no es válida.');
      }

      // Guardar en el almacenamiento local del equipo
      localStorage.setItem('acuaber_license_key', claveLimpia);
      localStorage.setItem('acuaber_license_titular', data.titular || 'Acuaber');

      if (alActivar) {
        alActivar(data);
      }
    } catch (err) {
      console.error('Error al verificar clave:', err);
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 transform transition-all">
        
        {/* Cabecera */}
        <div className="bg-[#8b0000] p-6 text-center text-white relative">
          <div className="mx-auto w-16 h-16 bg-white rounded-2xl shadow-md p-2 flex items-center justify-center mb-3">
            <img src={logoAcuaber} alt="Acuaber" className="max-h-full max-w-full object-contain" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Sistema Acuaber</h2>
          <p className="text-xs text-red-200 mt-1">Ingreso al Sistema</p>
          
          <div className="absolute top-4 right-4 text-red-300">
            <Lock size={18} />
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Clave de Acceso
              </label>
              <div>
                <input
                  type="text"
                  value={clave}
                  onChange={(e) => {
                    setClave(e.target.value.toUpperCase());
                    if (error) setError(null);
                  }}
                  placeholder="ACUABER-XXXX-XXXX"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 font-mono text-sm tracking-wider focus:ring-2 focus:ring-[#8b0000] focus:border-[#8b0000] transition-all outline-none"
                  autoFocus
                  disabled={cargando}
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1.5">
                Ingresa la clave correspondiente para acceder.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">Error: </strong>
                  <span>{error}</span>
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center gap-2">
              {!esBloqueante && (
                <button
                  type="button"
                  onClick={onCerrar}
                  className="w-1/3 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium text-xs hover:bg-gray-100 transition-all"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={cargando || !clave.trim()}
                className={`flex-1 py-3 px-4 rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                  cargando || !clave.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[#8b0000] hover:bg-[#6b0000] hover:shadow-lg active:scale-[0.99]'
                }`}
              >
                {cargando ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Ingresando...</span>
                  </>
                ) : (
                  <span>Ingresar</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
          <span>Acuaber Muebles &copy; 2026</span>
          <span>Esperanza, Santa Fe</span>
        </div>

      </div>
    </div>
  );
}

export default LicenciaModal;

