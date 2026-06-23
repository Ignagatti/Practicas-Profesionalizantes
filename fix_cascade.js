const pool = require('./src/backend/config/db');

async function fixCascade() {
    try {
        console.log("Configurando borrado en cascada...");
        
        // 1. Producto_Insumo
        await pool.query('ALTER TABLE Producto_Insumo DROP CONSTRAINT IF EXISTS producto_insumo_id_producto_fkey');
        await pool.query('ALTER TABLE Producto_Insumo ADD CONSTRAINT producto_insumo_id_producto_fkey FOREIGN KEY (Id_Producto) REFERENCES Producto(Id_Producto) ON DELETE CASCADE');

        // 2. Detalle_Pedido
        await pool.query('ALTER TABLE Detalle_Pedido DROP CONSTRAINT IF EXISTS detalle_pedido_id_producto_fkey');
        await pool.query('ALTER TABLE Detalle_Pedido ADD CONSTRAINT detalle_pedido_id_producto_fkey FOREIGN KEY (Id_Producto) REFERENCES Producto(Id_Producto) ON DELETE CASCADE');

        console.log("¡Todo listo! Ya puedes borrar productos sin restricciones.");
        process.exit(0);
    } catch (error) {
        console.error("Error al configurar cascada:", error.message);
        process.exit(1);
    }
}

fixCascade();
