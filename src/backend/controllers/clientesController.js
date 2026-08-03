// src/backend/controllers/clientesController.js
const pool = require('../config/db'); // Traemos el cable de conexión

const validarEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

const validarCliente = (cliente) => {
    if (!cliente) {
        return 'No se recibieron datos del cliente';
    }

    const { Nombre, Apellido, Telefono, CUIT_CUIL, Email } = cliente;

    if (!Nombre || !Apellido || !Telefono || !CUIT_CUIL || !Email) {
        return 'Todos los campos obligatorios deben estar completos';
    }

    if (!validarEmail(Email)) {
        return 'El email no tiene un formato válido';
    }

    return null;
};


const obtenerClientes = async (req, res) => {
    try {
        const resultado = await pool.query(
            'SELECT * FROM Cliente ORDER BY Id_Cliente ASC'
        );

        res.json(resultado.rows);
    } catch (error) {
        console.error('Error en obtenerClientes:', error.message);
        res.status(500).json({ error: 'Error al obtener clientes' });
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
        console.error('Error en obtenerClientePorId:', error.message);
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

        const resultado = await pool.query(
            `INSERT INTO Cliente 
            (Nombre, Apellido, Telefono, CUIT_CUIL, Email, Razon_Social, Estado)
            VALUES ($1, $2, $3, $4, $5, $6, 'activo')
            RETURNING *`,
            [Nombre, Apellido, Telefono, CUIT_CUIL, Email, Razon_Social || null]
        );

        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error('Error en crearCliente:', error.message);

        if (error.code === '23505') {
            return res.status(400).json({ error: 'El CUIT/CUIL ya está registrado' });
        }

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

        const { Nombre, Apellido, Telefono, CUIT_CUIL, Email, Razon_Social } = req.body;

        const resultado = await pool.query(
            `UPDATE Cliente
             SET Nombre = $1,
                 Apellido = $2,
                 Telefono = $3,
                 CUIT_CUIL = $4,
                 Email = $5,
                 Razon_Social = $6
             WHERE Id_Cliente = $7
             RETURNING *`,
            [Nombre, Apellido, Telefono, CUIT_CUIL, Email, Razon_Social || null, id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.json(resultado.rows[0]);
    } catch (error) {
        console.error('Error en actualizarCliente:', error.message);

        if (error.code === '23505') {
            return res.status(400).json({ error: 'El CUIT/CUIL ya está registrado' });
        }

        res.status(500).json({ error: 'Error al actualizar cliente' });
    }
};

const bloquearCliente = async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await pool.query(
            `UPDATE Cliente
             SET Estado = 'bloqueado'
             WHERE Id_Cliente = $1
             RETURNING *`,
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.json({
            mensaje: 'Cliente bloqueado correctamente',
            cliente: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error en bloquearCliente:', error.message);
        res.status(500).json({ error: 'Error al bloquear cliente' });
    }
};

const desbloquearCliente = async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await pool.query(
            `UPDATE Cliente
             SET Estado = 'activo'
             WHERE Id_Cliente = $1
             RETURNING *`,
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.json({
            mensaje: 'Cliente desbloqueado correctamente',
            cliente: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error en desbloquearCliente:', error.message);
        res.status(500).json({ error: 'Error al desbloquear cliente' });
    }
};

const obtenerDireccionesCliente = async (req, res) => {
    try {
        const { id } = req.params;

        const clienteExiste = await pool.query(
            'SELECT * FROM Cliente WHERE Id_Cliente = $1',
            [id]
        );

        if (clienteExiste.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        const resultado = await pool.query(
            'SELECT * FROM Direccion WHERE Id_Cliente = $1 ORDER BY Id_Direccion ASC',
            [id]
        );

        res.json(resultado.rows);
    } catch (error) {
        console.error('Error en obtenerDireccionesCliente:', error.message);
        res.status(500).json({ error: 'Error al obtener direcciones del cliente' });
    }
};

const crearDireccionCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const { Calle, Codigo_Postal, Provincia, Ciudad, Numero } = req.body;

        if (!Calle || !Provincia || !Ciudad || !Numero) {
            return res.status(400).json({
                error: 'Calle, Provincia, Ciudad y Número son obligatorios'
            });
        }

        const clienteExiste = await pool.query(
            'SELECT * FROM Cliente WHERE Id_Cliente = $1',
            [id]
        );

        if (clienteExiste.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        const resultado = await pool.query(
            `INSERT INTO Direccion
            (Calle, Codigo_Postal, Provincia, Ciudad, Numero, Id_Cliente, Id_Proveedor)
            VALUES ($1, $2, $3, $4, $5, $6, NULL)
            RETURNING *`,
            [Calle, Codigo_Postal || null, Provincia, Ciudad, Numero, id]
        );

        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error('Error en crearDireccionCliente:', error.message);
        res.status(500).json({ error: 'Error al crear dirección del cliente' });
    }
};

const actualizarDireccionCliente = async (req, res) => {
    try {
        const { idDireccion } = req.params;
        const { Calle, Codigo_Postal, Provincia, Ciudad, Numero } = req.body;

        if (!Calle || !Provincia || !Ciudad || !Numero) {
            return res.status(400).json({
                error: 'Calle, Provincia, Ciudad y Número son obligatorios'
            });
        }

        const resultado = await pool.query(
            `UPDATE Direccion
             SET Calle = $1,
                 Codigo_Postal = $2,
                 Provincia = $3,
                 Ciudad = $4,
                 Numero = $5
             WHERE Id_Direccion = $6
               AND Id_Cliente IS NOT NULL
             RETURNING *`,
            [Calle, Codigo_Postal || null, Provincia, Ciudad, Numero, idDireccion]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'Dirección no encontrada' });
        }

        res.json(resultado.rows[0]);
    } catch (error) {
        console.error('Error en actualizarDireccionCliente:', error.message);
        res.status(500).json({ error: 'Error al actualizar dirección' });
    }
};

const eliminarDireccionCliente = async (req, res) => {
    try {
        const { idDireccion } = req.params;

        const resultado = await pool.query(
            `DELETE FROM Direccion
             WHERE Id_Direccion = $1
               AND Id_Cliente IS NOT NULL
             RETURNING *`,
            [idDireccion]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'Dirección no encontrada' });
        }

        res.json({ mensaje: 'Dirección eliminada correctamente' });
    } catch (error) {
        console.error('Error en eliminarDireccionCliente:', error.message);
        res.status(500).json({ error: 'Error al eliminar dirección' });
    }
};

module.exports = {
    obtenerClientes,
    obtenerClientePorId,
    crearCliente,
    actualizarCliente,
    bloquearCliente,
    desbloquearCliente,
    obtenerDireccionesCliente,
    crearDireccionCliente,
    actualizarDireccionCliente,
    eliminarDireccionCliente
};