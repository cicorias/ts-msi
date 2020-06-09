// Copyright (c) 2020 Schlumberger
// Schlumberger Private

import { IApiContext } from '../interfaces/i-api-context.model';
import { IStorageService } from '../interfaces/istorage-service';
import { IStorageLocation } from '../interfaces/istorage-location';
import { IUploadUrlOptions } from '../interfaces/iupload-url-options';
import { IDownloadUrlOptions } from '../interfaces/idownload-url-options';
import { IAzureConnectionPool } from '../interfaces/iazure-connection-pool';
import { IAzureStorageDataPartition } from '../interfaces/iazure-storage-data-partition';
import { IStorageWriteResult } from '../interfaces/istorage-write-result';
import { Logger } from '../middleware/logger';
import { Label } from '../middleware/label';
import { IStorageWriteOptions } from '../interfaces/istorage-write-options';
import { ISASTokenOptions } from '../interfaces/isas-token-options';

export class AzureStorageService implements IStorageService {

  constructor(private connectionPool: IAzureConnectionPool) { }

  private GetStorage(context: IApiContext): IAzureStorageDataPartition {
    return this.connectionPool.GetStorage(context);
  }

  public GenerateUploadUrl(context: IApiContext, location: IStorageLocation, options: IUploadUrlOptions): Promise<string> {
    Logger.Debug(`GenerateUploadUrl: ${location.FileName}`, Label.FromClass(AzureStorageService.name), Label.FromContext(context));

    const storage = this.GetStorage(context);
    return storage.GenerateUploadUrl(location, options);
  }

  public GenerateDownloadUrl(context: IApiContext, location: IStorageLocation, options: IDownloadUrlOptions): Promise<string> {
    Logger.Debug(`GenerateDownloadUrl: ${location.FileName}`, Label.FromClass(AzureStorageService.name), Label.FromContext(context));

    const storage = this.GetStorage(context);
    return storage.GenerateDownloadUrl(location, options);
  }

  public GenerateSASToken(context: IApiContext, location: IStorageLocation, options: ISASTokenOptions): Promise<string> {
    Logger.Debug(`GenerateSASToken: ${location.FileName}`, Label.FromClass(AzureStorageService.name), Label.FromContext(context));

    const storage = this.GetStorage(context);
    return storage.GenerateSASToken(location, options);
  }

  public Exists(context: IApiContext, location: IStorageLocation): Promise<boolean> {
    const storage = this.GetStorage(context);
    return storage.Exists(location);
  }

  public Write(context: IApiContext, location: IStorageLocation, stream: NodeJS.ReadableStream, options?: IStorageWriteOptions): Promise<IStorageWriteResult> {
    Logger.Debug(`Write file (stream): ${location.FileName}`, Label.FromClass(AzureStorageService.name), Label.FromContext(context));
    const storage = this.GetStorage(context);
    return storage.Write(location, stream, options);
  }

  public WriteBuffer(context: IApiContext, location: IStorageLocation, data: Buffer, overwrite: boolean): Promise<void> {
    Logger.Debug(`Write file (buffer): ${location.FileName}`, Label.FromClass(AzureStorageService.name), Label.FromContext(context));

    const storage = this.GetStorage(context);
    return storage.WriteBuffer(location, data, overwrite);
  }


  public ReadBuffer(context: IApiContext, location: IStorageLocation): Promise<Buffer> {
    Logger.Debug(`Read file (buffer): ${location.FileName}`, Label.FromClass(AzureStorageService.name), Label.FromContext(context));

    const storage = this.GetStorage(context);
    return storage.ReadBuffer(location);
  }
}
