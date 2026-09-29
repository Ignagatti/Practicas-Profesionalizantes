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
  if (!str) return 0;

  const lastDot = str.lastIndexOf(".");
  const lastComma = str.lastIndexOf(",");

  if (lastDot !== -1 && lastComma !== -1) {
    if (lastComma > lastDot) {
      // Formato argentino/europeo: 1.250.000,50 -> remover puntos, cambiar coma por punto
      str = str.replace(/\./g, "").replace(",", ".");
    } else {
      // Formato anglosajón: 1,250,000.50 -> remover comas
      str = str.replace(/,/g, "");
    }
  } else if (lastComma !== -1) {
    // Solo tiene coma(s): 1250,50 o 1,250,000
    const commaCount = (str.match(/,/g) || []).length;
    if (commaCount > 1) {
      str = str.replace(/,/g, "");
    } else {
      str = str.replace(",", ".");
    }
  } else if (lastDot !== -1) {
    // Solo tiene punto(s): 1.250.000 o 1250.50
    const dotCount = (str.match(/\./g) || []).length;
    if (dotCount > 1) {
      // Múltiples puntos son separadores de miles: 1.250.000 -> 1250000
      str = str.replace(/\./g, "");
    } else {
      // Un solo punto: verificar si es separador de miles latino (ej: 1.250, 15.000) o decimal (ej: 1250.50, 1.25)
      const matchThousand = str.match(/^(\d{1,3})\.(\d{3})$/);
      if (matchThousand) {
        str = matchThousand[1] + matchThousand[2];
      }
    }
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
