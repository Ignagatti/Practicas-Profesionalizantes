import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, Loader2, Lock, CheckCircle2 } from 'lucide-react';
import logoAcuaber from '../assets/logo-acuaber.png';

const API_URL = 'http://localhost:4000/api';

export function LicenciaModal({ 
  abierto, 
  esBloqueante = true, 
  alActivar, 
  onCerrar, 
  errorInicial = null,
  titularActual = null 
}) {
  const [clave, setClave] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(errorInicial);
  const [exito, setExito] = useState(false);
  const [titularActivado, setTitularActivado] = useState(null);

  if (!abierto) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const claveLimpia = clave.trim().toUpperCase();

    if (!claveLimpia) {
      setError('Por favor, ingresa una clave de licencia.');
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
        throw new Error(data.error || 'La clave no es válida o fue desactivada.');
      }

      setExito(true);
      setTitularActivado(data.titular);

      // Guardar en el almacenamiento local del equipo
      localStorage.setItem('acuaber_license_key', claveLimpia);
      localStorage.setItem('acuaber_license_titular', data.titular || 'Acuaber Fábrica');

      setTimeout(() => {
        if (alActivar) {
          alActivar(data);
        }
      }, 900);
    } catch (err) {
      console.error('Error al activar licencia:', err);
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 transform transition-all">
        
        {/* Cabecera decorativa */}
        <div className="bg-[#8b0000] p-6 text-center text-white relative">
          <div className="mx-auto w-16 h-16 bg-white rounded-2xl shadow-md p-2 flex items-center justify-center mb-3">
            <img src={logoAcuaber} alt="Acuaber" className="max-h-full max-w-full object-contain" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Sistema Acuaber</h2>
          <p className="text-xs text-red-200 mt-1">Activación de Seguridad y Licencia</p>
          
          <div className="absolute top-4 right-4 text-red-300">
            <Lock size={18} />
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {exito ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-lg font-bold text-gray-800">¡Licencia Validada!</h3>
              <p className="text-sm text-gray-600">
                Puesto activado correctamente para: <br />
                <span className="font-semibold text-[#8b0000]">{titularActivado}</span>
              </p>
              <p className="text-xs text-gray-400">Iniciando sistema...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Clave de Activación del Puesto
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
                  Ingresa la clave única entregada por el administrador de la fábrica.
                </p>
              </div>

              {titularActual && (
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200 text-xs text-gray-600 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#8b0000] shrink-0" />
                  <span>Titular registrado: <strong>{titularActual}</strong></span>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2.5">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Acceso Denegado: </strong>
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
                      <span>Verificando con Neon...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      <span>Validar y Entrar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
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
