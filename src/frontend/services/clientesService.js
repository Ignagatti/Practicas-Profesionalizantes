const API_URL = 'http://localhost:4000/api/clientes';

export const obtenerClientes = async () => {
    const respuesta = await fetch(API_URL);
    return await respuesta.json();
};

export const crearCliente = async (cliente) => {
    const respuesta = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(cliente)
    });

    const data = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(data.error || 'Error al crear cliente');
    }

    return data;
};

export const actualizarCliente = async (id, cliente) => {
    const respuesta = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(cliente)
    });

    const data = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(data.error || 'Error al actualizar cliente');
    }

    return data;
};

export const bloquearCliente = async (id) => {
    const respuesta = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
    });

    const data = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(data.error || 'Error al bloquear cliente');
    }

    return data;
};

export const desbloquearCliente = async (id) => {
    const respuesta = await fetch(`${API_URL}/${id}/desbloquear`, {
        method: 'PUT'
    });

    const data = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(data.error || 'Error al desbloquear cliente');
    }

    return data;
};