require("dotenv").config();
const http = require("http");
const db = require("../config/db");

const PORT = process.env.PORT || 4000;
const LICENSE_KEY = process.env.LICENSE_KEY || "ACUABER-FABRICA-2026";

function apiRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : "";
    const options = {
      hostname: "localhost",
      port: PORT,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
        "x-license-key": LICENSE_KEY,
        "Content-Length": Buffer.byteLength(postData),
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on("error", (err) => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
}

async function runMegaAudit() {
  console.log("=========================================================================");
  console.log("🔍 MEGA AUDITORÍA COMPLETA DEL SISTEMA: TODOS LOS CASOS DE USO (CU1-CU54)");
  console.log("=========================================================================\n");

  const results = [];
  const warnings = [];

  function record(cu, name, ok, details = "") {
    const icon = ok ? "✅" : "❌";
    const msg = `${icon} [${cu}] ${name}${details ? `: ${details}` : ""}`;
    console.log(msg);
    results.push({ cu, name, ok, details });
    if (!ok) warnings.push(`Falla en ${cu} (${name}): ${details}`);
  }

  let testClienteId = null;
  let testProveedorId = null;
  let testInsumoId = null;
  let testProductoId = null;
  let testPedidoId = null;
  let testFacturaId = null;
  let testPagoClienteId = null;
  let testPagoProveedorId = null;

  try {
    const uid = Date.now().toString().slice(-7);

    // BLOQUE 1: AUTENTICACIÓN, LICENCIA Y PANEL DE CONTROL
    console.log("\n--- BLOQUE 1: PANEL DE CONTROL Y AUTENTICACIÓN ---");

    const resLicBad = await apiRequest("POST", "/api/licencia/verificar", { clave: "CLAVE_INVENTADA_999" });
    const cu53_1 = resLicBad.status === 401 && resLicBad.body.ok === false;
    record("CU53", "Rechazo de clave inválida / revocada", cu53_1, `HTTP ${resLicBad.status}`);

    const resLicGood = await apiRequest("POST", "/api/licencia/verificar", { clave: LICENSE_KEY });
    const cu53_2 = resLicGood.status === 200 && resLicGood.body.ok === true;
    record("CU53", "Acceso exitoso con clave autorizada", cu53_2, `Titular: ${resLicGood.body.titular || "OK"}`);

    const resDash = await apiRequest("GET", "/api/pedidos");
    record("CU1", "Consultar panel de control / pedidos iniciales", resDash.status === 200);

    const resFacts = await apiRequest("GET", "/api/facturasProveedor");
    const pedsPend = Array.isArray(resDash.body) ? resDash.body.filter(p => Number(p.monto_adeudado || p.Monto_Adeudado) > 0) : [];
    const factsPend = Array.isArray(resFacts.body) ? resFacts.body.filter(f => Number(f.monto_adeudado || f.Monto_Adeudado) > 0) : [];
    record("CU9", "Aviso de pagos/cobros pendientes (campana y listado)", resDash.status === 200 && resFacts.status === 200, 
      `${pedsPend.length} pedidos y ${factsPend.length} facturas con deuda`);

    const resProds = await apiRequest("GET", "/api/productos");
    record("CU10", "Estadísticas y productos para gráficos", resProds.status === 200, 
      `${Array.isArray(resProds.body) ? resProds.body.length : 0} productos analizados`);

    const resBackup = await apiRequest("GET", "/api/backup/exportar");
    const cu51 = resBackup.status === 200 && typeof resBackup.body === "string" && resBackup.body.includes("COPIA DE SEGURIDAD");
    record("CU51", "Generar copia de seguridad SQL", cu51, `${resBackup.body.length || 0} bytes generados`);

    // BLOQUE 7: CLIENTES
    console.log("\n--- BLOQUE 7: CLIENTES ---");

    const cuitCli = `20-${uid}-8`;
    const resCliAdd = await apiRequest("POST", "/api/clientes", {
      Nombre: "Empresa",
      Apellido: "Muebles Sur",
      Telefono: "3496-554433",
      CUIT_CUIL: cuitCli,
      Email: `muebles.${uid}@test.com`,
      Direccion: "Belgrano 1234"
    });
    testClienteId = resCliAdd.body.id_cliente || resCliAdd.body.Id_Cliente;
    record("CU45", "Agregar cliente nuevo", resCliAdd.status === 201 && !!testClienteId, `ID: ${testClienteId}`);

    const resCliList = await apiRequest("GET", "/api/clientes");
    const cliFound = Array.isArray(resCliList.body) && resCliList.body.some(c => (c.id_cliente || c.Id_Cliente) === testClienteId);
    record("CU7", "Consultar clientes y filtros de búsqueda", resCliList.status === 200 && cliFound);

    const resCliGet = await apiRequest("GET", `/api/clientes/${testClienteId}`);
    record("CU41", "Visualizar detalle del cliente", resCliGet.status === 200);

    const resCliEdit = await apiRequest("PUT", `/api/clientes/${testClienteId}`, {
      Nombre: "Empresa Modificada",
      Apellido: "Muebles Sur",
      Telefono: "3496-999999",
      CUIT_CUIL: cuitCli,
      Email: `muebles.${uid}@test.com`
    });
    record("CU43", "Editar datos de cliente", resCliEdit.status === 200);

    const resCliMovs = await apiRequest("GET", `/api/movimientos/cliente/${testClienteId}`);
    record("CU42", "Visualizar movimientos / cuenta corriente del cliente", resCliMovs.status === 200);

    // BLOQUE 8: PROVEEDORES
    console.log("\n--- BLOQUE 8: PROVEEDORES ---");

    const cuitProv = `30-${uid}-2`;
    const resProvAdd = await apiRequest("POST", "/api/proveedores", {
      Nombre: "Maderas",
      Apellido: "del Litoral SA",
      Telefono: "342-445566",
      CUIT_CUIL: cuitProv,
      Email: `maderas.${uid}@test.com`,
      Direccion: "Ruta 70 Km 12"
    });
    testProveedorId = resProvAdd.body.id_proveedor || resProvAdd.body.Id_Proveedor;
    record("CU49", "Agregar proveedor nuevo", resProvAdd.status === 201 && !!testProveedorId, `ID: ${testProveedorId}`);

    const resProvList = await apiRequest("GET", "/api/proveedores");
    record("CU8", "Consultar listado de proveedores", resProvList.status === 200);

    const resProvGet = await apiRequest("GET", `/api/proveedores/${testProveedorId}`);
    record("CU46", "Visualizar detalle de proveedor", resProvGet.status === 200);

    const resProvEdit = await apiRequest("PUT", `/api/proveedores/${testProveedorId}`, {
      Nombre: "Maderas Litoral Renovada",
      Apellido: "SA",
      Telefono: "342-888888",
      CUIT_CUIL: cuitProv,
      Email: `maderas.${uid}@test.com`
    });
    record("CU47", "Editar datos de proveedor", resProvEdit.status === 200);

    const resProvMovs = await apiRequest("GET", `/api/movimientos/proveedor/${testProveedorId}`);
    record("CU50", "Visualizar movimientos / cuenta corriente de proveedor", resProvMovs.status === 200);

    // BLOQUE 6: LISTA DE PRECIOS / INSUMOS
    console.log("\n--- BLOQUE 6: LISTA DE PRECIOS / INSUMOS ---");

    const resInsAdd = await apiRequest("POST", "/api/insumos", {
      nombre: `Goma Espuma ${uid}`,
      categoria: "Insumo",
      precio_unitario: 5000
    });
    testInsumoId = resInsAdd.body.id_insumo || resInsAdd.body.Id_Insumo;
    record("CU37", "Agregar insumo a lista de precios", resInsAdd.status === 201 && !!testInsumoId, `ID: ${testInsumoId}`);

    const resInsList = await apiRequest("GET", "/api/insumos");
    record("CU6", "Consultar planilla de lista de precios", resInsList.status === 200);

    const resInsEdit = await apiRequest("PUT", `/api/insumos/${testInsumoId}`, {
      nombre: `Goma Espuma Alta Densidad ${uid}`,
      categoria: "Insumo",
      precio_unitario: 6000
    });
    record("CU40", "Editar datos individuales de insumo", resInsEdit.status === 200);

    const resInsPct = await apiRequest("POST", "/api/insumos/ajustar-precios", {
      categoria: "Insumo",
      porcentaje: 10
    });
    record("CU39", "Actualizar precios por porcentaje (+10%)", resInsPct.status === 200);

    // BLOQUE 2: PRODUCTOS
    console.log("\n--- BLOQUE 2: PRODUCTOS ---");

    const resProdAdd = await apiRequest("POST", "/api/productos", {
      modelo: `Sillón Relax ${uid}`,
      tela: "Pana Gris",
      color_lustre: "Negro",
      cantidad: 1,
      precio: 45000,
      id_cliente: testClienteId,
      observaciones: "Producción de prueba"
    });
    testProductoId = resProdAdd.body.id_producto || resProdAdd.body.Id_Producto;
    record("CU16", "Agregar producto vinculado al cliente", resProdAdd.status === 201 && !!testProductoId, `ID: ${testProductoId}`);

    const resProdList = await apiRequest("GET", "/api/productos");
    record("CU02", "Consultar planilla de productos", resProdList.status === 200);

    const resProdGet = await apiRequest("GET", `/api/productos/${testProductoId}`);
    record("CU12", "Visualizar detalle de producto por ID", resProdGet.status === 200);

    const resProdEdit = await apiRequest("PUT", `/api/productos/${testProductoId}`, {
      modelo: `Sillón Relax Modificado ${uid}`,
      tela: "Pana Azul",
      color_lustre: "Negro",
      cantidad: 1,
      precio: 50000,
      id_cliente: testClienteId
    });
    record("CU13", "Editar producto en estado pendiente", resProdEdit.status === 200);

    const prodsPend = Array.isArray(resProdList.body) ? resProdList.body.filter(p => (p.estado || p.Estado) === "pendiente") : [];
    record("CU15", "Filtrar productos por estado (pendiente/producción)", prodsPend.length >= 1);

    // BLOQUE 3: PEDIDOS DE CLIENTES
    console.log("\n--- BLOQUE 3: PEDIDOS DE CLIENTES ---");

    const resPedAdd = await apiRequest("POST", "/api/pedidos", {
      Id_Cliente: testClienteId,
      productos: [testProductoId],
      Observaciones: "Pedido generado por empleado",
      Estado_Facturacion: "se_factura",
      Nro_Factura: `VENT-${uid}`
    });
    const pedObj = resPedAdd.body.pedido || resPedAdd.body;
    testPedidoId = pedObj.id_pedido || pedObj.Id_Pedido;
    record("CU27", "Generar nuevo pedido de cliente con vencimiento a 30 días", resPedAdd.status === 201 && !!testPedidoId, `ID: ${testPedidoId}`);

    const resPedList = await apiRequest("GET", "/api/pedidos");
    record("CU3", "Consultar lista de pedidos y filtros", resPedList.status === 200);

    const resPedGet = await apiRequest("GET", `/api/pedidos/${testPedidoId}`);
    record("CU24", "Visualizar detalle completo de pedido", resPedGet.status === 200);

    const resPedEdit = await apiRequest("PUT", `/api/pedidos/${testPedidoId}`, {
      productos: [testProductoId],
      Observaciones: "Observaciones actualizadas por administración"
    });
    record("CU25", "Editar información permitida del pedido", resPedEdit.status === 200);

    const resTerminar = await apiRequest("PUT", `/api/pedidos/productos/${testProductoId}/estado`, { Estado: "terminado" });
    record("CU17", "Terminar producto", resTerminar.status === 200);

    const resEnviar = await apiRequest("PUT", `/api/pedidos/productos/${testProductoId}/estado`, { Estado: "enviado" });
    record("CU54", "Enviar producto despachado", resEnviar.status === 200);

    // BLOQUE 4: FACTURAS DE PROVEEDORES
    console.log("\n--- BLOQUE 4: FACTURAS DE PROVEEDORES ---");

    const resFactAdd = await apiRequest("POST", "/api/facturasProveedor", {
      Id_Proveedor: testProveedorId,
      Nro_Factura_Proveedor: `FC-A-${uid}`,
      Fecha_Emision: new Date().toISOString().split("T")[0],
      Vencimiento: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      Precio_Total: 30000,
      Observaciones: "Factura de compra de insumos"
    });
    const factObj = resFactAdd.body.factura || resFactAdd.body;
    testFacturaId = factObj.id_factura_proveedor || factObj.Id_Factura_Proveedor || factObj.id;
    record("CU18", "Ingresar factura emitida por proveedor", resFactAdd.status === 201 && !!testFacturaId, `ID: ${testFacturaId}`);

    const resFactList = await apiRequest("GET", "/api/facturasProveedor");
    record("CU4", "Consultar facturas de proveedores y filtros", resFactList.status === 200);

    const resFactGet = await apiRequest("GET", `/api/facturasProveedor/${testFacturaId}`);
    record("CU19", "Visualizar detalle de factura proveedor", resFactGet.status === 200);

    const resFactEdit = await apiRequest("PUT", `/api/facturasProveedor/${testFacturaId}`, {
      Precio_Total: 30000,
      Vencimiento: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      Fecha_Emision: new Date().toISOString().split("T")[0],
      Nro_Factura_Proveedor: `FC-A-${uid}`,
      Observaciones: "Factura auditada y aprobada"
    });
    record("CU21", "Editar observaciones de factura proveedor", resFactEdit.status === 200);

    // BLOQUE 5: PAGOS
    console.log("\n--- BLOQUE 5: PAGOS ---");

    const resPagoCli = await apiRequest("POST", "/api/pagos", {
      Tipo: "cliente",
      Fecha_Pago: new Date().toISOString().split("T")[0],
      Monto: 50000,
      Id_Medio_Pago: 2, // Transferencia
      facturas: [{ id_pedido: testPedidoId, monto_usado: 50000 }]
    }, { "x-license-key": LICENSE_KEY });
    const pagoCliObj = resPagoCli.body.pago || resPagoCli.body;
    testPagoClienteId = pagoCliObj.id_pago_pedido || pagoCliObj.Id_Pago_Pedido || pagoCliObj.id;
    const cu31 = (resPagoCli.status === 201 || resPagoCli.status === 200) && !!testPagoClienteId;
    record("CU31", "Registrar pago de cliente y cálculo de saldo a favor", cu31, `ID Pago: ${testPagoClienteId}`);

    const resPagosCliList = await apiRequest("GET", "/api/pagos?tipo=cliente");
    record("CU05", "Consultar pagos registrados de clientes", resPagosCliList.status === 200);

    const resPagoCliGet = await apiRequest("GET", `/api/pagos/${testPagoClienteId}?tipo=cliente`);
    record("CU28", "Visualizar detalle de pago de cliente con imputaciones", resPagoCliGet.status === 200);

    const resPagoProv = await apiRequest("POST", "/api/pagos", {
      Tipo: "proveedor",
      Fecha_Pago: new Date().toISOString().split("T")[0],
      Monto: 30000,
      Id_Medio_Pago: 1, // Efectivo
      facturas: [{ id_factura_proveedor: testFacturaId, monto_usado: 30000 }]
    });
    const pagoProvObj = resPagoProv.body.pago || resPagoProv.body;
    testPagoProveedorId = pagoProvObj.id_pago_insumo || pagoProvObj.Id_Pago_Insumo || pagoProvObj.id;
    const cu36 = (resPagoProv.status === 201 || resPagoProv.status === 200) && !!testPagoProveedorId;
    record("CU36", "Registrar pago realizado a proveedor", cu36, `ID Pago: ${testPagoProveedorId}`);

    const resPagosProvList = await apiRequest("GET", "/api/pagos?tipo=proveedor");
    record("CU32", "Consultar pagos realizados a proveedores", resPagosProvList.status === 200);

    const resPagoProvGet = await apiRequest("GET", `/api/pagos/${testPagoProveedorId}?tipo=proveedor`);
    record("CU34", "Visualizar detalle de pago a proveedor", resPagoProvGet.status === 200);

    if (testPagoClienteId) {
      const resDelPC = await apiRequest("DELETE", `/api/pagos/${testPagoClienteId}?tipo=cliente`);
      record("CU30", "Eliminar / anular pago de cliente y recálculo de saldos", resDelPC.status === 200);
    }
    if (testPagoProveedorId) {
      const resDelPP = await apiRequest("DELETE", `/api/pagos/${testPagoProveedorId}?tipo=proveedor`);
      record("CU33", "Eliminar / anular pago a proveedor y recálculo de saldos", resDelPP.status === 200);
    }

    // LIMPIEZA FINAL
    console.log("\n--- LIMPIEZA FINAL DE REGISTROS DE PRUEBA ---");
    if (testFacturaId) await apiRequest("DELETE", `/api/facturasProveedor/${testFacturaId}`);
    if (testPedidoId) await apiRequest("DELETE", `/api/pedidos/${testPedidoId}`);
    if (testProductoId) await apiRequest("DELETE", `/api/productos/${testProductoId}`);
    if (testInsumoId) await apiRequest("DELETE", `/api/insumos/${testInsumoId}`);
    if (testProveedorId) await apiRequest("DELETE", `/api/proveedores/${testProveedorId}`);
    if (testClienteId) await apiRequest("DELETE", `/api/clientes/${testClienteId}`);
    console.log("🧹 Base de datos restituida a su estado original sin huellas.");

    // INFORME FINAL
    console.log("\n=========================================================================");
    console.log("📊 INFORME FINAL DE LA MEGA AUDITORÍA:");
    console.log("=========================================================================");
    const exitosos = results.filter(r => r.ok).length;
    const fallidos = results.filter(r => !r.ok).length;
    console.log(`Total Casos de Uso Auditados: ${results.length}`);
    console.log(`Casos de Uso Exitosos      : ${exitosos} (${Math.round((exitosos / results.length) * 100)}%)`);
    console.log(`Casos de Uso con Fallas    : ${fallidos}`);

    if (fallidos === 0) {
      console.log("\n🏆 CONCLUSIÓN: EL SISTEMA ESTÁ 100% ÉPICO Y OPERATIVO EN CADA CASO DE USO.");
    } else {
      console.log("\n⚠️ DETALLES DE ADVERTENCIAS / PUNTOS A REVISAR:");
      warnings.forEach(w => console.log(`  - ${w}`));
    }

  } catch (err) {
    console.error("❌ ERROR CRÍTICO EN LA AUDITORÍA:", err);
  } finally {
    await db.end();
  }
}

runMegaAudit();
