import bcrypt from "bcrypt";
import ENV from "../config/env";

export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(ENV.BCRYPT_ROUNDS);
  return await bcrypt.hash(password, salt);
};

export const comparePasswords = async (password: string, hash: string) => {
  return await bcrypt.compare(password, hash);
};
