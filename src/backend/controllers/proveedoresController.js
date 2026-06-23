const pool = require('../config/db');

const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validarProveedor = (proveedor) => {
    if (!proveedor) {
        return 'No se recibieron datos del proveedor';
    }

    const { Nombre, Apellido, Telefono, CUIT_CUIL, Email } = proveedor;

    if (!Nombre || !Apellido || !Telefono || !CUIT_CUIL || !Email) {
        return 'Todos los campos obligatorios deben estar completos';
    }

    if (!validarEmail(Email)) {
        return 'El email no tiene un formato válido';
    }

    return null;
};

const obtenerProveedores = async (req, res) => {
    try {
        const resultado = await pool.query(
            'SELECT * FROM Proveedor ORDER BY Id_Proveedor ASC'
        );

        res.json(resultado.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener proveedores' });
    }
};

const obtenerProveedorPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await pool.query(
            'SELECT * FROM Proveedor WHERE Id_Proveedor = $1',
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }

        res.json(resultado.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener proveedor' });
    }
};

const crearProveedor = async (req, res) => {
    try {
        const errorValidacion = validarProveedor(req.body);

        if (errorValidacion) {
            return res.status(400).json({ error: errorValidacion });
        }

        const { Nombre, Apellido, Telefono, CUIT_CUIL, Email, Razon_Social } = req.body;

        const resultado = await pool.query(
            `INSERT INTO Proveedor
            (Nombre, Apellido, Telefono, CUIT_CUIL, Email, Razon_Social, Estado)
            VALUES ($1, $2, $3, $4, $5, $6, 'activo')
            RETURNING *`,
            [Nombre, Apellido, Telefono, CUIT_CUIL, Email, Razon_Social || null]
        );

        res.status(201).json(resultado.rows[0]);
        } catch (error) {
        console.error('Error en crearProveedor:', error);

        if (error.code === '23505') {
            return res.status(400).json({ error: 'El CUIT/CUIL ya está registrado' });
        }

        res.status(500).json({ 
            error: 'Error al crear proveedor',
            detalle: error.message 
        });
    }
};

const actualizarProveedor = async (req, res) => {
    try {
        const { id } = req.params;

        const errorValidacion = validarProveedor(req.body);

        if (errorValidacion) {
            return res.status(400).json({ error: errorValidacion });
        }

        const { Nombre, Apellido, Telefono, CUIT_CUIL, Email, Razon_Social } = req.body;

        const resultado = await pool.query(
            `UPDATE Proveedor
             SET Nombre = $1,
                 Apellido = $2,
                 Telefono = $3,
                 CUIT_CUIL = $4,
                 Email = $5,
                 Razon_Social = $6
             WHERE Id_Proveedor = $7
             RETURNING *`,
            [Nombre, Apellido, Telefono, CUIT_CUIL, Email, Razon_Social || null, id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }

        res.json(resultado.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ error: 'El CUIT/CUIL ya está registrado' });
        }

        res.status(500).json({ error: 'Error al actualizar proveedor' });
    }
};

const bloquearProveedor = async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await pool.query(
            `UPDATE Proveedor
             SET Estado = 'bloqueado'
             WHERE Id_Proveedor = $1
             RETURNING *`,
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }

        res.json({
            mensaje: 'Proveedor bloqueado correctamente',
            proveedor: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error en bloquearProveedor:', error);

        res.status(500).json({
            error: 'Error al bloquear proveedor',
            detalle: error.message
        });
    }
};

const desbloquearProveedor = async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await pool.query(
            `UPDATE Proveedor
             SET Estado = 'activo'
             WHERE Id_Proveedor = $1
             RETURNING *`,
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }

        res.json({
            mensaje: 'Proveedor desbloqueado correctamente',
            proveedor: resultado.rows[0]
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al desbloquear proveedor' });
    }
};

module.exports = {
    obtenerProveedores,
    obtenerProveedorPorId,
    crearProveedor,
    actualizarProveedor,
    bloquearProveedor,
    desbloquearProveedor
};