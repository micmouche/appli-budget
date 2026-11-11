/** Logique pure du pavé numérique (testée sans React Native). */
export function applyKey(value: string, key: string, maxDecimals = 2, maxIntegerDigits = 7): string {
  if (key === 'back') return value.slice(0, -1);
  if (key === ',') return value.includes(',') || value === '' ? (value === '' ? '0,' : value) : `${value},`;
  const [intPart = '', decPart] = value.split(',');
  if (decPart !== undefined) {
    if (decPart.length >= maxDecimals) return value;
    return `${intPart},${decPart}${key}`;
  }
  if (intPart === '0') return key;
  if (intPart.length >= maxIntegerDigits) return value;
  return `${intPart}${key}`;
}
