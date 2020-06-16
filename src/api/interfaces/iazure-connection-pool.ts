// Copyright (c) 2018 Schlumberger
// Schlumberger Private

import { IApiContext } from './i-api-context.model';
import { IAzureStorageDataPartition } from './iazure-storage-data-partition';

/**
 * Connection pool for google datastore connection.
 *
 * @export
 * @interface IAzureConnectionPool
 */
export interface IAzureConnectionPool {
  GetStorage(context: IApiContext): IAzureStorageDataPartition;
}
