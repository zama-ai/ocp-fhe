import { randomBytes } from 'crypto';

/**
 * Generate a random bytes16 identifier
 */
export function generateBytes16Id(): `0x${string}` {
  const bytes = randomBytes(16);
  return `0x${bytes.toString('hex')}` as `0x${string}`;
}

/**
 * Generate a unique round ID using bytes16 format
 */
export function generateRoundId(): `0x${string}` {
  return generateBytes16Id();
}

/**
 * Convert decimal price to integer (encrypt the input values directly)
 */
export function convertPriceToInteger(price: number): bigint {
  return BigInt(Math.floor(price));
}

/**
 * Convert shares to bigint
 */
export function convertSharesToBigInt(shares: number): bigint {
  return BigInt(Math.floor(shares));
}

/**
 * Fixed stock class ID constant
 */
export const STOCK_CLASS_ID = '0x00000000000000000000000000000001' as const;
