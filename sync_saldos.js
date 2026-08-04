
const pool = require('./src/backend/config/db.js');
(async () => {
    try {
        const client = await pool.connect();
        
        const clientes = await client.query('SELECT Id_Cliente FROM Cliente');
        for (const row of clientes.rows) {
            const id = row.id_cliente;
            
            const pagosResult = await client.query(\
                SELECT SUM(Monto_Restante) as total_a_favor
                FROM PagoPedido
                WHERE Id_Pago_Pedido IN (
                    SELECT DISTINCT dpp.Id_Pago_Pedido
                    FROM Detalle_Pago_Pedido dpp
                    JOIN Pedido p ON p.Id_Pedido = dpp.Id_Pedido
                    WHERE p.Id_Cliente = \
                )
            \, [id]);
            
            const pedidosResult = await client.query(\
                SELECT SUM(Monto_Adeudado) as total_en_contra
                FROM Pedido
                WHERE Id_Cliente = \
            \, [id]);
            
            const totalAFavor = Number(pagosResult.rows[0].total_a_favor || 0);
            const totalEnContra = Number(pedidosResult.rows[0].total_en_contra || 0);
            
            const trueSaldo = totalAFavor - totalEnContra;
            
            await client.query('UPDATE Cliente SET Saldo = \ WHERE Id_Cliente = \', [trueSaldo, id]);
            console.log('Cliente ' + id + ' -> ' + trueSaldo);
        }
        
        const proveedores = await client.query('SELECT Id_Proveedor FROM Proveedor');
        for (const row of proveedores.rows) {
            const id = row.id_proveedor;
            
            const pagosResult = await client.query(\
                SELECT SUM(Monto_Restante) as total_a_favor
                FROM Pago_Insumo
                WHERE Id_Pago_Insumo IN (
                    SELECT DISTINCT dpc.Id_Pago_Insumo
                    FROM Detalle_Pago_Compra dpc
                    JOIN Factura_Proveedor fp ON fp.Id_Factura_Proveedor = dpc.Id_Factura_Proveedor
                    WHERE fp.Id_Proveedor = \
                )
            \, [id]);
            
            const facturasResult = await client.query(\
                SELECT SUM(Monto_Adeudado) as total_en_contra
                FROM Factura_Proveedor
                WHERE Id_Proveedor = \
            \, [id]);
            
            const totalAFavor = Number(pagosResult.rows[0].total_a_favor || 0);
            const totalEnContra = Number(facturasResult.rows[0].total_en_contra || 0);
            
            const trueSaldo = totalAFavor - totalEnContra;
            
            await client.query('UPDATE Proveedor SET Saldo = \ WHERE Id_Proveedor = \', [trueSaldo, id]);
            console.log('Proveedor ' + id + ' -> ' + trueSaldo);
        }
        
        client.release();
    } catch(e) {
        console.error(e);
    } finally {
        pool.end();
    }
})();

