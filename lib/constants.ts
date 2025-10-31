import { base } from "wagmi/chains";
import { env } from "./env";

export const MESSAGE_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30; // 30 day

export const CONTRACT_ADDRESS =
  env.NEXT_PUBLIC_SMART_CONTRACT_ADDRESS as `0x${string}`;

export const USDC_CONTRACT_ADDRESS =
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`;

export const ACID_TOKEN_ADDRESS =
  "0xf7d696B5BED117731B8A71Db264333C8Ec261b07" as `0x${string}`;

export const CHAIN = base;
