// src/backend/controllers/clientesController.js
const pool = require('../config/db'); // Traemos el cable de conexión


const validarCliente = ({ Nombre, Apellido, Telefono, CUIT_CUIL, Email }) => {
    if (!Nombre || !Apellido || !Telefono || !CUIT_CUIL || !Email) {
        return 'Todos los campos son obligatorios';
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailValido.test(Email)) {
        return 'El email no tiene un formato válido';
    }

    return null;
};

// Creamos la función asíncrona para traer los clientes
const obtenerClientes = async (req, res) => {
    try {
        // IMPORTANTE: Respetamos la mayúscula de la tabla "Cliente" de tu Script.sql
        const resultado = await pool.query('SELECT * FROM Cliente ORDER BY Id_Cliente ASC');

        // Mandamos las filas (.rows) de la tabla directo al navegador o frontend en formato JSON
        res.json(resultado.rows);

    } catch (error) {
        // Si algo sale mal (ej: escribiste mal la tabla), se registra acá
        console.error('Error en obtenerClientes:', error.message);
        res.status(500).send('Error interno del servidor al buscar los clientes');
    }
};

const obtenerClientePorId = async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await pool.query(
            'SELECT * FROM Cliente WHERE Id_Cliente = $1',
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.json(resultado.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener cliente' });
    }
};

const crearCliente = async (req, res) => {
    try {
        const errorValidacion = validarCliente(req.body);

        if (errorValidacion) {
            return res.status(400).json({ error: errorValidacion });
        }

        const { Nombre, Apellido, Telefono, CUIT_CUIL, Email, Razon_Social } = req.body;

        const cuitExistente = await pool.query(
            'SELECT * FROM Cliente WHERE CUIT_CUIL = $1',
            [CUIT_CUIL]
        );

        if (cuitExistente.rows.length > 0) {
            return res.status(400).json({ error: 'El CUIT/CUIL ya está registrado' });
        }

        const resultado = await pool.query(
            `INSERT INTO Cliente 
            (Nombre, Apellido, Telefono, CUIT_CUIL, Email, Razon_Social)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [Nombre, Apellido, Telefono, CUIT_CUIL, Email, Razon_Social || null]
        );

        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear cliente' });
    }
};

const actualizarCliente = async (req, res) => {
    try {
        const { id } = req.params;

        const errorValidacion = validarCliente(req.body);

        if (errorValidacion) {
            return res.status(400).json({ error: errorValidacion });
        }

        const { Nombre, Apellido, Telefono, Estado, CUIT_CUIL, Email, Razon_Social } = req.body;

        const resultado = await pool.query(
            `UPDATE Cliente
             SET Nombre = $1,
                 Apellido = $2,
                 Telefono = $3,
                 Estado = $4,
                 CUIT_CUIL = $5,
                 Email = $6,
                 Razon_Social = $7
             WHERE Id_Cliente = $8
             RETURNING *`,
            [Nombre, Apellido, Telefono, Estado || 'activo', CUIT_CUIL, Email, Razon_Social || null, id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.json(resultado.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar cliente' });
    }
};

const eliminarCliente = async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await pool.query(
            'DELETE FROM Cliente WHERE Id_Cliente = $1 RETURNING *',
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.json({ mensaje: 'Cliente eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar cliente' });
    }
};

// Exportamos la función entre llaves para que la carpeta /routes la pueda usar
module.exports = {
    obtenerClientes,
    obtenerClientePorId,
    crearCliente,
    actualizarCliente,
    eliminarCliente
};