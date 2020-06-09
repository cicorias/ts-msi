// Copyright (c) 2020 Schlumberger
// Schlumberger Private

/**
 * Describe storage location types
 *
 * @export
 * @enum StorageLocationType
 */
export enum StorageLocationType {
  /**
   * Containing immutable binary files
   */
  PermanentLargeBlob = 'DataLargeBlob',

  /**
   * Containing immutable revision files
   */
  PermanentSavedTransfers = 'DataSavedTransfers',

  /**
   * Containing temporary binary files
   */
  TemporaryLargeBlob = 'TemporaryLargeBlob',

  /**
   * Containing temporary files containing revision items
   */
  TemporaryTransferInProgress = 'TemporaryTransferInProgress',
}

/**
 * Cloud agnostic interface to describe storage locations
 *
 * @export
 * @interface IStorageLocation
 */
export interface IStorageLocation {
  FileName: string;
  Folder?: string;
  LocationType: StorageLocationType;
}