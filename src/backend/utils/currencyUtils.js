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
