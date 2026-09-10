/**
 * Utilidades centralizadas para aritmética y formatos de moneda en el backend.
 * Evita residuos de punto flotante en JavaScript (ej. 0.1 + 0.2 = 0.30000000000000004)
 * y estandariza el parsing de montos en formatos con puntos y comas.
 */

function parseMoney(val) {
  if (typeof val === "number") {
    return isNaN(val) ? 0 : val;
  }
  if (val === null || val === undefined) {
    return 0;
  }

  let str = String(val).trim();
  if (!str) return 0;

  // Remover símbolos de moneda y caracteres invisibles/espacios
  str = str.replace(/[^0-9.,\-+]/g, "");

  // Si tiene tanto punto como coma, determinar cuál es el separador decimal
  const lastDot = str.lastIndexOf(".");
  const lastComma = str.lastIndexOf(",");

  if (lastDot !== -1 && lastComma !== -1) {
    if (lastComma > lastDot) {
      // Formato argentino/europeo: 1.250,50 -> remover puntos, cambiar coma por punto
      str = str.replace(/\./g, "").replace(",", ".");
    } else {
      // Formato anglosajón: 1,250.50 -> remover comas
      str = str.replace(/,/g, "");
    }
  } else if (lastComma !== -1) {
    // Solo tiene coma: 1250,50 -> 1250.50
    str = str.replace(",", ".");
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function roundMoney(val) {
  const n = parseMoney(val);
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function addMoney(...vals) {
  const sum = vals.reduce((total, v) => total + roundMoney(v), 0);
  return roundMoney(sum);
}

function subMoney(a, b) {
  return roundMoney(roundMoney(a) - roundMoney(b));
}

function multMoney(a, b) {
  return roundMoney(parseMoney(a) * parseMoney(b));
}

function divMoney(a, b) {
  const divisor = parseMoney(b);
  if (divisor === 0) return 0;
  return roundMoney(parseMoney(a) / divisor);
}

function calcIva(subtotal, tasa = 0.21) {
  return roundMoney(multMoney(subtotal, tasa));
}

function areEqualMoney(a, b, epsilon = 0.009) {
  return Math.abs(roundMoney(a) - roundMoney(b)) <= epsilon;
}

module.exports = {
  parseMoney,
  roundMoney,
  addMoney,
  subMoney,
  multMoney,
  divMoney,
  calcIva,
  areEqualMoney
};
