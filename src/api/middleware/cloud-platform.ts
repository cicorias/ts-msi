// Copyright (c) 2020 Schlumberger
// Schlumberger Private

export enum CloudPlatform {
  azure = 'azure',
  google = 'google'
}

export interface IAzureConfiguration {
  cloudVendorName: string;
  storageAccountName: {
    transfer: string,
    permanent: string
  };
  cosmosAccountName: string;
  cosmosDatabaseName: string;
}

export interface IGoogleConfiguration {
  cloudVendorName: string;
  projectId: string;
}
