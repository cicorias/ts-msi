// Copyright (c) 2020 Schlumberger
// Schlumberger Private

import { IAzureConfiguration, IGoogleConfiguration } from '../middleware/cloud-platform';

export interface IApiContext {
  TenantId: string;
  DataPartitionId: string;
  UserId: string;
  AccessToken: string;
  CorrelationId: string;
  CloudConfiguration: IAzureConfiguration | IGoogleConfiguration;
}
