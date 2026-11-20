import { compare, hash } from "bcryptjs";

const BCRYPT_COST = 10;

export async function hashSecret(plainText: string): Promise<string> {
  return hash(plainText, BCRYPT_COST);
}

export async function verifySecret(plainText: string, hashedValue: string): Promise<boolean> {
  if (plainText.length === 0 || hashedValue.length === 0) {
    return false;
  }
  return compare(plainText, hashedValue);
}
