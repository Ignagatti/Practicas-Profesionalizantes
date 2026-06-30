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

const obtenerDireccionesProveedor = async (req, res) => {
    try {
        const { id } = req.params;

        const proveedorExiste = await pool.query(
            'SELECT * FROM Proveedor WHERE Id_Proveedor = $1',
            [id]
        );

        if (proveedorExiste.rows.length === 0) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }

        const resultado = await pool.query(
            'SELECT * FROM Direccion WHERE Id_Proveedor = $1 ORDER BY Id_Direccion ASC',
            [id]
        );

        res.json(resultado.rows);
    } catch (error) {
        console.error('Error en obtenerDireccionesProveedor:', error.message);
        res.status(500).json({ error: 'Error al obtener direcciones del proveedor' });
    }
};

const crearDireccionProveedor = async (req, res) => {
    try {
        const { id } = req.params;
        const { Calle, Codigo_Postal, Provincia, Ciudad, Numero } = req.body;

        if (!Calle || !Provincia || !Ciudad || !Numero) {
            return res.status(400).json({
                error: 'Calle, Provincia, Ciudad y Número son obligatorios'
            });
        }

        const proveedorExiste = await pool.query(
            'SELECT * FROM Proveedor WHERE Id_Proveedor = $1',
            [id]
        );

        if (proveedorExiste.rows.length === 0) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }

        const resultado = await pool.query(
            `INSERT INTO Direccion
            (Calle, Codigo_Postal, Provincia, Ciudad, Numero, Id_Cliente, Id_Proveedor)
            VALUES ($1, $2, $3, $4, $5, NULL, $6)
            RETURNING *`,
            [Calle, Codigo_Postal || null, Provincia, Ciudad, Numero, id]
        );

        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error('Error en crearDireccionProveedor:', error.message);
        res.status(500).json({ error: 'Error al crear dirección del proveedor' });
    }
};

const actualizarDireccionProveedor = async (req, res) => {
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
               AND Id_Proveedor IS NOT NULL
             RETURNING *`,
            [Calle, Codigo_Postal || null, Provincia, Ciudad, Numero, idDireccion]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'Dirección no encontrada' });
        }

        res.json(resultado.rows[0]);
    } catch (error) {
        console.error('Error en actualizarDireccionProveedor:', error.message);
        res.status(500).json({ error: 'Error al actualizar dirección del proveedor' });
    }
};

const eliminarDireccionProveedor = async (req, res) => {
    try {
        const { idDireccion } = req.params;

        const resultado = await pool.query(
            `DELETE FROM Direccion
             WHERE Id_Direccion = $1
               AND Id_Proveedor IS NOT NULL
             RETURNING *`,
            [idDireccion]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'Dirección no encontrada' });
        }

        res.json({ mensaje: 'Dirección eliminada correctamente' });
    } catch (error) {
        console.error('Error en eliminarDireccionProveedor:', error.message);
        res.status(500).json({ error: 'Error al eliminar dirección del proveedor' });
    }
};

module.exports = {
    obtenerProveedores,
    obtenerProveedorPorId,
    crearProveedor,
    actualizarProveedor,
    bloquearProveedor,
    desbloquearProveedor,
    obtenerDireccionesProveedor,
    crearDireccionProveedor,
    actualizarDireccionProveedor,
    eliminarDireccionProveedor
};