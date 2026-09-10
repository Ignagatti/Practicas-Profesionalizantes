const {
  parseMoney,
  roundMoney,
  addMoney,
  subMoney,
  multMoney,
  divMoney,
  calcIva,
  areEqualMoney
} = require("../utils/currencyUtils");

console.log("=== INICIANDO PRUEBAS DE ARITMÉTICA Y FORMATOS DE MONEDA ===");

// Test 1: Parsing de diferentes formatos
const testFormats = [
  { input: "1.234,56", expected: 1234.56 },
  { input: "$ 1.234,56", expected: 1234.56 },
  { input: "1,234.56", expected: 1234.56 },
  { input: "$ 1,234.56", expected: 1234.56 },
  { input: "1234.56", expected: 1234.56 },
  { input: "1234,56", expected: 1234.56 },
  { input: "500", expected: 500 },
  { input: "$ 0,00", expected: 0 },
  { input: null, expected: 0 },
  { input: undefined, expected: 0 },
  { input: "-150,75", expected: -150.75 },
  { input: 99.99, expected: 99.99 }
];

let failed = 0;

for (const tf of testFormats) {
  const parsed = parseMoney(tf.input);
  if (!areEqualMoney(parsed, tf.expected)) {
    console.error(`❌ FALLO parseMoney("${tf.input}"): Esperado ${tf.expected}, Obtenido ${parsed}`);
    failed++;
  } else {
    console.log(`✅ parseMoney("${tf.input}") => ${parsed}`);
  }
}

// Test 2: Residuos de coma flotante (Floating-point precision test)
console.log("\n=== PRUEBAS DE PRECISIÓN DE COMA FLOTANTE ===");
const sum1 = 0.1 + 0.2; // 0.30000000000000004 en JS nativo
const sumRounded = addMoney(0.1, 0.2);
if (sumRounded === 0.3) {
  console.log(`✅ addMoney(0.1, 0.2) => ${sumRounded} (exacto, sin residuo .0000000000000004)`);
} else {
  console.error(`❌ FALLO addMoney(0.1, 0.2): Obtenido ${sumRounded}`);
  failed++;
}

const sub1 = subMoney(1.03, 0.42); // En JS 1.03 - 0.42 = 0.6100000000000001
if (sub1 === 0.61) {
  console.log(`✅ subMoney(1.03, 0.42) => ${sub1} (exacto, sin residuo .6100000000000001)`);
} else {
  console.error(`❌ FALLO subMoney: Obtenido ${sub1}`);
  failed++;
}

const iva = calcIva(100);
if (iva === 21) {
  console.log(`✅ calcIva(100) => ${iva}`);
} else {
  console.error(`❌ FALLO calcIva: Obtenido ${iva}`);
  failed++;
}

// Test 3: IVA de montos complejos
const subtotalComplejo = 1254.33;
const totalConIva = roundMoney(multMoney(subtotalComplejo, 1.21));
console.log(`✅ Total con IVA 21% de $${subtotalComplejo} => $${totalConIva}`);

console.log(`\n=============================================`);
if (failed === 0) {
  console.log("🎉 TODAS LAS PRUEBAS PASARON EXITOSAMENTE.");
} else {
  console.error(`❌ HUBO ${failed} ERRORES EN LAS PRUEBAS.`);
  process.exit(1);
}
