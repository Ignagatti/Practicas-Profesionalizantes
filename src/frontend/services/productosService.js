const API_URL = 'http://localhost:4000/api/productos';

// OBTENER TODOS
export const obtenerProductos = async () => {
    const respuesta = await fetch(API_URL);
    return await respuesta.json();
};

// CREAR PRODUCTO
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

// ACTUALIZAR PRODUCTO
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

// ELIMINAR PRODUCTO
export const eliminarProducto = async (id) => {
    const respuesta = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
    });

    const data = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) throw new Error(data.error || 'Error al eliminar producto');

    return data;
};

// ========================================================
// NUEVA FUNCIÓN: PASAR DE EN PRODUCCIÓN A TERMINADO (MASIVO)
// ========================================================
export const terminarProductosMasivo = async (ids) => {
    const respuesta = await fetch(`${API_URL}/estado/terminar-masivo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
    });

    const data = await respuesta.json();
    if (!respuesta.ok) throw new Error(data.error || 'Error al actualizar el estado de los productos');
    return data;
};