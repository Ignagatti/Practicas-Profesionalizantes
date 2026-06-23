const API_URL = 'http://localhost:4000/api/insumos';

// Función auxiliar para manejar la respuesta del servidor de forma segura
const manejarRespuesta = async (respuesta) => {
    const contentType = respuesta.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
        data = await respuesta.json();
    } else {
        // Si el servidor manda texto plano por error, lo capturamos
        const texto = await respuesta.text();
        data = { error: texto || 'Error desconocido en el servidor' };
    }

    if (!respuesta.ok) {
        throw new Error(data.error || data.mensaje || 'Error en la petición');
    }

    return data;
};

export const obtenerInsumos = async () => {
    const respuesta = await fetch(API_URL);
    return await respuesta.json();
};

export const crearInsumo = async (insumo) => {
    const respuesta = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(insumo)
    });
    return manejarRespuesta(respuesta);
};

export const actualizarInsumo = async (id, insumo) => {
    const respuesta = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(insumo)
    });
    return manejarRespuesta(respuesta);
};

export const eliminarInsumo = async (id) => {
    const respuesta = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
    });
    return manejarRespuesta(respuesta);
};

export const ajustarPreciosPorcentaje = async (porcentaje, categoria = null) => {
    const respuesta = await fetch(`${API_URL}/ajustar-precios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ porcentaje, categoria })
    });
    return manejarRespuesta(respuesta);
};
