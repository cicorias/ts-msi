import { Readable } from 'stream';
import {
  UserDelegationKey,
  BlobServiceClient,
  ContainerSASPermissions,
  generateBlobSASQueryParameters,
  SASProtocol,
  BlockBlobClient,
  BlockBlobUploadOptions
} from '@azure/storage-blob';
import {
  DefaultAzureCredential,
} from "@azure/identity";
import { IStorageLocation, StorageLocationType } from '../interfaces/istorage-location';
import { ISASTokenOptions } from '../interfaces/isas-token-options';
import { IUploadUrlOptions } from '../interfaces/iupload-url-options';
import { IDownloadUrlOptions } from '../interfaces/idownload-url-options';
import { IAzureStorageDataPartition, IResolvedAzureBlobAndContainer, ICachedUserDelegationKey } from '../interfaces/iazure-storage-data-partition';
import { IStorageWriteResult } from '../interfaces/istorage-write-result';
import { Logger } from './logger';
import { Label } from './label';
import { IStorageWriteOptions } from '../interfaces/istorage-write-options';


const SasTokenValidityInMinutes = 60;
const UserDelegationKeyValidityInMinutes = 60 * 4; // 4 hours
const ExpirationLeadInMinutes = 15; // expire 15 minutes before actual date
const BlobNotFoundErrorCode = 'BlobNotFound';
const BlobAlreadyExistsErrorCode = 'BlobAlreadyExists';
const BlobNotFoundErrorMessagePrefix = 'File not found';
const PermanentLargeBlobContainerName = 'sdms-data-large-blob';
const PermanentSavedTransferContainerName = 'sdms-data-xfers-in-saved';
const TemporaryLargeBlobContainerName = 'sdms-transfer-large-blob';
const TemporaryTransferInProgressContainerName = 'sdms-transfer-xfers-in-progress';


export class AzureStorageDataPartition implements IAzureStorageDataPartition {
    private delegationKeyMap: Map<string, ICachedUserDelegationKey>;
  
    constructor(private transferBlobClient: BlobServiceClient, private permanentBlobClient: BlobServiceClient) {
        this.delegationKeyMap = new Map<string, ICachedUserDelegationKey>();
    }
  
    public async GenerateDownloadUrl(location: IStorageLocation, options: IDownloadUrlOptions): Promise<string> {
        const { containerName, blobServiceClient } = await this.CreateContainer(location);
        const userDelegationKey = await this.GetDelegationKey(blobServiceClient);
        const folderAndFileName = this.GetFolderAndFilePart(location);
        const blobName = options.BatchDownload ? undefined : folderAndFileName;
    
        const permissions = new ContainerSASPermissions();
        permissions.list = !location.FileName && options.BatchDownload; // can only list if not processing a single blob
        permissions.read = true;
    
        const expiresOn = this.AddMinutes(options.Expiration, SasTokenValidityInMinutes);
        const containerSAS = generateBlobSASQueryParameters({
          containerName,
          blobName,
          permissions,
          protocol: SASProtocol.Https,
          expiresOn
        }, userDelegationKey, // UserDelegationKey
          blobServiceClient.accountName);
        return this.GenerateUrl(blobServiceClient.accountName, containerName, folderAndFileName, containerSAS.toString());
    }

    
    public async GenerateSASToken(location: IStorageLocation, options: ISASTokenOptions): Promise<string> {
      const { containerName, blobServiceClient } = await this.CreateContainer(location);
      const userDelegationKey = await this.GetDelegationKey(blobServiceClient);
      const blobName = this.GetFolderAndFilePart(location);
  
      const permissions = new ContainerSASPermissions();
      permissions.write = true;
      permissions.read = true;
  
      const accountName = this.transferBlobClient.accountName;
  
      const expiresOn = this.AddMinutes(options.Expiration, SasTokenValidityInMinutes);
      const containerSAS = generateBlobSASQueryParameters({
        containerName,
        blobName,
        permissions,
        protocol: SASProtocol.Https,
        expiresOn
      }, userDelegationKey, // UserDelegationKey
        accountName);
      return containerSAS.toString();
  }


    public async GenerateUploadUrl(location: IStorageLocation, options: IUploadUrlOptions): Promise<string> {
        const { containerName, blobServiceClient } = await this.CreateContainer(location);
        const userDelegationKey = await this.GetDelegationKey(blobServiceClient);
        const folderAndFileName = this.GetFolderAndFilePart(location);
        const blobName = options.BatchUpload ? undefined : folderAndFileName;
    
        const permissions = new ContainerSASPermissions();
        permissions.write = true;
        permissions.read = true;
    
        const accountName = this.transferBlobClient.accountName;
    
        const expiresOn = this.AddMinutes(options.Expiration, SasTokenValidityInMinutes);
        const containerSAS = generateBlobSASQueryParameters({
          containerName,
          blobName,
          permissions,
          protocol: SASProtocol.Https,
          expiresOn
        }, userDelegationKey, // UserDelegationKey
          accountName);
        return this.GenerateUrl(accountName, containerName, folderAndFileName, containerSAS.toString());
    }
    
    
    public async Write(location: IStorageLocation, stream: NodeJS.ReadableStream, options?: IStorageWriteOptions): Promise<IStorageWriteResult> {

        const blob = this.GetBlob(location);
    
        if (options && options.ContentLength !== undefined) {
          const readableFactory = (): NodeJS.ReadableStream => stream;
          const uploadResult = await blob.upload(readableFactory, options.ContentLength)
          return {
            Md5Hash: this.GetMd5(uploadResult?.contentMD5)
          } as IStorageWriteResult;
        } else {
    
          const uploadResult = await blob.uploadStream(stream as Readable);
          return {
            Md5Hash: this.GetMd5(uploadResult?.contentMD5)
          } as IStorageWriteResult;
        }
    }
    
    public async WriteBuffer(location: IStorageLocation, data: Buffer, overwrite: boolean): Promise<void> {
        const { blobServiceClient, containerName } = this.ResolveAzureBlobAndContainer(location);
        const options = {} as BlockBlobUploadOptions;
    
        if (!overwrite) {
          // To avoid overwriting existing file access condition for eTag should be used to avoid extra roundtrips (i.e. using exists).
          // ifNoneMatch: '*' means it will write when file does not exist yet.
          options.conditions = {
            ifNoneMatch: '*'
          };
        }
    
        const container = blobServiceClient.getContainerClient(containerName);
        try {
          await container.uploadBlockBlob(location.FileName, data, data.length, options)
        } catch (error) {
          if (!overwrite && this.IsBlobAlreadyExistsError(error)) {
            Logger.Info(`File write skipped. File already exists at target location: '${location.FileName}'`)
            return;
          }
          throw error;
        }
    }
    
    public async ReadBuffer(location: IStorageLocation): Promise<Buffer> {
        const blob = this.GetBlob(location);
    
        try {
          return await blob.downloadToBuffer();
        } catch (error) {
          if (this.IsBlobNotFoundError(error)) {
            Logger.Error(`Error reading file '${location.FileName}': ${error}`, Label.FromClass(AzureStorageDataPartition.name));
            throw new Error(`${BlobNotFoundErrorMessagePrefix} reading file '${location.FileName}'`);
          }
          throw error;
        }
    }
    
    public async Exists(location: IStorageLocation): Promise<boolean> {
        const blob = this.GetBlob(location);
        return await blob.exists();
    }
    
    private IsBlobNotFoundError(error: any): boolean {
        return (error.details?.errorCode === BlobNotFoundErrorCode ||
          error.details?._response?.errorCode === BlobNotFoundErrorCode);
    }
    
    private IsBlobAlreadyExistsError(error: any): boolean {
        return (error.details?.errorCode === BlobAlreadyExistsErrorCode ||
          error.details?._response?.errorCode === BlobAlreadyExistsErrorCode);
    }
    
    private async GetDelegationKey(blobServiceClient: BlobServiceClient): Promise<UserDelegationKey> {
        const key = blobServiceClient.accountName;
        const now = new Date();
        const cache = this.delegationKeyMap.get(key);
        if (cache && cache.expiration > now) {
            return cache.key;
        }

        const expiresOn = this.AddMinutes(now, UserDelegationKeyValidityInMinutes);

        // Getting a key that is valid from 15 minutes ago, in order to handle clock differences
        const response = await blobServiceClient.getUserDelegationKey(this.AddMinutes(now, -ExpirationLeadInMinutes), expiresOn);

        // Expiring the key 15 minutes before it stops being valid in order to handle clock differences
        const keyExpiration = this.AddMinutes(expiresOn, -ExpirationLeadInMinutes);
        this.delegationKeyMap.set(key, { key: response, expiration: keyExpiration });

        return response;
    }

    private GetMd5(md5?: Uint8Array): string | undefined {
        return md5 ? Buffer.from(md5).toString('base64')
            : undefined;
    }

    private GetBlob(location: IStorageLocation): BlockBlobClient {
        const { containerName, blobServiceClient } = this.ResolveAzureBlobAndContainer(location);
        const containerClient = blobServiceClient.getContainerClient(containerName);
        return containerClient.getBlockBlobClient(this.GetFolderAndFilePart(location));
    }
    

    private GenerateUrl(accountName: string, containerName: string, folderAndFileName: string, sasQueryParameters: string): string {
        const folderAndFileNameWithSeparator = folderAndFileName ? `/${folderAndFileName}` : '';
        return `https://${accountName}.blob.core.windows.net/${containerName}${folderAndFileNameWithSeparator}?${sasQueryParameters}`;
    }
    
    private GetFolderAndFilePart(location: IStorageLocation): string {
        let result = location.Folder ? location.Folder : '';
        if (location.FileName) {
            if (result) {
            result += '/';
            }
            result += location.FileName;
        }
        return result;
    }
    
    private AddMinutes(d: Date, minutes: number): Date {
        return new Date(d.valueOf() + (minutes * 60 * 1000));
    }
    
    private ResolveAzureBlobAndContainer(location: IStorageLocation): IResolvedAzureBlobAndContainer {
        switch (location.LocationType) {
          case StorageLocationType.PermanentLargeBlob:
            return { containerName: PermanentLargeBlobContainerName, blobServiceClient: this.permanentBlobClient };
    
          case StorageLocationType.PermanentSavedTransfers:
            return { containerName: PermanentSavedTransferContainerName, blobServiceClient: this.permanentBlobClient };
    
          case StorageLocationType.TemporaryLargeBlob:
            return { containerName: TemporaryLargeBlobContainerName, blobServiceClient: this.transferBlobClient };
    
          case StorageLocationType.TemporaryTransferInProgress:
            return { containerName: TemporaryTransferInProgressContainerName, blobServiceClient: this.transferBlobClient };
    
          default:
            throw new Error(`location type '${location.LocationType}' is not handled`);
        }
    }
    

    public async CreateContainer(location: IStorageLocation) : Promise<IResolvedAzureBlobAndContainer> {
      return new Promise(async (resolve, reject) => {
        const { containerName, blobServiceClient } = this.ResolveAzureBlobAndContainer(location);

        try {
            const containerServiceClient = new BlobServiceClient(
                blobServiceClient.url,
                new DefaultAzureCredential()
            );

            const containerClient = containerServiceClient.getContainerClient(containerName);
            if (!(await containerClient.exists())) {
              await containerServiceClient.createContainer(containerName);
              Logger.Info(`Created container ${containerName} successfully`);
            } else {
              Logger.Info(`Container ${containerName} already exists`);
            }
            resolve({containerName, blobServiceClient});
        } catch (err) {
            Logger.Critical(
                `Creating a container failed, requestId=${err.details.requestId}, statusCode=${err.statusCode}, errorCode=${err.errorCode}`
            ); 
            reject(err);
        }
        reject(new Error(`Failed to create container: '${containerName}'`));
      });
    }
}
