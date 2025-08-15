import { randomBytes } from 'crypto';

/**
 * Generate a random 16-byte identifier for a company
 * @returns A hex string representing 16 bytes (32 hex characters + 0x prefix)
 */
export function generateCompanyId(): `0x${string}` {
  // Generate 16 random bytes and convert to hex
  const bytes = randomBytes(16);
  return `0x${bytes.toString('hex')}` as `0x${string}`;
}

/**
 * Convert a hex string to bytes16 format for contract calls
 * @param hex The hex string to convert
 * @returns The hex string formatted as bytes16
 */
export function toBytes16(hex: string): `0x${string}` {
  // Ensure it starts with 0x and is exactly 34 characters (0x + 32 hex chars)
  const cleanHex = hex.startsWith('0x') ? hex : `0x${hex}`;
  if (cleanHex.length !== 34) {
    throw new Error(
      'Invalid bytes16 format: must be exactly 16 bytes (32 hex characters)'
    );
  }
  return cleanHex as `0x${string}`;
}
