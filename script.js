const pool = require('./src/backend/config/db.js');
(async () => {
    try {
        await pool.query('BEGIN');
        await pool.query('UPDATE Cliente SET Saldo = 0');
        await pool.query('UPDATE Proveedor SET Saldo = 0');
        
        await pool.query(`UPDATE Cliente c SET Saldo = Saldo - COALESCE(subs.total, 0) FROM (SELECT Id_Cliente, SUM(Precio_Total) as total FROM Pedido GROUP BY Id_Cliente) subs WHERE c.Id_Cliente = subs.Id_Cliente`);
        
        await pool.query(`UPDATE Cliente c SET Saldo = Saldo + COALESCE(subs.total, 0) FROM (
            SELECT p.Id_Cliente, SUM(pp.Monto) as total FROM PagoPedido pp
            JOIN (SELECT MIN(Id_Pedido) as Id_Pedido, Id_Pago_Pedido FROM Detalle_Pago_Pedido GROUP BY Id_Pago_Pedido) dpp ON dpp.Id_Pago_Pedido = pp.Id_Pago_Pedido
            JOIN Pedido p ON p.Id_Pedido = dpp.Id_Pedido GROUP BY p.Id_Cliente
        ) subs WHERE c.Id_Cliente = subs.Id_Cliente`);
        
        await pool.query(`UPDATE Proveedor pr SET Saldo = Saldo - COALESCE(subs.total, 0) FROM (SELECT Id_Proveedor, SUM(Precio_Total) as total FROM Factura_Proveedor GROUP BY Id_Proveedor) subs WHERE pr.Id_Proveedor = subs.Id_Proveedor`);
        
        await pool.query(`UPDATE Proveedor pr SET Saldo = Saldo + COALESCE(subs.total, 0) FROM (
            SELECT fp.Id_Proveedor, SUM(pi.Monto) as total FROM Pago_Insumo pi
            JOIN (SELECT MIN(Id_Factura_Proveedor) as Id_Factura_Proveedor, Id_Pago_Insumo FROM Detalle_Pago_Compra GROUP BY Id_Pago_Insumo) dpc ON dpc.Id_Pago_Insumo = pi.Id_Pago_Insumo
            JOIN Factura_Proveedor fp ON fp.Id_Factura_Proveedor = dpc.Id_Factura_Proveedor GROUP BY fp.Id_Proveedor
        ) subs WHERE pr.Id_Proveedor = subs.Id_Proveedor`);
        
        await pool.query('COMMIT');
        console.log('Saldos recalculados en base a facturas previas');
    } catch (e) {
        await pool.query('ROLLBACK');
        console.error(e);
    } finally {
        pool.end();
    }
})();
