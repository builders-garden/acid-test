import { useApiMutation } from "./use-api-mutation";

interface PinataUploadVariables {
  type: "combined";
  audioFileUrl: string;
  imageFileUrl: string;
  title: string;
  description: string;
}

interface PinataUploadResponse {
  IpfsHash: string;
  ipfsUrl: string;
  metadataUrl: string;
}

export const usePinataUpload = () => {
  return useApiMutation<PinataUploadResponse, PinataUploadVariables>({
    url: "/api/pinata",
    method: "POST",
    isProtected: false,
    body: (variables) => variables,
  });
};
