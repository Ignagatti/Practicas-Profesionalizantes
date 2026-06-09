document.getElementById('btn-cargar').addEventListener('click', async () => {
    try {
        const respuesta = await fetch('http://localhost:4000/api/productos');
        
        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status}`);
        }

        const productos = await respuesta.json();
        
        const lista = document.getElementById('lista-productos');
        lista.innerHTML = ''; // Limpiar la lista antes de agregar

        productos.forEach(prod => {
            const li = document.createElement('li');
            // Usamos las columnas de tu base de datos: modelo, tela, precio
            li.textContent = `Modelo: ${prod.modelo} | Tela: ${prod.tela || 'N/A'} | Precio: $${prod.precio}`;
            lista.appendChild(li);
        });
    } catch (error) {
        console.error('Error al obtener productos:', error);
        alert('Hubo un error al cargar los productos. Revisá la consola.');
    }
});
