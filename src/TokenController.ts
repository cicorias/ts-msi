import {
  DefaultAzureCredential,
  TokenCredentialOptions,
} from "@azure/identity";
import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import express from "express";

/** this route provides token signing for testing only. */
// class SignController {
//   private status = "use POST with a json jwt payload";
//   public router = express.Router();

//   constructor() {
//     this.router.get("/sign", this.getSign);
//     this.router.post("/sign", this.sign);
//   }

/**
 * For a given blob object, generator a SAS Token that"ll let bearers access the blob for t hours.
 */
export class TokenController {
  private defaultCredential: DefaultAzureCredential;
  public router = express.Router();
  private status = "use POST with a json jwt payload"; // TODO: remove
  // to: TokenCredentialOptions = {
  //     ""
  // };
  constructor() {
    this.defaultCredential = new DefaultAzureCredential();
    this.router.post("/sign", this.sign);
    this.router.get("/sign", this.getSign);
  }

  getSign = (request: express.Request, response: express.Response) => {
    return response.send(this.status);
  };

  sign = (request: express.Request, response: express.Response) => {
    // const options: SignOptions = { algorithm: "HS256"}
    // const rv = jwt.sign(request.body, sharedSecret, options)
    this.signBlob("dkdkdk");
    return response.send("sign NOTR");
  };

  // private String calcBlobAccountUrl(BlobUrlParts parts) {
  //     return String.format("https://%s.blob.core.windows.net", parts.getAccountName());
  // }

  // private OffsetDateTime calcTokenExpirationDate() {
  //     return OffsetDateTime.now(ZoneOffset.UTC).plusHours(12);
  // }

  // public signContainer(containerUrl: string) : string {

  // }

  private signBlob(blobUrl: string): string {
    const client: BlobServiceClient = new BlobServiceClient(
      blobUrl,
      this.defaultCredential
    );

    const iss: Date = new Date();
    const exp: Date = new Date(); // timeinterval of 1 hour needed.

    const s = "";
    const k = this.defaultCredential
      .getToken("")
      .then((token) => {
        client.getUserDelegationKey(iss, exp);
      })
      .then((sas) => {
        console.log(sas);
      })
      .catch((err) => {
        console.error(err);
      });

    return "";
  }
}
