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
            `SELECT 
                p.*,
                COALESCE(
                    (SELECT SUM(Monto_Restante) 
                     FROM Pago_Insumo 
                     WHERE Id_Pago_Insumo IN (
                         SELECT DISTINCT dpc.Id_Pago_Insumo 
                         FROM Detalle_Pago_Compra dpc 
                         JOIN Factura_Proveedor fp ON fp.Id_Factura_Proveedor = dpc.Id_Factura_Proveedor 
                         WHERE fp.Id_Proveedor = p.Id_Proveedor
                     )
                    ), 0
                ) AS total_a_favor,
                COALESCE(
                    (SELECT SUM(Monto_Adeudado) 
                     FROM Factura_Proveedor 
                     WHERE Id_Proveedor = p.Id_Proveedor AND Estado_Pago <> 'pagado'
                    ), 0
                ) AS total_en_contra
            FROM Proveedor p
            ORDER BY p.Id_Proveedor ASC`
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
            `SELECT 
                p.*,
                COALESCE(
                    (SELECT SUM(Monto_Restante) 
                     FROM Pago_Insumo 
                     WHERE Id_Pago_Insumo IN (
                         SELECT DISTINCT dpc.Id_Pago_Insumo 
                         FROM Detalle_Pago_Compra dpc 
                         JOIN Factura_Proveedor fp ON fp.Id_Factura_Proveedor = dpc.Id_Factura_Proveedor 
                         WHERE fp.Id_Proveedor = p.Id_Proveedor
                     )
                    ), 0
                ) AS total_a_favor,
                COALESCE(
                    (SELECT SUM(Monto_Adeudado) 
                     FROM Factura_Proveedor 
                     WHERE Id_Proveedor = p.Id_Proveedor AND Estado_Pago <> 'pagado'
                    ), 0
                ) AS total_en_contra
            FROM Proveedor p
            WHERE p.Id_Proveedor = $1`,
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

const eliminarProveedor = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar dependencias: ¿Tiene facturas activas o muertas?
        const historial = await pool.query(
            "SELECT 1 FROM Factura_Proveedor WHERE Id_Proveedor = $1 LIMIT 1",
            [id]
        );

        if (historial.rows.length > 0) {
            // Regla amigable pedida por el usuario: Aviso crudo
            return res.status(400).json({
                error: "No se puede eliminar porque este proveedor posee detalles e historial (facturas registradas). Si desea inhabilitarlo, utilice la función de Bloquear."
            });
        }

        // Si no posee historia, procedemos de forma transaccional (hard delete)
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Borrar direcciones asociadas primero (cascada manual)
            await client.query('DELETE FROM Direccion WHERE Id_Proveedor = $1', [id]);
            
            // Borrar proveedor
            const deleteResult = await client.query('DELETE FROM Proveedor WHERE Id_Proveedor = $1 RETURNING *', [id]);
            
            await client.query('COMMIT');
            
            if (deleteResult.rows.length === 0) {
                return res.status(404).json({ error: 'Proveedor no encontrado' });
            }
            
            res.json({
                bloqueado: false,
                mensaje: "El proveedor estaba libre de historial y fue eliminado permanentemente."
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error en eliminarProveedor:', error.message);
        res.status(500).json({ error: 'Error al intentar eliminar el proveedor' });
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
    eliminarDireccionProveedor,
    eliminarProveedor
};