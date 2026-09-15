const pool = require('../config/db');

// Caché en memoria para evitar saturar Neon en cada micro-petición
// Almacena: clave -> { valida: boolean, titular: string, expiraEn: timestamp }
const cacheLicencias = new Map();
const TTL_CACHE_MS = 30 * 1000; // 30 segundos

/**
 * Limpia el caché en memoria (por ejemplo, al verificar una nueva clave)
 */
function invalidarCacheLicencia(clave) {
  if (clave) {
    cacheLicencias.delete(clave.trim().toUpperCase());
  } else {
    cacheLicencias.clear();
  }
}

/**
 * Consulta la base de datos para verificar si la clave existe y está activa
 */
async function comprobarLicenciaEnBD(clave) {
  const claveLimpia = String(clave || '').trim().toUpperCase();
  if (!claveLimpia) return null;

  const ahora = Date.now();
  const enCache = cacheLicencias.get(claveLimpia);
  if (enCache && enCache.expiraEn > ahora) {
    return enCache.valida ? enCache : null;
  }

  const query = 'SELECT id, clave, titular, activa FROM Licencia WHERE UPPER(clave) = $1 LIMIT 1;';
  const resultado = await pool.query(query, [claveLimpia]);

  if (resultado.rows.length === 0 || !resultado.rows[0].activa) {
    cacheLicencias.set(claveLimpia, { valida: false, expiraEn: ahora + TTL_CACHE_MS });
    return null;
  }

  const lic = {
    valida: true,
    titular: resultado.rows[0].titular || 'Acuaber Fábrica',
    expiraEn: ahora + TTL_CACHE_MS
  };
  cacheLicencias.set(claveLimpia, lic);
  return lic;
}

/**
 * Endpoint POST /api/licencia/verificar
 * Permite validar una clave introducida por el usuario
 */
async function verificarLicencia(req, res) {
  try {
    const { clave } = req.body;
    if (!clave || typeof clave !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'Debe proporcionar una clave de activación válida.'
      });
    }

    const claveLimpia = clave.trim().toUpperCase();
    invalidarCacheLicencia(claveLimpia);

    const lic = await comprobarLicenciaEnBD(claveLimpia);
    if (!lic) {
      return res.status(401).json({
        ok: false,
        codigo: 'LICENCIA_INVALIDA',
        error: 'La clave ingresada no existe, ha expirado o fue desactivada.'
      });
    }

    return res.json({
      ok: true,
      mensaje: 'Licencia activa y validada exitosamente.',
      titular: lic.titular,
      clave: claveLimpia
    });
  } catch (error) {
    console.error('Error al verificar licencia:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error de conexión al validar la licencia con el servidor.'
    });
  }
}

/**
 * Endpoint GET /api/licencia/estado
 * Verifica rápidamente la vigencia de la clave enviada en cabecera
 */
async function obtenerEstadoLicencia(req, res) {
  try {
    const clave = req.headers['x-license-key'] || req.query.clave;
    if (!clave) {
      return res.status(400).json({
        ok: false,
        error: 'No se envió ninguna clave para comprobar.'
      });
    }

    const lic = await comprobarLicenciaEnBD(clave);
    if (!lic) {
      return res.status(403).json({
        ok: false,
        codigo: 'LICENCIA_INVALIDA',
        error: 'Licencia revocada o no válida.'
      });
    }

    return res.json({
      ok: true,
      titular: lic.titular
    });
  } catch (error) {
    console.error('Error al consultar estado de licencia:', error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}

/**
 * Middleware de seguridad que protege todas las rutas comerciales y operativas
 */
async function validarLicenciaMiddleware(req, res, next) {
  // Rutas públicas que no requieren clave previa
  if (
    req.path.startsWith('/licencia') ||
    req.path.startsWith('/health') ||
    req.path.startsWith('/uploads') ||
    req.method === 'OPTIONS'
  ) {
    return next();
  }

  const clave = req.headers['x-license-key'];

  if (!clave) {
    return res.status(403).json({
      ok: false,
      codigo: 'LICENCIA_REQUERIDA',
      error: 'Acceso no autorizado. Se requiere una clave de licencia activa del sistema.'
    });
  }

  try {
    const lic = await comprobarLicenciaEnBD(clave);
    if (!lic) {
      return res.status(403).json({
        ok: false,
        codigo: 'LICENCIA_INVALIDA',
        error: 'La licencia del sistema es inválida o ha sido revocada por el administrador.'
      });
    }

    req.licencia = lic;
    next();
  } catch (err) {
    console.error('Error en middleware de licencia:', err);
    // En caso de corte momentáneo de red a Neon al validar
    return res.status(500).json({
      ok: false,
      error: 'No se pudo verificar la licencia con la base de datos.'
    });
  }
}

module.exports = {
  verificarLicencia,
  obtenerEstadoLicencia,
  validarLicenciaMiddleware,
  invalidarCacheLicencia
};
