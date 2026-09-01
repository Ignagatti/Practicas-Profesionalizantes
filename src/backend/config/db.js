const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno desde multiples ubicaciones posibles (local y empaquetado)
dotenv.config();
dotenv.config({ path: path.join(__dirname, '../../../.env') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

// URL por defecto de la base de datos en la nube (Neon Postgres)
const NEON_DEFAULT_URL = "postgresql://neondb_owner:npg_qDz2RFItbiA8@ep-steep-smoke-ay5b02jw-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=verify-full";

const connectionString = process.env.DATABASE_URL || NEON_DEFAULT_URL;

const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

module.exports = pool;