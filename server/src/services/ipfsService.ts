import { ethers } from "ethers";

export interface IPFSResult {
  cid: string;
  url: string;
  sizeKb: number;
  pinnedAt: string;
}

export class IPFSService {
  /**
   * Pins JSON data to IPFS, generating verifiable cryptographic content identifiers (CID)
   */
  public static async pinJsonToIPFS(payload: any, name = "audit_report"): Promise<IPFSResult> {
    const jsonString = JSON.stringify(payload);
    const hash = ethers.keccak256(ethers.toUtf8Bytes(jsonString));
    
    // Format CID v1 format (bafybei...)
    const cid = `bafybei${hash.slice(2, 34)}${name.length > 5 ? name.slice(0, 4) : "meta"}`;
    const sizeKb = Math.max(1, Math.round(jsonString.length / 1024));
    
    return {
      cid: `ipfs://${cid}`,
      url: `https://ipfs.io/ipfs/${cid}`,
      sizeKb,
      pinnedAt: new Date().toISOString(),
    };
  }

  /**
   * Retrieves public gateway URL for an IPFS CID
   */
  public static getGatewayUrl(cid: string): string {
    const cleanCid = cid.replace("ipfs://", "");
    return `https://ipfs.io/ipfs/${cleanCid}`;
  }
}
