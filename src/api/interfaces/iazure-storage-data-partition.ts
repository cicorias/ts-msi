import {
    UserDelegationKey,
    BlobServiceClient
  } from '@azure/storage-blob';
 
import { IStorageLocation } from './istorage-location';
import { ISASTokenOptions } from './isas-token-options';
import { IUploadUrlOptions } from './iupload-url-options';
import { IDownloadUrlOptions } from './idownload-url-options';
import { IStorageWriteResult } from './istorage-write-result';
import { IStorageWriteOptions } from './istorage-write-options';

export interface IResolvedAzureBlobAndContainer {
    containerName: string;
    blobServiceClient: BlobServiceClient;
}
  
export interface ICachedUserDelegationKey {
    key: UserDelegationKey;
    expiration: Date;
}


export interface IAzureStorageDataPartition {
    GenerateSASToken(location: IStorageLocation, options: ISASTokenOptions): Promise<string>;
    GenerateDownloadUrl(location: IStorageLocation, options: IDownloadUrlOptions): Promise<string>;
    GenerateUploadUrl(location: IStorageLocation, options: IUploadUrlOptions): Promise<string>;
    Exists(location: IStorageLocation): Promise<boolean>;
    Write(location: IStorageLocation, stream: NodeJS.ReadableStream, options?: IStorageWriteOptions): Promise<IStorageWriteResult>;
    WriteBuffer(location: IStorageLocation, data: Buffer, overwrite: boolean): Promise<void>;
    ReadBuffer(location: IStorageLocation): Promise<Buffer>;
    CreateContainer(location: IStorageLocation) : Promise<IResolvedAzureBlobAndContainer>;
}
  