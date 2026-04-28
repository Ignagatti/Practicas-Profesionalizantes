-- 1. BORRAR TABLAS EXISTENTES (Limpieza)
-- El orden es inverso a la creación para no romper las relaciones (foreign keys)
DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS clientes;

-- 2. CREAR TABLAS NUEVAS
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(200),
    telefono VARCHAR(20),
    saldo DECIMAL(10,2) DEFAULT 0.00
);

CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    descripcion VARCHAR(100) NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    stock_actual INTEGER DEFAULT 0
);

CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10,2),
    estado VARCHAR(20) DEFAULT 'Pendiente'
);




