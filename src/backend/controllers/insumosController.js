const pool = require('../config/db');

// OBTENER TODOS
const obtenerInsumos = async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM Insumo ORDER BY Id_Insumo ASC');
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error en obtenerInsumos:', error.message);
        res.status(500).json({ error: 'Error al buscar los insumos' });
    }
};

// CREAR NUEVO
const crearInsumo = async (req, res) => {
    const { nombre, categoria, precio_unitario } = req.body;

    // VALIDACIONES
    if (!nombre || !categoria || precio_unitario === undefined) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }
    if (precio_unitario < 0) return res.status(400).json({ error: 'El precio no puede ser negativo' });

    try {
        const query = 'INSERT INTO Insumo (Nombre, Categoria, Precio_Unitario) VALUES ($1, $2, $3) RETURNING *';
        const valores = [nombre, categoria, precio_unitario];
        const resultado = await pool.query(query, valores);
        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error('Error en crearInsumo:', error.message);
        res.status(500).json({ error: 'Error al guardar el insumo' });
    }
};

// ACTUALIZAR (EDITAR)
const actualizarInsumo = async (req, res) => {
    const { id } = req.params;
    const { nombre, categoria, precio_unitario } = req.body;

    try {
        const query = 'UPDATE Insumo SET Nombre = $1, Categoria = $2, Precio_Unitario = $3 WHERE Id_Insumo = $4 RETURNING *';
        const valores = [nombre, categoria, precio_unitario, id];
        const resultado = await pool.query(query, valores);

        if (resultado.rowCount === 0) return res.status(404).json({ error: 'Insumo no encontrado' });
        res.json(resultado.rows[0]);
    } catch (error) {
        console.error('Error en actualizarInsumo:', error.message);
        res.status(500).json({ error: 'Error al actualizar el insumo' });
    }
};

// BORRAR
const eliminarInsumo = async (req, res) => {
    const { id } = req.params;
    try {
        const resultado = await pool.query('DELETE FROM Insumo WHERE Id_Insumo = $1', [id]);
        if (resultado.rowCount === 0) return res.status(404).json({ error: 'Insumo no encontrado' });
        res.json({ mensaje: `Insumo con ID ${id} eliminado con éxito` });
    } catch (error) {
        console.error('Error en eliminarInsumo:', error.message);
        res.status(500).json({ error: 'Error al eliminar el insumo. Quizás esté siendo usado por un producto.' });
    }
};

// AJUSTAR PRECIOS POR PORCENTAJE
const ajustarPrecios = async (req, res) => {
    const { porcentaje, categoria } = req.body;
    
    if (porcentaje === undefined) {
        return res.status(400).json({ error: 'Falta el porcentaje de ajuste' });
    }

    try {
        let query;
        let valores;
        const factor = 1 + (porcentaje / 100);

        if (categoria && categoria !== 'todos' && categoria !== '') {
            query = 'UPDATE Insumo SET Precio_Unitario = Precio_Unitario * $1 WHERE Categoria = $2 RETURNING *';
            valores = [factor, categoria];
        } else {
            query = 'UPDATE Insumo SET Precio_Unitario = Precio_Unitario * $1 RETURNING *';
            valores = [factor];
        }

        const resultado = await pool.query(query, valores);
        res.json({ mensaje: `Se actualizaron ${resultado.rowCount} insumos`, conteo: resultado.rowCount });
    } catch (error) {
        console.error('Error en ajustarPrecios:', error.message);
        res.status(500).json({ error: 'Error al ajustar los precios' });
    }
};

module.exports = {
    obtenerInsumos,
    crearInsumo,
    actualizarInsumo,
    eliminarInsumo,
    ajustarPrecios
};
