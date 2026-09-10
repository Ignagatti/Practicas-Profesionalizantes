/**
 * Utilidades centralizadas para aritmética y formateo de moneda en el frontend.
 * Previene errores de cálculo con decimales y bloqueos por datos nulos o undefined.
 */

export function parseMoney(val) {
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

export function roundMoney(val) {
  const n = parseMoney(val);
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function addMoney(...vals) {
  const sum = vals.reduce((total, v) => total + roundMoney(v), 0);
  return roundMoney(sum);
}

export function subMoney(a, b) {
  return roundMoney(roundMoney(a) - roundMoney(b));
}

export function multMoney(a, b) {
  return roundMoney(parseMoney(a) * parseMoney(b));
}

export function divMoney(a, b) {
  const divisor = parseMoney(b);
  if (divisor === 0) return 0;
  return roundMoney(parseMoney(a) / divisor);
}

export function calcIva(subtotal, tasa = 0.21) {
  return roundMoney(multMoney(subtotal, tasa));
}

export function formatMoney(val, fallback = "0,00") {
  if (val === null || val === undefined || isNaN(parseMoney(val))) {
    return fallback;
  }
  return roundMoney(val).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(val, fallback = "-") {
  if (!val) return fallback;
  try {
    const str = String(val).split("T")[0];
    const parts = str.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return str || fallback;
  } catch (err) {
    return fallback;
  }
}

export function dateForInput(val) {
  if (!val) return "";
  try {
    return String(val).split("T")[0];
  } catch (err) {
    return "";
  }
}
