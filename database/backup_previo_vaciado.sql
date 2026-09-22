-- ========================================================
-- COPIA DE SEGURIDAD DEL SISTEMA ACUABER
-- Generado automáticamente: 2026-09-22T21:35:11.518Z
-- Base de Datos: Neon Cloud PostgreSQL
-- ========================================================

BEGIN;

-- 1. Limpieza de datos existentes
TRUNCATE TABLE "detalle_pago_compra" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "pago_insumo" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "factura_proveedor" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "detalle_pago_pedido" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "pagopedido" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "detalle_pedido" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "pedido" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "producto_insumo" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "insumo" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "producto" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "direccion" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "proveedor" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "cliente" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "metodo_pago" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "licencia" RESTART IDENTITY CASCADE;

-- 2. Inserción de datos respaldados

-- Registros de la tabla: licencia
INSERT INTO "licencia" ("id", "clave", "titular", "activa", "creada_en") VALUES (1, 'ACUABER-FABRICA-2026', 'Acuaber Fábrica Central', true, '2026-09-15T21:24:30.339Z');

-- Registros de la tabla: metodo_pago
INSERT INTO "metodo_pago" ("id_medio_pago", "tipo") VALUES (1, 'efectivo');
INSERT INTO "metodo_pago" ("id_medio_pago", "tipo") VALUES (2, 'transferencia');
INSERT INTO "metodo_pago" ("id_medio_pago", "tipo") VALUES (3, 'cheque');
INSERT INTO "metodo_pago" ("id_medio_pago", "tipo") VALUES (4, 'tarjeta');

-- Registros de la tabla: cliente
INSERT INTO "cliente" ("id_cliente", "nombre", "apellido", "telefono", "estado", "saldo", "cuit_cuil", "email", "razon_social", "eliminado_en") VALUES (1, 'Juan', 'Pérez', '3496412345', 'activo', '0.00', '30712345679', 'compras@muebleriaconfort.com', 'Mueblería Confort S.A.', NULL);
INSERT INTO "cliente" ("id_cliente", "nombre", "apellido", "telefono", "estado", "saldo", "cuit_cuil", "email", "razon_social", "eliminado_en") VALUES (2, 'María Laura', 'Gomez', '3424987654', 'activo', '514496.00', '27289998884', 'info@disenoyhogar.com', 'Diseño & Hogar', NULL);
INSERT INTO "cliente" ("id_cliente", "nombre", "apellido", "telefono", "estado", "saldo", "cuit_cuil", "email", "razon_social", "eliminado_en") VALUES (3, 'Carlos', 'Martínez', '3434112233', 'activo', '229900.00', '20254443332', 'estudio@martinez-arq.com', 'Estudio Arquitectura Moderna', NULL);
INSERT INTO "cliente" ("id_cliente", "nombre", "apellido", "telefono", "estado", "saldo", "cuit_cuil", "email", "razon_social", "eliminado_en") VALUES (4, 'Juan Ignacio', 'Moreyra', '3496501757', 'activo', '-20000.00', '20447825598', 'juanimoreyra773@gmail.com', 'Monotributo', NULL);

-- Registros de la tabla: proveedor
INSERT INTO "proveedor" ("id_proveedor", "nombre", "apellido", "telefono", "estado", "saldo", "cuit_cuil", "email", "razon_social", "eliminado_en") VALUES (1, 'Roberto', 'Alonso', '3496420111', 'activo', '0.00', '30554433221', 'ventas@maderaslitoral.com', 'Maderas del Litoral S.R.L.', NULL);
INSERT INTO "proveedor" ("id_proveedor", "nombre", "apellido", "telefono", "estado", "saldo", "cuit_cuil", "email", "razon_social", "eliminado_en") VALUES (2, 'Esteban', 'Rossi', '3424558899', 'activo', '85000.00', '30667788993', 'contacto@textilessantafe.com', 'Textiles Santa Fe S.A.', NULL);
INSERT INTO "proveedor" ("id_proveedor", "nombre", "apellido", "telefono", "estado", "saldo", "cuit_cuil", "email", "razon_social", "eliminado_en") VALUES (3, 'Ignacio', 'Vera', '3492445566', 'activo', '0.00', '30778899115', 'pedidos@lustrescentro.com', 'Lustres del Centro S.A.', NULL);

-- Registros de la tabla: direccion
INSERT INTO "direccion" ("id_direccion", "calle", "codigo_postal", "provincia", "ciudad", "numero", "id_cliente", "id_proveedor") VALUES (1, 'Av. Colonizadores', '3080', 'Santa Fe', 'Esperanza', '1250', NULL, 1);
INSERT INTO "direccion" ("id_direccion", "calle", "codigo_postal", "provincia", "ciudad", "numero", "id_cliente", "id_proveedor") VALUES (2, 'Rivadavia', '3000', 'Santa Fe', 'Santa Fe', '3420', NULL, 2);
INSERT INTO "direccion" ("id_direccion", "calle", "codigo_postal", "provincia", "ciudad", "numero", "id_cliente", "id_proveedor") VALUES (3, 'Bv. Lehmann', '2300', 'Santa Fe', 'Rafaela', '540', NULL, 3);
INSERT INTO "direccion" ("id_direccion", "calle", "codigo_postal", "provincia", "ciudad", "numero", "id_cliente", "id_proveedor") VALUES (4, 'San Martín', '3080', 'Santa Fe', 'Esperanza', '850', 1, NULL);
INSERT INTO "direccion" ("id_direccion", "calle", "codigo_postal", "provincia", "ciudad", "numero", "id_cliente", "id_proveedor") VALUES (5, 'Bv. Pellegrini', '3000', 'Santa Fe', 'Santa Fe', '2100', 2, NULL);
INSERT INTO "direccion" ("id_direccion", "calle", "codigo_postal", "provincia", "ciudad", "numero", "id_cliente", "id_proveedor") VALUES (6, 'Urquiza', '3100', 'Entre Ríos', 'Paraná', '1020', 3, NULL);
INSERT INTO "direccion" ("id_direccion", "calle", "codigo_postal", "provincia", "ciudad", "numero", "id_cliente", "id_proveedor") VALUES (7, 'Entre Rios', '3080', 'Santa Fe', 'Esperanza', '422', 4, NULL);

-- Registros de la tabla: producto
INSERT INTO "producto" ("id_producto", "modelo", "tela", "color_lustre", "estado", "fecha_pedido", "cantidad", "precio", "observaciones", "id_cliente", "activo", "eliminado_en") VALUES (1, 'Silla Nórdica', 'Lino Spazio', 'Paraíso Natural', 'terminado', '2026-08-26T03:00:00.000Z', 4, '33500.00', 'Juego para comedor principal', 1, true, NULL);
INSERT INTO "producto" ("id_producto", "modelo", "tela", "color_lustre", "estado", "fecha_pedido", "cantidad", "precio", "observaciones", "id_cliente", "activo", "eliminado_en") VALUES (2, 'Sillón Berger', 'Pana Antimanchas', 'Petiribí', 'en_produccion', '2026-09-05T03:00:00.000Z', 2, '59700.00', 'Para sala de estar', 2, true, NULL);
INSERT INTO "producto" ("id_producto", "modelo", "tela", "color_lustre", "estado", "fecha_pedido", "cantidad", "precio", "observaciones", "id_cliente", "activo", "eliminado_en") VALUES (3, 'Banqueta Alta', 'Chenille Soft', 'Blanco Laqueado', 'terminado', '2026-09-10T03:00:00.000Z', 4, '28200.00', 'Para barra desayunadora', 1, true, NULL);
INSERT INTO "producto" ("id_producto", "modelo", "tela", "color_lustre", "estado", "fecha_pedido", "cantidad", "precio", "observaciones", "id_cliente", "activo", "eliminado_en") VALUES (4, 'Mesa Comedor 1.60m', 'Sin Tela', 'Roble Oscuro', 'pendiente', '2026-08-31T03:00:00.000Z', 1, '95000.00', 'Para sala de reuniones', 3, true, NULL);
INSERT INTO "producto" ("id_producto", "modelo", "tela", "color_lustre", "estado", "fecha_pedido", "cantidad", "precio", "observaciones", "id_cliente", "activo", "eliminado_en") VALUES (5, 'Silla Vestida', 'Cuero Vacuno', 'Nogal Clásico', 'en_produccion', '2026-09-07T03:00:00.000Z', 6, '54800.00', 'Para comedor señorial', 2, true, NULL);
INSERT INTO "producto" ("id_producto", "modelo", "tela", "color_lustre", "estado", "fecha_pedido", "cantidad", "precio", "observaciones", "id_cliente", "activo", "eliminado_en") VALUES (6, 'Mesa Ratona', 'Sin Tela', 'Petiribí', 'pendiente', '2026-09-13T03:00:00.000Z', 1, '37200.00', 'Para sala de espera', 3, true, NULL);
INSERT INTO "producto" ("id_producto", "modelo", "tela", "color_lustre", "estado", "fecha_pedido", "cantidad", "precio", "observaciones", "id_cliente", "activo", "eliminado_en") VALUES (7, 'Banqueta Alta', 'Eco Cuero Premium', 'Negro Semi-mate', 'pendiente', '2026-09-15T03:00:00.000Z', 2, '27000.00', 'Stock de reposición', 1, true, NULL);
INSERT INTO "producto" ("id_producto", "modelo", "tela", "color_lustre", "estado", "fecha_pedido", "cantidad", "precio", "observaciones", "id_cliente", "activo", "eliminado_en") VALUES (8, 'Silla Nórdica', '', 'Blanco Laqueado', 'pendiente', '2026-09-15T03:00:00.000Z', 1, '31500.00', '', 4, true, NULL);

-- Registros de la tabla: insumo
INSERT INTO "insumo" ("id_insumo", "nombre", "categoria", "precio_unitario", "activo", "eliminado_en") VALUES (1, 'Silla Nórdica', 'Modelo', '18000.00', true, NULL);
INSERT INTO "insumo" ("id_insumo", "nombre", "categoria", "precio_unitario", "activo", "eliminado_en") VALUES (2, 'Silla Vestida', 'Modelo', '22000.00', true, NULL);
INSERT INTO "insumo" ("id_insumo", "nombre", "categoria", "precio_unitario", "activo", "eliminado_en") VALUES (3, 'Sillón Berger', 'Modelo', '45000.00', true, NULL);
INSERT INTO "insumo" ("id_insumo", "nombre", "categoria", "precio_unitario", "activo", "eliminado_en") VALUES (4, 'Banqueta Alta', 'Modelo', '14000.00', true, NULL);
INSERT INTO "insumo" ("id_insumo", "nombre", "categoria", "precio_unitario", "activo", "eliminado_en") VALUES (5, 'Mesa Comedor 1.60m', 'Modelo', '85000.00', true, NULL);
INSERT INTO "insumo" ("id_insumo", "nombre", "categoria", "precio_unitario", "activo", "eliminado_en") VALUES (6, 'Mesa Ratona', 'Modelo', '32000.00', true, NULL);
INSERT INTO "insumo" ("id_insumo", "nombre", "categoria", "precio_unitario", "activo", "eliminado_en") VALUES (7, 'Pana Antimanchas', 'Tela', '9500.00', true, NULL);
INSERT INTO "insumo" ("id_insumo", "nombre", "categoria", "precio_unitario", "activo", "eliminado_en") VALUES (8, 'Lino Spazio', 'Tela', '11000.00', true, NULL);
INSERT INTO "insumo" ("id_insumo", "nombre", "categoria", "precio_unitario", "activo", "eliminado_en") VALUES (9, 'Chenille Soft', 'Tela', '8200.00', true, NULL);
INSERT INTO "insumo" ("id_insumo", "nombre", "categoria", "precio_unitario", "activo", "eliminado_en") VALUES (10, 'Cuero Vacuno', 'Tela', '28000.00', true, NULL);
INSERT INTO "insumo" ("id_insumo", "nombre", "categoria", "precio_unitario", "activo", "eliminado_en") VALUES (11, 'Pana Rústica', 'Tela', '10500.00', true, NULL);
INSERT INTO "insumo" ("id_insumo", "nombre", "categoria", "precio_unitario", "activo", "eliminado_en") VALUES (12, 'Eco Cuero Premium', 'Tela', '7500.00', true, NULL);
INSERT INTO "insumo" ("id_insumo", "nombre", "categoria", "precio_unitario", "activo", "eliminado_en") VALUES (13, 'Paraíso Natural', 'Lustre', '4500.00', true, NULL);
INSERT INTO "insumo" ("id_insumo", "nombre", "categoria", "precio_unitario", "activo", "eliminado_en") VALUES (14, 'Petiribí', 'Lustre', '5200.00', true, NULL);
INSERT INTO "insumo" ("id_insumo", "nombre", "categoria", "precio_unitario", "activo", "eliminado_en") VALUES (15, 'Nogal Clásico', 'Lustre', '4800.00', true, NULL);
INSERT INTO "insumo" ("id_insumo", "nombre", "categoria", "precio_unitario", "activo", "eliminado_en") VALUES (16, 'Blanco Laqueado', 'Lustre', '6000.00', true, NULL);
INSERT INTO "insumo" ("id_insumo", "nombre", "categoria", "precio_unitario", "activo", "eliminado_en") VALUES (17, 'Roble Oscuro', 'Lustre', '5000.00', true, NULL);
INSERT INTO "insumo" ("id_insumo", "nombre", "categoria", "precio_unitario", "activo", "eliminado_en") VALUES (18, 'Negro Semi-mate', 'Lustre', '5500.00', true, NULL);

-- Registros de la tabla: pedido
INSERT INTO "pedido" ("id_pedido", "fecha_generacion", "vencimiento", "observaciones", "precio_total", "estado_facturacion", "nro_factura", "factura", "monto_adeudado", "estado_pago", "id_cliente") VALUES (1, '2026-08-26T21:53:49.181Z', '2026-09-10T03:00:00.000Z', 'Entregado y conforme', '162140.00', 'se_factura', 'A-0001-00008420', NULL, '0.00', 'pagado', 1);
INSERT INTO "pedido" ("id_pedido", "fecha_generacion", "vencimiento", "observaciones", "precio_total", "estado_facturacion", "nro_factura", "factura", "monto_adeudado", "estado_pago", "id_cliente") VALUES (4, '2026-09-10T21:53:49.181Z', '2026-09-30T03:00:00.000Z', 'Juego completo banquetas', '112800.00', 'no_se_factura', NULL, NULL, '0.00', 'pagado', 1);
INSERT INTO "pedido" ("id_pedido", "fecha_generacion", "vencimiento", "observaciones", "precio_total", "estado_facturacion", "nro_factura", "factura", "monto_adeudado", "estado_pago", "id_cliente") VALUES (2, '2026-09-05T21:53:49.181Z', '2026-09-22T03:00:00.000Z', 'Entrega en domicilio comercial', '119400.00', 'no_se_factura', NULL, NULL, '0.00', 'pagado', 2);
INSERT INTO "pedido" ("id_pedido", "fecha_generacion", "vencimiento", "observaciones", "precio_total", "estado_facturacion", "nro_factura", "factura", "monto_adeudado", "estado_pago", "id_cliente") VALUES (5, '2026-09-07T21:53:49.181Z', '2026-10-10T03:00:00.000Z', 'Juego de sillas comedor principal', '397848.00', 'se_factura', 'A-0001-00008422', NULL, '0.00', 'pagado', 2);
INSERT INTO "pedido" ("id_pedido", "fecha_generacion", "vencimiento", "observaciones", "precio_total", "estado_facturacion", "nro_factura", "factura", "monto_adeudado", "estado_pago", "id_cliente") VALUES (3, '2026-08-31T21:53:49.181Z', '2026-09-13T03:00:00.000Z', 'Mesa para sala de directorio', '114950.00', 'se_factura', 'A-0001-00008421', NULL, '0.00', 'pagado', 3);
INSERT INTO "pedido" ("id_pedido", "fecha_generacion", "vencimiento", "observaciones", "precio_total", "estado_facturacion", "nro_factura", "factura", "monto_adeudado", "estado_pago", "id_cliente") VALUES (7, '2026-09-16T06:20:48.056Z', '2026-10-15T03:00:00.000Z', NULL, '31500.00', 'no_se_factura', NULL, NULL, '20000.00', 'parcial', 4);

-- Registros de la tabla: detalle_pedido
INSERT INTO "detalle_pedido" ("id_detalle_pedido", "id_pedido", "id_producto") VALUES (1, 1, 1);
INSERT INTO "detalle_pedido" ("id_detalle_pedido", "id_pedido", "id_producto") VALUES (2, 2, 2);
INSERT INTO "detalle_pedido" ("id_detalle_pedido", "id_pedido", "id_producto") VALUES (3, 3, 4);
INSERT INTO "detalle_pedido" ("id_detalle_pedido", "id_pedido", "id_producto") VALUES (4, 4, 3);
INSERT INTO "detalle_pedido" ("id_detalle_pedido", "id_pedido", "id_producto") VALUES (5, 5, 5);
INSERT INTO "detalle_pedido" ("id_detalle_pedido", "id_pedido", "id_producto") VALUES (8, 7, 8);

-- Registros de la tabla: pagopedido
INSERT INTO "pagopedido" ("id_pago_pedido", "estado_pago", "monto_restante", "fecha_pago", "monto", "id_medio_pago") VALUES (1, 'pagado', '0.00', '2026-08-28T03:00:00.000Z', '162140.00', 2);
INSERT INTO "pagopedido" ("id_pago_pedido", "estado_pago", "monto_restante", "fecha_pago", "monto", "id_medio_pago") VALUES (2, 'parcial', '0.00', '2026-09-06T03:00:00.000Z', '60000.00', 1);
INSERT INTO "pagopedido" ("id_pago_pedido", "estado_pago", "monto_restante", "fecha_pago", "monto", "id_medio_pago") VALUES (3, 'pagado', '17200.00', '2026-09-11T03:00:00.000Z', '130000.00', 3);
INSERT INTO "pagopedido" ("id_pago_pedido", "estado_pago", "monto_restante", "fecha_pago", "monto", "id_medio_pago") VALUES (4, 'parcial', '0.00', '2026-09-09T03:00:00.000Z', '200000.00', 4);
INSERT INTO "pagopedido" ("id_pago_pedido", "estado_pago", "monto_restante", "fecha_pago", "monto", "id_medio_pago") VALUES (6, 'pagado', '0.00', '2026-09-22T03:00:00.000Z', '257248.00', 1);
INSERT INTO "pagopedido" ("id_pago_pedido", "estado_pago", "monto_restante", "fecha_pago", "monto", "id_medio_pago") VALUES (7, 'pagado', '0.00', '2026-09-22T03:00:00.000Z', '11500.00', 2);
INSERT INTO "pagopedido" ("id_pago_pedido", "estado_pago", "monto_restante", "fecha_pago", "monto", "id_medio_pago") VALUES (8, 'pagado', '0.00', '2026-09-22T03:00:00.000Z', '114950.00', 3);

-- Registros de la tabla: detalle_pago_pedido
INSERT INTO "detalle_pago_pedido" ("id_detalle_pago_pedido", "monto_usado", "id_pedido", "id_pago_pedido") VALUES (1, '162140.00', 1, 1);
INSERT INTO "detalle_pago_pedido" ("id_detalle_pago_pedido", "monto_usado", "id_pedido", "id_pago_pedido") VALUES (2, '60000.00', 2, 2);
INSERT INTO "detalle_pago_pedido" ("id_detalle_pago_pedido", "monto_usado", "id_pedido", "id_pago_pedido") VALUES (3, '112800.00', 4, 3);
INSERT INTO "detalle_pago_pedido" ("id_detalle_pago_pedido", "monto_usado", "id_pedido", "id_pago_pedido") VALUES (4, '200000.00', 5, 4);
INSERT INTO "detalle_pago_pedido" ("id_detalle_pago_pedido", "monto_usado", "id_pedido", "id_pago_pedido") VALUES (6, '59400.00', 2, 6);
INSERT INTO "detalle_pago_pedido" ("id_detalle_pago_pedido", "monto_usado", "id_pedido", "id_pago_pedido") VALUES (7, '197848.00', 5, 6);
INSERT INTO "detalle_pago_pedido" ("id_detalle_pago_pedido", "monto_usado", "id_pedido", "id_pago_pedido") VALUES (8, '11500.00', 7, 7);
INSERT INTO "detalle_pago_pedido" ("id_detalle_pago_pedido", "monto_usado", "id_pedido", "id_pago_pedido") VALUES (9, '114950.00', 3, 8);

-- Registros de la tabla: factura_proveedor
INSERT INTO "factura_proveedor" ("id_factura_proveedor", "precio_total", "vencimiento", "observaciones", "fecha_emision", "monto_adeudado", "estado_pago", "nro_factura_proveedor", "factura", "id_proveedor", "tipo_comprobante", "archivo_pdf") VALUES (1, '250000.00', '2026-09-10T03:00:00.000Z', 'Compra tableros paraíso y petiribí', '2026-08-26T03:00:00.000Z', '0.00', 'pagado', 'FC-0003-00019280', NULL, 1, 'factura', NULL);
INSERT INTO "factura_proveedor" ("id_factura_proveedor", "precio_total", "vencimiento", "observaciones", "fecha_emision", "monto_adeudado", "estado_pago", "nro_factura_proveedor", "factura", "id_proveedor", "tipo_comprobante", "archivo_pdf") VALUES (4, '120000.00', '2026-10-05T03:00:00.000Z', 'Madera de roble seleccionada', '2026-09-12T03:00:00.000Z', '0.00', 'pagado', 'FC-0003-00019340', NULL, 1, 'factura', NULL);
INSERT INTO "factura_proveedor" ("id_factura_proveedor", "precio_total", "vencimiento", "observaciones", "fecha_emision", "monto_adeudado", "estado_pago", "nro_factura_proveedor", "factura", "id_proveedor", "tipo_comprobante", "archivo_pdf") VALUES (2, '185000.00', '2026-09-19T03:00:00.000Z', 'Rollos de lino spazio y pana antimanchas', '2026-09-07T03:00:00.000Z', '85000.00', 'parcial', 'FC-0001-00045120', NULL, 2, 'factura', NULL);
INSERT INTO "factura_proveedor" ("id_factura_proveedor", "precio_total", "vencimiento", "observaciones", "fecha_emision", "monto_adeudado", "estado_pago", "nro_factura_proveedor", "factura", "id_proveedor", "tipo_comprobante", "archivo_pdf") VALUES (3, '74500.00', '2026-09-13T03:00:00.000Z', 'Lacas poliuretánicas y tintes nogal/blanco', '2026-08-31T03:00:00.000Z', '0.00', 'pagado', 'FC-0002-00008910', NULL, 3, 'factura', NULL);
INSERT INTO "factura_proveedor" ("id_factura_proveedor", "precio_total", "vencimiento", "observaciones", "fecha_emision", "monto_adeudado", "estado_pago", "nro_factura_proveedor", "factura", "id_proveedor", "tipo_comprobante", "archivo_pdf") VALUES (5, '80000.00', '2026-10-16T03:00:00.000Z', NULL, '2026-09-15T03:00:00.000Z', '0.00', 'pagado', 'FP-QA-0001', NULL, 3, 'factura', NULL);

-- Registros de la tabla: pago_insumo
INSERT INTO "pago_insumo" ("id_pago_insumo", "fecha_pago", "estado_pago", "monto", "monto_restante", "id_medio_pago") VALUES (1, '2026-08-28T03:00:00.000Z', 'pagado', '250000.00', '0.00', 2);
INSERT INTO "pago_insumo" ("id_pago_insumo", "fecha_pago", "estado_pago", "monto", "monto_restante", "id_medio_pago") VALUES (2, '2026-09-08T03:00:00.000Z', 'parcial', '100000.00', '0.00', 3);
INSERT INTO "pago_insumo" ("id_pago_insumo", "fecha_pago", "estado_pago", "monto", "monto_restante", "id_medio_pago") VALUES (3, '2026-09-13T03:00:00.000Z', 'pagado', '145000.00', '25000.00', 2);
INSERT INTO "pago_insumo" ("id_pago_insumo", "fecha_pago", "estado_pago", "monto", "monto_restante", "id_medio_pago") VALUES (7, '2026-09-22T03:00:00.000Z', 'pagado', '124500.00', '0.00', 1);
INSERT INTO "pago_insumo" ("id_pago_insumo", "fecha_pago", "estado_pago", "monto", "monto_restante", "id_medio_pago") VALUES (8, '2026-09-22T03:00:00.000Z', 'pagado', '30000.00', '0.00', 1);

-- Registros de la tabla: detalle_pago_compra
INSERT INTO "detalle_pago_compra" ("id_detalle_pago_compra", "monto_usado", "id_pago_insumo", "id_factura_proveedor") VALUES (1, '250000.00', 1, 1);
INSERT INTO "detalle_pago_compra" ("id_detalle_pago_compra", "monto_usado", "id_pago_insumo", "id_factura_proveedor") VALUES (2, '100000.00', 2, 2);
INSERT INTO "detalle_pago_compra" ("id_detalle_pago_compra", "monto_usado", "id_pago_insumo", "id_factura_proveedor") VALUES (3, '120000.00', 3, 4);
INSERT INTO "detalle_pago_compra" ("id_detalle_pago_compra", "monto_usado", "id_pago_insumo", "id_factura_proveedor") VALUES (8, '74500.00', 7, 3);
INSERT INTO "detalle_pago_compra" ("id_detalle_pago_compra", "monto_usado", "id_pago_insumo", "id_factura_proveedor") VALUES (9, '50000.00', 7, 5);
INSERT INTO "detalle_pago_compra" ("id_detalle_pago_compra", "monto_usado", "id_pago_insumo", "id_factura_proveedor") VALUES (10, '30000.00', 8, 5);

-- 3. Sincronización de secuencias serial
DO $$ 
      DECLARE
        col_name text;
        seq_name text;
      BEGIN
        SELECT column_name INTO col_name
        FROM information_schema.columns 
        WHERE table_name='licencia' AND column_default LIKE 'nextval%'
        LIMIT 1;

        IF col_name IS NOT NULL THEN
          seq_name := pg_get_serial_sequence('"licencia"', col_name);
          IF seq_name IS NOT NULL THEN
            EXECUTE 'SELECT setval(''' || seq_name || ''', coalesce((SELECT max("' || col_name || '") FROM "licencia"), 1), true)';
          END IF;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END $$;
DO $$ 
      DECLARE
        col_name text;
        seq_name text;
      BEGIN
        SELECT column_name INTO col_name
        FROM information_schema.columns 
        WHERE table_name='metodo_pago' AND column_default LIKE 'nextval%'
        LIMIT 1;

        IF col_name IS NOT NULL THEN
          seq_name := pg_get_serial_sequence('"metodo_pago"', col_name);
          IF seq_name IS NOT NULL THEN
            EXECUTE 'SELECT setval(''' || seq_name || ''', coalesce((SELECT max("' || col_name || '") FROM "metodo_pago"), 1), true)';
          END IF;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END $$;
DO $$ 
      DECLARE
        col_name text;
        seq_name text;
      BEGIN
        SELECT column_name INTO col_name
        FROM information_schema.columns 
        WHERE table_name='cliente' AND column_default LIKE 'nextval%'
        LIMIT 1;

        IF col_name IS NOT NULL THEN
          seq_name := pg_get_serial_sequence('"cliente"', col_name);
          IF seq_name IS NOT NULL THEN
            EXECUTE 'SELECT setval(''' || seq_name || ''', coalesce((SELECT max("' || col_name || '") FROM "cliente"), 1), true)';
          END IF;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END $$;
DO $$ 
      DECLARE
        col_name text;
        seq_name text;
      BEGIN
        SELECT column_name INTO col_name
        FROM information_schema.columns 
        WHERE table_name='proveedor' AND column_default LIKE 'nextval%'
        LIMIT 1;

        IF col_name IS NOT NULL THEN
          seq_name := pg_get_serial_sequence('"proveedor"', col_name);
          IF seq_name IS NOT NULL THEN
            EXECUTE 'SELECT setval(''' || seq_name || ''', coalesce((SELECT max("' || col_name || '") FROM "proveedor"), 1), true)';
          END IF;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END $$;
DO $$ 
      DECLARE
        col_name text;
        seq_name text;
      BEGIN
        SELECT column_name INTO col_name
        FROM information_schema.columns 
        WHERE table_name='direccion' AND column_default LIKE 'nextval%'
        LIMIT 1;

        IF col_name IS NOT NULL THEN
          seq_name := pg_get_serial_sequence('"direccion"', col_name);
          IF seq_name IS NOT NULL THEN
            EXECUTE 'SELECT setval(''' || seq_name || ''', coalesce((SELECT max("' || col_name || '") FROM "direccion"), 1), true)';
          END IF;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END $$;
DO $$ 
      DECLARE
        col_name text;
        seq_name text;
      BEGIN
        SELECT column_name INTO col_name
        FROM information_schema.columns 
        WHERE table_name='producto' AND column_default LIKE 'nextval%'
        LIMIT 1;

        IF col_name IS NOT NULL THEN
          seq_name := pg_get_serial_sequence('"producto"', col_name);
          IF seq_name IS NOT NULL THEN
            EXECUTE 'SELECT setval(''' || seq_name || ''', coalesce((SELECT max("' || col_name || '") FROM "producto"), 1), true)';
          END IF;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END $$;
DO $$ 
      DECLARE
        col_name text;
        seq_name text;
      BEGIN
        SELECT column_name INTO col_name
        FROM information_schema.columns 
        WHERE table_name='insumo' AND column_default LIKE 'nextval%'
        LIMIT 1;

        IF col_name IS NOT NULL THEN
          seq_name := pg_get_serial_sequence('"insumo"', col_name);
          IF seq_name IS NOT NULL THEN
            EXECUTE 'SELECT setval(''' || seq_name || ''', coalesce((SELECT max("' || col_name || '") FROM "insumo"), 1), true)';
          END IF;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END $$;
DO $$ 
      DECLARE
        col_name text;
        seq_name text;
      BEGIN
        SELECT column_name INTO col_name
        FROM information_schema.columns 
        WHERE table_name='producto_insumo' AND column_default LIKE 'nextval%'
        LIMIT 1;

        IF col_name IS NOT NULL THEN
          seq_name := pg_get_serial_sequence('"producto_insumo"', col_name);
          IF seq_name IS NOT NULL THEN
            EXECUTE 'SELECT setval(''' || seq_name || ''', coalesce((SELECT max("' || col_name || '") FROM "producto_insumo"), 1), true)';
          END IF;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END $$;
DO $$ 
      DECLARE
        col_name text;
        seq_name text;
      BEGIN
        SELECT column_name INTO col_name
        FROM information_schema.columns 
        WHERE table_name='pedido' AND column_default LIKE 'nextval%'
        LIMIT 1;

        IF col_name IS NOT NULL THEN
          seq_name := pg_get_serial_sequence('"pedido"', col_name);
          IF seq_name IS NOT NULL THEN
            EXECUTE 'SELECT setval(''' || seq_name || ''', coalesce((SELECT max("' || col_name || '") FROM "pedido"), 1), true)';
          END IF;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END $$;
DO $$ 
      DECLARE
        col_name text;
        seq_name text;
      BEGIN
        SELECT column_name INTO col_name
        FROM information_schema.columns 
        WHERE table_name='detalle_pedido' AND column_default LIKE 'nextval%'
        LIMIT 1;

        IF col_name IS NOT NULL THEN
          seq_name := pg_get_serial_sequence('"detalle_pedido"', col_name);
          IF seq_name IS NOT NULL THEN
            EXECUTE 'SELECT setval(''' || seq_name || ''', coalesce((SELECT max("' || col_name || '") FROM "detalle_pedido"), 1), true)';
          END IF;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END $$;
DO $$ 
      DECLARE
        col_name text;
        seq_name text;
      BEGIN
        SELECT column_name INTO col_name
        FROM information_schema.columns 
        WHERE table_name='pagopedido' AND column_default LIKE 'nextval%'
        LIMIT 1;

        IF col_name IS NOT NULL THEN
          seq_name := pg_get_serial_sequence('"pagopedido"', col_name);
          IF seq_name IS NOT NULL THEN
            EXECUTE 'SELECT setval(''' || seq_name || ''', coalesce((SELECT max("' || col_name || '") FROM "pagopedido"), 1), true)';
          END IF;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END $$;
DO $$ 
      DECLARE
        col_name text;
        seq_name text;
      BEGIN
        SELECT column_name INTO col_name
        FROM information_schema.columns 
        WHERE table_name='detalle_pago_pedido' AND column_default LIKE 'nextval%'
        LIMIT 1;

        IF col_name IS NOT NULL THEN
          seq_name := pg_get_serial_sequence('"detalle_pago_pedido"', col_name);
          IF seq_name IS NOT NULL THEN
            EXECUTE 'SELECT setval(''' || seq_name || ''', coalesce((SELECT max("' || col_name || '") FROM "detalle_pago_pedido"), 1), true)';
          END IF;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END $$;
DO $$ 
      DECLARE
        col_name text;
        seq_name text;
      BEGIN
        SELECT column_name INTO col_name
        FROM information_schema.columns 
        WHERE table_name='factura_proveedor' AND column_default LIKE 'nextval%'
        LIMIT 1;

        IF col_name IS NOT NULL THEN
          seq_name := pg_get_serial_sequence('"factura_proveedor"', col_name);
          IF seq_name IS NOT NULL THEN
            EXECUTE 'SELECT setval(''' || seq_name || ''', coalesce((SELECT max("' || col_name || '") FROM "factura_proveedor"), 1), true)';
          END IF;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END $$;
DO $$ 
      DECLARE
        col_name text;
        seq_name text;
      BEGIN
        SELECT column_name INTO col_name
        FROM information_schema.columns 
        WHERE table_name='pago_insumo' AND column_default LIKE 'nextval%'
        LIMIT 1;

        IF col_name IS NOT NULL THEN
          seq_name := pg_get_serial_sequence('"pago_insumo"', col_name);
          IF seq_name IS NOT NULL THEN
            EXECUTE 'SELECT setval(''' || seq_name || ''', coalesce((SELECT max("' || col_name || '") FROM "pago_insumo"), 1), true)';
          END IF;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END $$;
DO $$ 
      DECLARE
        col_name text;
        seq_name text;
      BEGIN
        SELECT column_name INTO col_name
        FROM information_schema.columns 
        WHERE table_name='detalle_pago_compra' AND column_default LIKE 'nextval%'
        LIMIT 1;

        IF col_name IS NOT NULL THEN
          seq_name := pg_get_serial_sequence('"detalle_pago_compra"', col_name);
          IF seq_name IS NOT NULL THEN
            EXECUTE 'SELECT setval(''' || seq_name || ''', coalesce((SELECT max("' || col_name || '") FROM "detalle_pago_compra"), 1), true)';
          END IF;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END $$;

COMMIT;
-- ========================================================
-- FIN DEL RESPALDO
-- ========================================================
