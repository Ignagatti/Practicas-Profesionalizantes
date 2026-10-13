const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno desde multiples ubicaciones posibles (local y empaquetado)
dotenv.config();
dotenv.config({ path: path.join(__dirname, '../../../.env') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

// Fallback por defecto a la base de datos de Neon Cloud configurada para la entrega
const DEFAULT_DATABASE_URL = "postgresql://neondb_owner:npg_qDz2RFItbiA8@ep-steep-smoke-ay5b02jw-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=verify-full";

const connectionString = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;

const isLocalDb = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

const sslOption = isLocalDb
    ? false
    : { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true' || process.env.NODE_ENV === 'production' };

const pool = new Pool({
    connectionString: connectionString,
    ssl: sslOption
});

module.exports = pool;