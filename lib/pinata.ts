import { PinataSDK } from "pinata-web3"
import { env } from "./env"
export const pinata = new PinataSDK({
  pinataJwt: `${env.PINATA_JWT_SECRET}`,
  pinataGateway: `${process.env.NEXT_PUBLIC_GATEWAY_URL}`
})

