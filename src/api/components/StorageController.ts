import express from "express";
import { v4 as uuidv4 } from 'uuid';
import { AzureConnectionPool } from '../middleware/azure-connection-pool';
import { CloudPlatform } from '../middleware/cloud-platform';
import { AnonymousCredential, BlockBlobClient, ContainerClient } from '@azure/storage-blob';
import { AzureStorageService } from '../services/azure-storage-service';
import { IStorageLocation, StorageLocationType } from '../interfaces/istorage-location';
import { StorageLocationFactory } from '../middleware/storage-location-factory';
import { IUploadUrlOptions } from '../interfaces/iupload-url-options';
import { IDownloadUrlOptions } from '../interfaces/idownload-url-options';
import { Logger } from "../middleware/logger";
import { ISASTokenOptions } from "../interfaces/isas-token-options";

const URL_EXPIRATION_IN_MINUTES = 1000 * 60 * 10;
const SampleBlobContent = 'some file content';

export class StorageController {
    private router = express.Router();
    private secretService = {
        getSecret: (): Promise<string> => {
          return Promise.resolve<string>('');
        }
    };

    private accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || 'sdmsdataevdstor';
    private azureConfiguration = {
        cloudVendorName: CloudPlatform.azure,
        storageAccountName: {
            transfer: this.accountName,
            permanent: this.accountName
        },
        cosmosAccountName: '',
        cosmosDatabaseName: ''
    };

    private apiContext = {
        AccessToken: '',
        CorrelationId: '',
        DataPartitionId: 'test',
        UserId: '',
        TenantId: '',
        CloudConfiguration: this.azureConfiguration
    }
    private storageService: AzureStorageService;

    constructor() {
        const connectionPool = new AzureConnectionPool();
        this.storageService = new AzureStorageService(connectionPool);

        this.router.get("/uploadBlob", this.uploadBlob);
        this.router.get("/sasToken", this.getSasToken);

    }

    uploadBlob = async (request: express.Request, response: express.Response): Promise<express.Response<any>> => {
        const location = StorageLocationFactory.CreateTemporaryLargeBlob(`${uuidv4()}.txt`);
        await this.createBlob(location, SampleBlobContent);

        if(await this.check_upload(location))
            return response.send(`blob was uploaded successfully!`);
        
        return response.send(`Couldn't validate that blob was uploaded successfully.`)
    };

    getSasToken = async (request: express.Request, response: express.Response): Promise<express.Response<any>> => {
        const location = StorageLocationFactory.CreateTemporaryLargeBlob(`${uuidv4()}.txt`);
        const sasTokenOption: ISASTokenOptions = {
            Start: new Date(),
            Expiration: new Date(new Date().valueOf() + URL_EXPIRATION_IN_MINUTES)
        };

        const sasToken = await this.storageService.GenerateSASToken(
            this.apiContext, location, sasTokenOption);

        return response.send(`SAS Token: ${sasToken}`)
    };

    check_upload = async (location: IStorageLocation) : Promise<boolean> => {
        const readBlobContent = await this.downloadBlob(location);
        return (readBlobContent === SampleBlobContent);
    };


    uploadToURL = async (url: string, data: Buffer): Promise<number> => {
        const blob = new BlockBlobClient(url, new AnonymousCredential());
        const response = await blob.upload(data, data.length);
        return response._response.status;
    };


    downloadFromURL = async (url: string): Promise<Buffer> => {
        const blob = new BlockBlobClient(url, new AnonymousCredential());
        return await blob.downloadToBuffer();
    };


    fileFromUrlExists = async (url: string): Promise<boolean> => {
        const blob = new BlockBlobClient(url, new AnonymousCredential());
        return await blob.exists();
    }

    // Testing basic storage functionality
    createBlob = async (location: IStorageLocation, data: string): Promise<void> => {
        const uploadUrlOption: IUploadUrlOptions = {
            BatchUpload: false,
            Expiration: new Date(new Date().valueOf() + URL_EXPIRATION_IN_MINUTES),
            Start: new Date(),
            StartResumable: false
        };

        const uploadURL = await this.storageService.GenerateUploadUrl(
            this.apiContext, location, uploadUrlOption);

        const buffer = Buffer.from(data);
        try {
            await this.uploadToURL(uploadURL, buffer);
        } catch (error) {
            Logger.Critical(`failed to upload to URL: ${error}`);
        }
    }

    downloadBlob = async (location: IStorageLocation): Promise<string> => {
        const downloadUrlOption: IDownloadUrlOptions = {
            BatchDownload: false,
            Expiration: new Date(new Date().valueOf() + URL_EXPIRATION_IN_MINUTES),
            Start: new Date()
        };

        const downloadURL = await this.storageService.GenerateDownloadUrl(
            this.apiContext, location, downloadUrlOption);
        const buffer = await this.downloadFromURL(downloadURL);
        return buffer.toString();
    }



}