// Copyright (c) 2020 Schlumberger
// Schlumberger Private

import { BlobServiceClient } from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';
import { IAzureStorageDataPartition } from '../interfaces/iazure-storage-data-partition';
import { AzureStorageDataPartition } from './azure-storage-data-partition';
import { IAzureConnectionPool } from '../interfaces/iazure-connection-pool';
import { IApiContext } from '../interfaces/i-api-context.model';
import { IAzureConfiguration } from './cloud-platform';

/**
 * Connection pool implementation
 *
 * @export
 * @class AzureConnectionPool
 */
export class AzureConnectionPool implements IAzureConnectionPool {

  private storagePartitionMap: Map<string, IAzureStorageDataPartition>;

  public constructor() {
    this.storagePartitionMap = new Map<string, IAzureStorageDataPartition>();
  }

  GetStorage(context: IApiContext): IAzureStorageDataPartition {
    const key = context.DataPartitionId;
    let storage = this.storagePartitionMap.get(key);
    if (storage != null) {
      return storage;
    }

    const cloudConfiguration = context.CloudConfiguration as IAzureConfiguration;
    const { transfer: transferAccountName, permanent: permanentAccountName } = cloudConfiguration.storageAccountName;
    const defaultAzureCredential = new DefaultAzureCredential();
    const transferBlobClient = new BlobServiceClient(
      `https://${transferAccountName}.blob.core.windows.net`,
      defaultAzureCredential);
    const permanentBlobClient = (transferAccountName === permanentAccountName) ? transferBlobClient : new BlobServiceClient(
      `https://${permanentAccountName}.blob.core.windows.net`,
      defaultAzureCredential);

    storage = this.CreateStorageDataPartition(transferBlobClient, permanentBlobClient);
    this.storagePartitionMap.set(key, storage);

    return storage;
  }

  protected CreateStorageDataPartition(transferBlobClient: BlobServiceClient, permanentBlobClient: BlobServiceClient): IAzureStorageDataPartition {
    return new AzureStorageDataPartition(transferBlobClient, permanentBlobClient);
  }

}

