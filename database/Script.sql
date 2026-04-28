-- Creación de tipos ENUM
CREATE TYPE estado_cliente AS ENUM ('activo', 'bloqueado');
CREATE TYPE estado_producto AS ENUM ('pendiente', 'en_producción', 'terminado', 'enviado', 'cancelado');
CREATE TYPE estado_facturacion AS ENUM ('sin_factura', 'pendiente_facturacion', 'facturado');
CREATE TYPE tipo_pago AS ENUM ('efectivo', 'transferencia', 'cheque');
CREATE TYPE estado_general AS ENUM ('activo', 'inactivo'); -- Para proveedores

-- 1. Tabla Metodo_Pago
CREATE TABLE Metodo_Pago (
    Id_Medio_Pago SERIAL PRIMARY KEY,
    Tipo tipo_pago NOT NULL
);

-- 2. Tabla Cliente
CREATE TABLE Cliente (
    Id_Cliente SERIAL PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL,
    Apellido VARCHAR(100) NOT NULL,
    Telefono VARCHAR(20),
    Estado estado_cliente DEFAULT 'activo',
    Saldo DECIMAL(15,2) DEFAULT 0.00,
    CUIT_CUIL VARCHAR(20),
    Email VARCHAR(150),
    Razon_Social VARCHAR(100)
);

-- 3. Tabla Proveedor
CREATE TABLE Proveedor (
    Id_Proveedor SERIAL PRIMARY KEY,
    Nombre VARCHAR(100),
    Apellido VARCHAR(100),
    Telefono VARCHAR(20),
    Estado estado_general DEFAULT 'activo',
    Saldo DECIMAL(15,2) DEFAULT 0.00,
    CUIT VARCHAR(20),
    Email VARCHAR(150),
    Razon_Social VARCHAR(100)
);

-- 4. Tabla Direccion
CREATE TABLE Direccion (
    Id_Direccion SERIAL PRIMARY KEY,
    Calle VARCHAR(100),
    Codigo_Postal VARCHAR(20),
    Provincia VARCHAR(100),
    Ciudad VARCHAR(100),
    Numero VARCHAR(20),
    Id_Cliente INT REFERENCES Cliente(Id_Cliente),
    Id_Proveedor INT REFERENCES Proveedor(Id_Proveedor)
);

-- 5. Tabla Producto
CREATE TABLE Producto (
    Id_Producto SERIAL PRIMARY KEY,
    Modelo VARCHAR(100),
    Tela VARCHAR(50),
    Color_Lustre VARCHAR(50),
    Estado estado_producto DEFAULT 'pendiente',
    Fecha_Pedido DATE,
    Cantidad INT,
    Precio DECIMAL(10,2),
    Id_Cliente INT REFERENCES Cliente(Id_Cliente)
);

-- 6. Tabla Insumo
CREATE TABLE Insumo (
    Id_Insumo SERIAL PRIMARY KEY,
    Nombre VARCHAR(100),
    Categoria VARCHAR(100),
    Precio_Unitario DECIMAL(15,2)
);

-- 7. Tabla Producto_Insumo (Relación N:M)
CREATE TABLE Producto_Insumo (
    Id_Producto_Insumo SERIAL PRIMARY KEY,
    Costo_Total_Insumo DECIMAL(15,2),
    Id_Producto INT REFERENCES Producto(Id_Producto),
    Id_Insumo INT REFERENCES Insumo(Id_Insumo)
);

-- 8. Tabla Pedido
CREATE TABLE Pedido (
    Id_Pedido SERIAL PRIMARY KEY,
    Fecha_Generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Vencimiento DATE,
    Observaciones TEXT,
    Precio_Total DECIMAL(15,2),
    Estado_Facturacion estado_facturacion DEFAULT 'sin_factura',
    Nro_Factura VARCHAR(50),
    Factura BYTEA, -- BLOB en Postgres es preferiblemente BYTEA
    Monto_Adeudado DECIMAL(15,2),
    Estado_Pago VARCHAR(20),
    Id_Cliente INT REFERENCES Cliente(Id_Cliente)
);

-- 9. Tabla Detalle_Pedido
CREATE TABLE Detalle_Pedido (
    Id_Detalle_Pedido SERIAL PRIMARY KEY,
    Id_Pedido INT REFERENCES Pedido(Id_Pedido),
    Id_Producto INT REFERENCES Producto(Id_Producto)
);

-- 10. Tabla PagoPedido
CREATE TABLE PagoPedido (
    Id_Pago_Pedido SERIAL PRIMARY KEY,
    Estado_Pago VARCHAR(20),
    Monto_Restante DECIMAL(15,2),
    Fecha_Pago DATE,
    Monto DECIMAL(15,2),
    Id_Medio_Pago INT REFERENCES Metodo_Pago(Id_Medio_Pago)
);

-- 11. Tabla Detalle_Pago_Pedido
CREATE TABLE Detalle_Pago_Pedido (
    Id_Detalle_Pago_Pedido SERIAL PRIMARY KEY,
    Monto_Usado DECIMAL(15,2),
    Id_Pedido INT REFERENCES Pedido(Id_Pedido),
    Id_Pago_Pedido INT REFERENCES PagoPedido(Id_Pago_Pedido)
);

-- 12. Tabla Factura_Proveedor
CREATE TABLE Factura_Proveedor (
    Id_Factura_Proveedor SERIAL PRIMARY KEY,
    Precio_Total DECIMAL(15,2),
    Vencimiento DATE,
    Observaciones TEXT,
    Fecha_Emision DATE,
    Monto_Adeudado DECIMAL(15,2),
    Estado_Pago VARCHAR(20),
    Nro_Factura_Proveedor VARCHAR(50),
    Factura BYTEA,
    Id_Proveedor INT REFERENCES Proveedor(Id_Proveedor)
);

-- 13. Tabla Pago_Insumo
CREATE TABLE Pago_Insumo (
    Id_Pago_Insumo SERIAL PRIMARY KEY,
    Fecha_Pago DATE,
    Estado_Pago VARCHAR(20),
    Monto DECIMAL(15,2),
    Monto_Restante DECIMAL(15,2),
    Id_Medio_Pago INT REFERENCES Metodo_Pago(Id_Medio_Pago)
);

-- 14. Tabla Detalle_Pago_Compra
CREATE TABLE Detalle_Pago_Compra (
    Id_Detalle_Pago_Compra SERIAL PRIMARY KEY,
    Monto_Usado DECIMAL(15,2),
    Id_Pago_Insumo INT REFERENCES Pago_Insumo(Id_Pago_Insumo),
    Id_Factura_Proveedor INT REFERENCES Factura_Proveedor(Id_Factura_Proveedor)
);