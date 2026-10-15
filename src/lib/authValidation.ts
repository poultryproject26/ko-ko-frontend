export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length > 10 && digits.startsWith("91")
    ? digits.slice(2, 12)
    : digits.slice(0, 10);
}

export function isValidPhoneNumber(phone: string): boolean {
  return /^\d{10}$/.test(phone);
}

export function isValidFourDigitPassword(password: string): boolean {
  return /^\d{4}$/.test(password);
}
