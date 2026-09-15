-- =====================================================
-- SISTEMA DE GESTIÓN ACUABER - BASE DE DATOS POSTGRESQL
-- Estructura Definitiva 100% Sincronizada con Neon Cloud
-- =====================================================

-- =========================
-- LIMPIEZA TOTAL
-- =========================
DROP TABLE IF EXISTS Detalle_Pago_Compra CASCADE;
DROP TABLE IF EXISTS Pago_Insumo CASCADE;
DROP TABLE IF EXISTS Factura_Proveedor CASCADE;
DROP TABLE IF EXISTS Detalle_Pago_Pedido CASCADE;
DROP TABLE IF EXISTS PagoPedido CASCADE;
DROP TABLE IF EXISTS Detalle_Pedido CASCADE;
DROP TABLE IF EXISTS Pedido CASCADE;
DROP TABLE IF EXISTS Producto_Insumo CASCADE;
DROP TABLE IF EXISTS Insumo CASCADE;
DROP TABLE IF EXISTS Producto CASCADE;
DROP TABLE IF EXISTS Direccion CASCADE;
DROP TABLE IF EXISTS Proveedor CASCADE;
DROP TABLE IF EXISTS Cliente CASCADE;
DROP TABLE IF EXISTS Metodo_Pago CASCADE;
DROP TABLE IF EXISTS Licencia CASCADE;

DROP TYPE IF EXISTS estado_entidad CASCADE;
DROP TYPE IF EXISTS estado_producto CASCADE;
DROP TYPE IF EXISTS estado_facturacion CASCADE;
DROP TYPE IF EXISTS tipo_pago CASCADE;
DROP TYPE IF EXISTS estado_pago CASCADE;

-- =========================
-- TIPOS ENUM
-- =========================
CREATE TYPE estado_entidad AS ENUM (
    'activo',
    'bloqueado'
);

CREATE TYPE estado_producto AS ENUM (
    'pendiente',
    'en_produccion',
    'terminado',
    'enviado',
    'cancelado'
);

CREATE TYPE estado_facturacion AS ENUM (
    'sin_factura',
    'no_se_factura',
    'se_factura'
);

CREATE TYPE tipo_pago AS ENUM (
    'efectivo',
    'transferencia',
    'cheque',
    'tarjeta'
);

CREATE TYPE estado_pago AS ENUM (
    'pendiente',
    'parcial',
    'pagado'
);

-- =========================
-- TABLAS DEL SISTEMA
-- =========================

-- Tabla de Licencias y Activación del Sistema
CREATE TABLE Licencia (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    titular VARCHAR(100) DEFAULT 'Acuaber Fábrica',
    activa BOOLEAN DEFAULT true,
    creada_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Métodos de Pago
CREATE TABLE Metodo_Pago (
    Id_Medio_Pago SERIAL PRIMARY KEY,
    Tipo tipo_pago NOT NULL
);

-- Clientes
CREATE TABLE Cliente (
    Id_Cliente SERIAL PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL,
    Apellido VARCHAR(100) NOT NULL,
    Telefono VARCHAR(20) NOT NULL,
    Estado estado_entidad DEFAULT 'activo',
    Saldo DECIMAL(15,2) DEFAULT 0,
    CUIT_CUIL VARCHAR(20) NOT NULL UNIQUE,
    Email VARCHAR(150) NOT NULL,
    Razon_Social VARCHAR(100),
    eliminado_en TIMESTAMP WITH TIME ZONE,

    CONSTRAINT chk_saldo_rango 
        CHECK (Saldo BETWEEN -1000000000 AND 1000000000),

    CONSTRAINT chk_email_cliente
        CHECK (Email LIKE '%@%.%')
);

-- Proveedores
CREATE TABLE Proveedor (
    Id_Proveedor SERIAL PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL,
    Apellido VARCHAR(100) NOT NULL,
    Telefono VARCHAR(20) NOT NULL,
    Estado estado_entidad DEFAULT 'activo',
    Saldo DECIMAL(15,2) DEFAULT 0,
    CUIT_CUIL VARCHAR(20) NOT NULL UNIQUE,
    Email VARCHAR(150) NOT NULL,
    Razon_Social VARCHAR(100),
    eliminado_en TIMESTAMP WITH TIME ZONE,

    CONSTRAINT chk_saldo_proveedor_rango
        CHECK (Saldo BETWEEN 0 AND 1000000000),

    CONSTRAINT chk_email_proveedor
        CHECK (Email LIKE '%@%.%')
);

-- Direcciones (Clientes y Proveedores)
CREATE TABLE Direccion (
    Id_Direccion SERIAL PRIMARY KEY,
    Calle VARCHAR(100),
    Codigo_Postal VARCHAR(20),
    Provincia VARCHAR(100),
    Ciudad VARCHAR(100),
    Numero VARCHAR(20),
    Id_Cliente INT,
    Id_Proveedor INT,
    CONSTRAINT fk_dir_cliente FOREIGN KEY (Id_Cliente) REFERENCES Cliente(Id_Cliente),
    CONSTRAINT fk_dir_proveedor FOREIGN KEY (Id_Proveedor) REFERENCES Proveedor(Id_Proveedor),
    CONSTRAINT chk_direccion_exclusiva CHECK (
        (Id_Cliente IS NOT NULL AND Id_Proveedor IS NULL) OR
        (Id_Cliente IS NULL AND Id_Proveedor IS NOT NULL)
    )
);

-- Productos
CREATE TABLE Producto (
    Id_Producto SERIAL PRIMARY KEY,
    Modelo VARCHAR(100),
    Tela VARCHAR(50),
    Color_Lustre VARCHAR(50),
    Estado estado_producto DEFAULT 'pendiente',
    Fecha_Pedido DATE,
    Cantidad INT CHECK (Cantidad > 0),
    Precio DECIMAL(10,2) CHECK (Precio >= 0),
    Observaciones TEXT,
    Id_Cliente INT,
    activo BOOLEAN DEFAULT true,
    eliminado_en TIMESTAMP WITH TIME ZONE,

    CONSTRAINT fk_producto_cliente
        FOREIGN KEY (Id_Cliente)
        REFERENCES Cliente(Id_Cliente)
);

-- Insumos (con soft-delete)
CREATE TABLE Insumo (
    Id_Insumo SERIAL PRIMARY KEY,
    Nombre VARCHAR(100),
    Categoria VARCHAR(100),
    Precio_Unitario DECIMAL(15,2) CHECK (Precio_Unitario >= 0),
    activo BOOLEAN DEFAULT true,
    eliminado_en TIMESTAMP WITH TIME ZONE
);

-- Relación Producto e Insumo
CREATE TABLE Producto_Insumo (
    Id_Producto_Insumo SERIAL PRIMARY KEY,
    Costo_Total_Insumo DECIMAL(15,2) CHECK (Costo_Total_Insumo >= 0),
    Id_Producto INT REFERENCES Producto(Id_Producto),
    Id_Insumo INT REFERENCES Insumo(Id_Insumo),
    UNIQUE (Id_Producto, Id_Insumo)
);

-- Pedidos
CREATE TABLE Pedido (
    Id_Pedido SERIAL PRIMARY KEY,
    Fecha_Generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Vencimiento DATE,
    Observaciones TEXT,
    Precio_Total DECIMAL(15,2) CHECK (Precio_Total >= 0),
    Estado_Facturacion estado_facturacion DEFAULT 'sin_factura',
    Nro_Factura VARCHAR(50),
    Factura BYTEA,
    Monto_Adeudado DECIMAL(15,2) CHECK (Monto_Adeudado >= 0),
    Estado_Pago estado_pago DEFAULT 'pendiente',
    Id_Cliente INT REFERENCES Cliente(Id_Cliente)
);

-- Detalle de Pedido
CREATE TABLE Detalle_Pedido (
    Id_Detalle_Pedido SERIAL PRIMARY KEY,
    Id_Pedido INT REFERENCES Pedido(Id_Pedido),
    Id_Producto INT REFERENCES Producto(Id_Producto),

    CONSTRAINT unique_producto_en_pedido
        UNIQUE (Id_Producto)
);

-- Pagos de Pedidos (Cobros a Clientes)
CREATE TABLE PagoPedido (
    Id_Pago_Pedido SERIAL PRIMARY KEY,
    Estado_Pago estado_pago,
    Monto_Restante DECIMAL(15,2) CHECK (Monto_Restante >= 0),
    Fecha_Pago DATE,
    Monto DECIMAL(15,2) CHECK (Monto >= 0),
    Id_Medio_Pago INT REFERENCES Metodo_Pago(Id_Medio_Pago)
);

-- Detalle Imputación Pago Pedido
CREATE TABLE Detalle_Pago_Pedido (
    Id_Detalle_Pago_Pedido SERIAL PRIMARY KEY,
    Monto_Usado DECIMAL(15,2) CHECK (Monto_Usado >= 0),
    Id_Pedido INT REFERENCES Pedido(Id_Pedido),
    Id_Pago_Pedido INT REFERENCES PagoPedido(Id_Pago_Pedido)
);

-- Facturas de Proveedor
CREATE TABLE Factura_Proveedor (
    Id_Factura_Proveedor SERIAL PRIMARY KEY,
    Precio_Total DECIMAL(15,2) CHECK (Precio_Total >= 0),
    Vencimiento DATE,
    Observaciones TEXT,
    Fecha_Emision DATE,
    Monto_Adeudado DECIMAL(15,2) CHECK (Monto_Adeudado >= 0),
    Estado_Pago estado_pago,
    Nro_Factura_Proveedor VARCHAR(50),
    Factura BYTEA,
    Id_Proveedor INT REFERENCES Proveedor(Id_Proveedor),
    tipo_comprobante VARCHAR(20) DEFAULT 'factura',
    archivo_pdf VARCHAR(255)
);

-- Pagos a Proveedores por Insumos
CREATE TABLE Pago_Insumo (
    Id_Pago_Insumo SERIAL PRIMARY KEY,
    Fecha_Pago DATE,
    Estado_Pago estado_pago,
    Monto DECIMAL(15,2) CHECK (Monto >= 0),
    Monto_Restante DECIMAL(15,2) CHECK (Monto_Restante >= 0),
    Id_Medio_Pago INT REFERENCES Metodo_Pago(Id_Medio_Pago)
);

-- Detalle Imputación Pago Compra
CREATE TABLE Detalle_Pago_Compra (
    Id_Detalle_Pago_Compra SERIAL PRIMARY KEY,
    Monto_Usado DECIMAL(15,2) CHECK (Monto_Usado >= 0),
    Id_Pago_Insumo INT REFERENCES Pago_Insumo(Id_Pago_Insumo),
    Id_Factura_Proveedor INT REFERENCES Factura_Proveedor(Id_Factura_Proveedor)
);

-- =====================================================
-- DATOS INICIALES PREDETERMINADOS (SEEDS)
-- =====================================================

-- Métodos de Pago
INSERT INTO Metodo_Pago (Id_Medio_Pago, Tipo) VALUES 
    (1, 'efectivo'),
    (2, 'transferencia'),
    (3, 'cheque'),
    (4, 'tarjeta')
ON CONFLICT (Id_Medio_Pago) DO NOTHING;

-- Licencia Inicial del Software
INSERT INTO Licencia (clave, titular, activa) VALUES 
    ('ACUABER-FABRICA-2026', 'Acuaber Fábrica Central', true)
ON CONFLICT (clave) DO NOTHING;
