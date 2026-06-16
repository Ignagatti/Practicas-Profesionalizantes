const API_URL = 'http://localhost:4000/api/insumos';

export const obtenerInsumos = async () => {
    const respuesta = await fetch(API_URL);
    return await respuesta.json();
};

export const crearInsumo = async (insumo) => {
    const respuesta = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(insumo)
    });

    const data = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(data.error || 'Error al crear insumo');
    }

    return data;
};

export const actualizarInsumo = async (id, insumo) => {
    const respuesta = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(insumo)
    });

    const data = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(data.error || 'Error al actualizar insumo');
    }

    return data;
};

export const eliminarInsumo = async (id) => {
    const respuesta = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
    });

    const data = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(data.error || 'Error al eliminar insumo');
    }

    return data;
};
