/**
 * validatePhoneNumber — country-code-aware phone number validator.
 * Strips spaces/dashes/parentheses before matching.
 * Returns true if the number matches the country pattern, false otherwise.
 */
const PHONE_PATTERNS: Record<string, RegExp> = {
  '+90': /^5[0-9]{9}$/,          // TR: 10 digits starting with 5
  '+1':  /^[2-9][0-9]{9}$/,      // US/CA: 10 digits, first 2-9
  '+44': /^[1-9][0-9]{8,9}$/,    // GB: 9-10 digits
  '+49': /^[1-9][0-9]{9,11}$/,   // DE: 10-12 digits
  '+33': /^[1-9][0-9]{8}$/,      // FR: 9 digits
};

export function validatePhoneNumber(countryCode: string, phone: string): boolean {
  const digits = phone.replace(/[\s\-().]/g, '');
  if (!/^[0-9]+$/.test(digits)) return false;
  const pattern = PHONE_PATTERNS[countryCode];
  if (!pattern) return digits.length >= 7;
  return pattern.test(digits);
}
