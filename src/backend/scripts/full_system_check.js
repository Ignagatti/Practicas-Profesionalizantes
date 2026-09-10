require("dotenv").config();
const db = require("../config/db");

async function checkSystem() {
  console.log("=================================================");
  console.log("🚀 INICIANDO AUDITORÍA GENERAL DEL SISTEMA");
  console.log("=================================================\n");

  const results = [];
  const errors = [];

  // 1. BASE DE DATOS
  try {
    const resDb = await db.query("SELECT NOW() as current_time, current_database() as db_name, version()");
    results.push(`✅ Conexión con PostgreSQL en la nube (${resDb.rows[0].db_name}): OK`);
  } catch (err) {
    errors.push(`❌ Error en Base de Datos: ${err.message}`);
  }

  // 2. TABLAS Y SOFT DELETE
  const tablas = [
    "Cliente",
    "Proveedor",
    "Insumo",
    "Producto",
    "Pedido",
    "Factura_Proveedor",
    "Pago_Insumo",
    "PagoPedido",
    "Detalle_Pago_Compra",
    "Detalle_Pago_Pedido",
    "Metodo_Pago"
  ];

  for (const tabla of tablas) {
    try {
      const res = await db.query(`SELECT count(*) as total FROM ${tabla}`);
      results.push(`✅ Tabla ${tabla.padEnd(20)}: ${res.rows[0].total} registros`);
    } catch (err) {
      errors.push(`❌ Error en tabla ${tabla}: ${err.message}`);
    }
  }

  // 3. VERIFICAR ENDPOINTS HTTP (API REST)
  const endpoints = [
    { url: "http://localhost:4000/api/clientes", nombre: "GET /api/clientes" },
    { url: "http://localhost:4000/api/proveedores", nombre: "GET /api/proveedores" },
    { url: "http://localhost:4000/api/insumos", nombre: "GET /api/insumos" },
    { url: "http://localhost:4000/api/productos", nombre: "GET /api/productos" },
    { url: "http://localhost:4000/api/pedidos", nombre: "GET /api/pedidos" },
    { url: "http://localhost:4000/api/facturasProveedor", nombre: "GET /api/facturasProveedor" },
    { url: "http://localhost:4000/api/pagos?tipo=proveedor", nombre: "GET /api/pagos (proveedor)" },
    { url: "http://localhost:4000/api/pagos?tipo=cliente", nombre: "GET /api/pagos (cliente)" },
    { url: "http://localhost:4000/api/saldos", nombre: "GET /api/saldos" },
    { url: "http://localhost:4000/api/movimientos", nombre: "GET /api/movimientos" },
  ];

  console.log("\n--- Comprobando Endpoints API REST ---");
  for (const ep of endpoints) {
    try {
      const response = await fetch(ep.url);
      if (response.ok) {
        const data = await response.json();
        const count = Array.isArray(data) ? data.length : (data.pagos || data.pedidos || data.facturas || []).length;
        results.push(`✅ ${ep.nombre.padEnd(30)}: HTTP ${response.status} OK (${count} items)`);
      } else {
        errors.push(`❌ ${ep.nombre}: HTTP ${response.status} - ${response.statusText}`);
      }
    } catch (err) {
      errors.push(`❌ ${ep.nombre}: Error de conexión (${err.message})`);
    }
  }

  // 4. VERIFICAR MÉTODOS DE PAGO
  try {
    const metodos = await db.query("SELECT * FROM Metodo_Pago");
    results.push(`✅ Métodos de pago registrados: ${metodos.rows.map(m => m.tipo || m.Tipo).join(", ")}`);
  } catch (err) {
    errors.push(`❌ Error al consultar Metodo_Pago: ${err.message}`);
  }

  // IMPRIMIR RESULTADOS
  console.log("\n=================================================");
  console.log("📋 RESUMEN DE RESULTADOS:");
  console.log("=================================================");
  results.forEach(r => console.log(r));

  if (errors.length > 0) {
    console.log("\n🚨 ERRORES ENCONTRADOS:");
    errors.forEach(e => console.log(e));
  } else {
    console.log("\n🎉 TODOS LOS COMPONENTES Y ENDPOINTS ESTÁN FUNCIONANDO AL 100%.");
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

checkSystem();
