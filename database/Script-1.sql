INSERT INTO Cliente (Nombre, Apellido, Telefono, Estado, Saldo, Cuit_Cuil, Email, Razon_Social) VALUES
('Juan Carlos', 'Muller', '3496-451234', 'activo', 0.00, '20-34123456-9', 'juan.muller@email.com', NULL),
('Mueblería', 'Esperanza S.A.', '3496-420011', 'activo', 150000.00, '30-55667788-4', 'ventas@mueblesesperanza.com', 'Muebles Esperanza S.A.'),
('Anahí', 'García', '342-5112233', 'activo', -25000.00, '27-40123456-2', 'anahi.g@email.com', NULL);

INSERT INTO Insumo (Nombre, Categoria, Precio_Unitario) VALUES
('Madera Pino', 'Materia Prima', 1500.00),
('Tornillos x 100', 'Ferretería', 2500.00);

INSERT INTO Producto 
(Modelo, Tela, Color_Lustre, Estado, Cantidad, Precio, Id_Cliente) VALUES
('Sillón Maitena', 'Chenille Gris', 'Natural', 'en_produccion', 2, 45000.00, 1),
('Silla Imperial', 'Pana Roja', 'Nogal', 'terminado', 4, 12000.00, 1),
('Sillón Windsor', 'Lino Beige', 'Blanco', 'pendiente', 1, 55000.00, 2);
