import {
  DefaultAzureCredential,
  TokenCredentialOptions,
} from "@azure/identity";
import { BlobServiceClient, newPipeline, AnonymousCredential } from "@azure/storage-blob";
import express from "express";
import moment from "moment";

// ONLY AVAILABLE IN NODE.JS RUNTIME
// DefaultAzureCredential will first look for Azure Active Directory (AAD)
// client secret credentials in the following environment variables:
//
// - AZURE_TENANT_ID: The ID of your AAD tenant
// - AZURE_CLIENT_ID: The ID of your AAD app registration (client)
// - AZURE_CLIENT_SECRET: The client secret for your AAD app registration
//
// If those environment variables aren't found and your application is deployed
// to an Azure VM or App Service instance, the managed service identity endpoint
// will be used as a fallback authentication source.

/**
 * For a given blob object, generator a SAS Token that"ll let bearers access the blob for t hours.
 */
export class TokenController {
    public router = express.Router();
    private defaultCredential: DefaultAzureCredential;
    private status = "use POST with a json jwt payload"; // TODO: remove
    private accountName = "dannygdevsta";
    private localFilePath = "README.md";

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

    sign = async (request: express.Request, response: express.Response) => {
        const containerName = `newcontainer${new Date().getTime()}`;
        const blobName = `newblobnew${new Date().getTime()}`;

        try {
            const sasToken = await this.signContainer(containerName);
            const status = await this.uploadBlob(containerName, blobName, sasToken);
            if (status === 200) {
                return response.send(`Successfully upload blob ${blobName} into ${containerName} using SAS Token: ${sasToken}`);
            }
            return `Failed to upload blob. Status=${status}`;
        } catch (err) {
            return response.send(
                `Failed to upload blob, requestId=${err.details.requestId}, statusCode=${err.statusCode}, errorCode=${err.errorCode}`
            )
        }
    };

    public async signContainer(containerName: string) : Promise<string> {
        return new Promise(async (resolve, reject) => {
            const storageUrl = `https://${this.accountName}.blob.core.windows.net`;

            const blobServiceClient = new BlobServiceClient(
                storageUrl,
                this.defaultCredential
            );
            
            try {
                const createContainerResponse = await blobServiceClient
                    .getContainerClient(containerName)
                    .create();
                console.log("Created container ${containerName} successfully", createContainerResponse.requestId);
            } catch (err) {
                console.log(
                    `Creating a container failed, requestId=${err.details.requestId}, statusCode=${err.statusCode}, errorCode=${err.errorCode}`
                ); 
                reject(err);
            }

            const iss: Date = new Date();
            const exp: Date = moment(iss).add(1, "hour").toDate(); // timeinterval of 1 hour needed.
            
            try {
                const udKey = await blobServiceClient.getUserDelegationKey(iss, exp);
            
                resolve(udKey.value);
            } catch (err) {
                console.log(
                    `Getting user delegation key failed, requestId=${err.details.requestId}, statusCode=${err.statusCode}, errorCode=${err.errorCode}`
                )
                reject(err);
            }
        });
    }


    public async uploadBlob(containerName: string, blobName: string, sasToken: string): Promise<number> {
        return new Promise(async (resolve, reject) => {
            const pipeline = newPipeline(new AnonymousCredential(), {
                // httpClient: MyHTTPClient, // A customized HTTP client implementing IHttpClient interface
                retryOptions: { maxTries: 4 }, // Retry options
                userAgentOptions: { userAgentPrefix: "ts-msi V1.0.0" }, // Customized telemetry string
                keepAliveOptions: {
                  // Keep alive is enabled by default, disable keep alive by setting false
                  enable: false
                }
              });


            try {
                const storageUrl = `https://${this.accountName}.blob.core.windows.net?${sasToken}`;
              
                const blobServiceClient = new BlobServiceClient(
                    storageUrl,
                    pipeline
                );
    
                const containerClient = blobServiceClient.getContainerClient(containerName);
    
                // Create a blob
                const content = "hello, Danny";
                const blockBlobClient = containerClient.getBlockBlobClient(blobName);
                const uploadBlobResponse = await blockBlobClient.uploadFile(this.localFilePath, {
                    blockSize: 4 * 1024 * 1024, // 4MB block size
                    concurrency: 20, // 20 concurrency
                    onProgress: (ev) => console.log(ev)
                  });
                // const uploadBlobResponse = await blockBlobClient.upload(content, Buffer.byteLength(content));

                resolve(uploadBlobResponse._response.status);
            } catch (err) {
                console.log(
                    `Getting user delegation key failed, requestId=${err.details.requestId}, statusCode=${err.statusCode}, errorCode=${err.errorCode}`
                )
                reject(err);
            }
        });
    }


    private signBlob(blobUrl: string): string {
        const client: BlobServiceClient = new BlobServiceClient(
            "https://dannygdevsta.blob.core.windows.net/sampledata",
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
