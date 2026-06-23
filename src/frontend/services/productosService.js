const API_URL = 'http://localhost:4000/api/productos';

export const obtenerProductos = async () => {
    const respuesta = await fetch(API_URL);
    return await respuesta.json();
};

export const crearProducto = async (producto) => {
    const respuesta = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(producto)
    });
    const data = await respuesta.json();
    if (!respuesta.ok) throw new Error(data.error || 'Error al crear producto');
    return data;
};

export const actualizarProducto = async (id, producto) => {
    const respuesta = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(producto)
    });
    const data = await respuesta.json();
    if (!respuesta.ok) throw new Error(data.error || 'Error al actualizar producto');
    return data;
};

export const eliminarProducto = async (id) => {
    const respuesta = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
    });
    
    if (!respuesta.ok) {
        const data = await respuesta.json().catch(() => ({}));
        throw new Error(data.error || 'Error al eliminar producto');
    }
    
    return await respuesta.json().catch(() => ({ mensaje: 'Eliminado' }));
};
