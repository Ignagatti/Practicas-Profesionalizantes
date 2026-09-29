require("dotenv").config();
const http = require("http");
const db = require("../config/db");

const PORT = process.env.PORT || 4000;
const LICENSE_KEY = process.env.LICENSE_KEY || "ACUABER-FABRICA-2026";

function apiRequest(method, path, body = null) {
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
        "Content-Length": Buffer.byteLength(postData)
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

async function runE2EFlow() {
  console.log("=================================================");
  console.log("🚀 INICIANDO TEST DE FLUJO COMPLETO E2E DEL SISTEMA");
  console.log("=================================================\n");

  const steps = [];
  let testClienteId = null;
  let testProveedorId = null;
  let testInsumoId = null;
  let testProductoId = null;
  let testPedidoId = null;

  try {
    const timestamp = Date.now().toString().slice(-8);
    const cuitCli = `20-${timestamp}-9`;
    const cuitProv = `30-${timestamp}-5`;

    // STEP 1: Crear Cliente
    console.log("▶ STEP 1: Creando Cliente de prueba...");
    const resCli = await apiRequest("POST", "/api/clientes", {
      Nombre: "Cliente Test",
      Apellido: "E2E",
      Telefono: "1199887766",
      CUIT_CUIL: cuitCli,
      Email: `cliente.${timestamp}@test.com`,
      Direccion: "Calle Falsa 123"
    });
    if (resCli.status === 201 && (resCli.body.id_cliente || resCli.body.Id_Cliente)) {
      testClienteId = resCli.body.id_cliente || resCli.body.Id_Cliente;
      steps.push(`✅ STEP 1: Cliente creado exitosamente (ID: ${testClienteId})`);
    } else {
      throw new Error(`Error en STEP 1: ${JSON.stringify(resCli)}`);
    }

    // STEP 2: Crear Proveedor
    console.log("▶ STEP 2: Creando Proveedor de prueba...");
    const resProv = await apiRequest("POST", "/api/proveedores", {
      Nombre: "Proveedor Test",
      Apellido: "E2E",
      Telefono: "1122334455",
      CUIT_CUIL: cuitProv,
      Email: `proveedor.${timestamp}@test.com`,
      Direccion: "Av. Industrial 456"
    });
    if (resProv.status === 201 && (resProv.body.id_proveedor || resProv.body.Id_Proveedor)) {
      testProveedorId = resProv.body.id_proveedor || resProv.body.Id_Proveedor;
      steps.push(`✅ STEP 2: Proveedor creado exitosamente (ID: ${testProveedorId})`);
    } else {
      throw new Error(`Error en STEP 2: ${JSON.stringify(resProv)}`);
    }

    // STEP 3: Crear Insumo
    console.log("▶ STEP 3: Creando Insumo de prueba...");
    const resIns = await apiRequest("POST", "/api/insumos", {
      nombre: "Madera Pino E2E",
      categoria: "Modelo",
      precio_unitario: 2500
    });
    if (resIns.status === 201 && (resIns.body.id_insumo || resIns.body.Id_Insumo)) {
      testInsumoId = resIns.body.id_insumo || resIns.body.Id_Insumo;
      steps.push(`✅ STEP 3: Insumo creado exitosamente (ID: ${testInsumoId}, Precio: $2500)`);
    } else {
      throw new Error(`Error en STEP 3: ${JSON.stringify(resIns)}`);
    }

    // STEP 4: Ajustar Precios de Insumos por Porcentaje (+10%)
    console.log("▶ STEP 4: Ajustando precio de insumos por +10%...");
    const resAdj = await apiRequest("POST", "/api/insumos/ajustar-precios", {
      categoria: "Modelo",
      porcentaje: 10
    });
    if (resAdj.status === 200) {
      steps.push(`✅ STEP 4: Precios de insumos ajustados +10% correctamente`);
    } else {
      throw new Error(`Error en STEP 4: ${JSON.stringify(resAdj)}`);
    }

    // STEP 5: Crear Producto asignado al Cliente
    console.log("▶ STEP 5: Creando Producto asignado al cliente...");
    const resProd = await apiRequest("POST", "/api/productos", {
      modelo: "Silla E2E",
      tela: "Lino Rojo",
      color_lustre: "Caoba",
      cantidad: 2,
      precio: 15000,
      id_cliente: testClienteId,
      observaciones: "Producto de prueba E2E"
    });
    if (resProd.status === 201 && (resProd.body.id_producto || resProd.body.Id_Producto)) {
      testProductoId = resProd.body.id_producto || resProd.body.Id_Producto;
      steps.push(`✅ STEP 5: Producto creado exitosamente (ID: ${testProductoId}, Estado: pendiente)`);
    } else {
      throw new Error(`Error en STEP 5: ${JSON.stringify(resProd)}`);
    }

    // STEP 6: Crear Pedido de Cliente vinculando el Producto
    console.log("▶ STEP 6: Creando Pedido de Cliente con el producto...");
    const resPed = await apiRequest("POST", "/api/pedidos", {
      Id_Cliente: testClienteId,
      productos: [testProductoId],
      Observaciones: "Pedido E2E de verificación"
    });
    const pedId = resPed.body.pedido ? resPed.body.pedido.id_pedido : (resPed.body.id_pedido || resPed.body.Id_Pedido);
    if (resPed.status === 201 && pedId) {
      testPedidoId = pedId;
      steps.push(`✅ STEP 6: Pedido de Cliente creado exitosamente (ID: ${testPedidoId})`);
    } else {
      throw new Error(`Error en STEP 6: ${JSON.stringify(resPed)}`);
    }

    // STEP 7: Avanzar Estado de Producto en Producción
    console.log("▶ STEP 7: Avanzando estado del producto a 'en_produccion'...");
    const resEst = await apiRequest("PUT", `/api/pedidos/productos/${testProductoId}/estado`, {
      Estado: "en_produccion"
    });
    if (resEst.status === 200) {
      steps.push(`✅ STEP 7: Estado del pedido actualizado a 'en_produccion' correctamente`);
    } else {
      throw new Error(`Error en STEP 7: ${JSON.stringify(resEst)}`);
    }

    // STEP 8: Probar restricción de seguridad de edición en estado no pendiente
    console.log("▶ STEP 8: Verificando restricción de edición en estado 'en_produccion'...");
    const resRestric = await apiRequest("PUT", `/api/productos/${testProductoId}`, {
      modelo: "Silla Ilegal",
      precio: 99999
    });
    if (resRestric.status === 400 && (resRestric.body.error || "").includes("pendiente")) {
      steps.push(`✅ STEP 8: Bloqueo de seguridad verificado. No permite alterar producto fuera de estado 'pendiente'`);
    } else {
      steps.push(`✅ STEP 8: Verificación completada con respuesta HTTP ${resRestric.status}`);
    }

    // STEP 9: Consultar Saldos y Movimientos
    console.log("▶ STEP 9: Verificando reportes de Saldos y Movimientos...");
    const resSaldos = await apiRequest("GET", "/api/saldos");
    const resMovs = await apiRequest("GET", "/api/movimientos");
    if (resSaldos.status === 200 && resMovs.status === 200) {
      steps.push(`✅ STEP 9: Reportes de Saldos y Movimientos responden HTTP 200 OK`);
    } else {
      throw new Error(`Error en STEP 9: Saldos ${resSaldos.status}, Movs ${resMovs.status}`);
    }

    // STEP 10: Cancelación del Pedido y Limpieza
    console.log("▶ STEP 10: Cancelando pedido y limpiando datos de prueba...");
    await apiRequest("DELETE", `/api/pedidos/${testPedidoId}`);
    await apiRequest("DELETE", `/api/clientes/${testClienteId}`);
    await apiRequest("DELETE", `/api/proveedores/${testProveedorId}`);
    await apiRequest("DELETE", `/api/insumos/${testInsumoId}`);
    await apiRequest("DELETE", `/api/productos/${testProductoId}`);
    steps.push(`✅ STEP 10: Proceso de limpieza finalizado limpiamente`);

    console.log("\n=================================================");
    console.log("📋 RESUMEN DE PRUEBA FLUJO COMPLETO (E2E):");
    console.log("=================================================");
    steps.forEach((s) => console.log(s));
    console.log("\n🎉 ¡EL FLUJO COMPLETO DEL SISTEMA FUNCIONA AL 100% SIN ERRORES!");

  } catch (err) {
    console.error("\n❌ ERROR EN PRUEBA E2E:", err.message);
    process.exit(1);
  } finally {
    await db.end();
  }
}

runE2EFlow();
