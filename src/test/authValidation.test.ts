import { describe, expect, it } from "vitest";
import { isValidFourDigitPassword, isValidPhoneNumber, normalizePhone } from "@/lib/authValidation";

describe("authentication input validation", () => {
  it("normalizes local and country-prefixed phone numbers", () => {
    expect(normalizePhone("98765 43210")).toBe("9876543210");
    expect(normalizePhone("+91 98765 43210")).toBe("9876543210");
  });

  it("accepts exactly ten decimal phone digits", () => {
    expect(isValidPhoneNumber("9876543210")).toBe(true);
    expect(isValidPhoneNumber("987654321")).toBe(false);
    expect(isValidPhoneNumber("abcdefghij")).toBe(false);
  });

  it("accepts four-character numeric passwords including leading zeros", () => {
    expect(isValidFourDigitPassword("0047")).toBe(true);
    expect(isValidFourDigitPassword("0000")).toBe(true);
    expect(isValidFourDigitPassword("047")).toBe(false);
    expect(isValidFourDigitPassword("12345")).toBe(false);
    expect(isValidFourDigitPassword("12a4")).toBe(false);
  });
});
