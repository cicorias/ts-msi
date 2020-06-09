// Copyright (c) 2020 Schlumberger
// Schlumberger Private

import { IStorageLocation, StorageLocationType } from '../interfaces/istorage-location';

export class StorageLocationFactory {
  private constructor() { }

  public static CreateDataLargeBlob(name: string, folder?: string) {
    return { FileName: name, Folder: folder, LocationType: StorageLocationType.PermanentLargeBlob } as IStorageLocation;
  }
  public static CreateTemporaryLargeBlob(name: string, folder?: string) {
    return { FileName: name, Folder: folder, LocationType: StorageLocationType.TemporaryLargeBlob } as IStorageLocation;
  }
  public static CreateSavedTransfers(name: string, folder?: string) {
    return { FileName: name, Folder: folder, LocationType: StorageLocationType.PermanentSavedTransfers } as IStorageLocation;
  }
  public static CreateInProgressTransfers(name: string, folder?: string) {
    return { FileName: name, Folder: folder, LocationType: StorageLocationType.TemporaryTransferInProgress } as IStorageLocation;
  }
}
