import { base } from "wagmi/chains";

export const MESSAGE_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30; // 30 day

export const CONTRACT_ADDRESS = (
  process.env.NEXT_PUBLIC_APP_ENV === "development"
    ? process.env.NEXT_PUBLIC_SMART_CONTRACT_TEST_ADDRESS
    : process.env.NEXT_PUBLIC_SMART_CONTRACT_ADDRESS
) as `0x${string}`;

export const CHAIN = base;
