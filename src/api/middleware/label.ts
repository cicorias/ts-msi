// Copyright (c) 2017 Schlumberger
// Schlumberger Private
import * as _ from 'lodash';
import { IApiContext } from '../interfaces/i-api-context.model';

/**
 * Logging severity
 *
 * @export
 * @enum Severity
 */
export enum Severity {
  Debug = 'debug',
  Info = 'info',
  Warning = 'warn',
  Error = 'error',
  Critical = 'silly'
}



export class Label {

  public static FromClass(className: string): Label {
    return new Label(className, 'class');
  }

  public static From(value: string, key: string = 'category'): Label {
    return new Label(value, key);
  }

  public static CorrelationId(value: string): Label {
    return new Label(value, 'correlationId');
  }

  public static FromContext(context: IApiContext): any {
    return [
      new Label(context ? context.CorrelationId : '', 'correlationId'),
      new Label(context ? context.TenantId : '', 'tenant')
    ];
  }

  constructor(public value: string, public key: string) {
  }
}

export const DefaultStackDriverLoggingOptions = {
  level: Severity.Info,
  logName: process.env.SERVICE_NAME || 'pdms-server',
  resource: {
    labels: {
      cluster_name: process.env.CLUSTER_NAME || 'cluster',
      container_name: process.env.SERVICE_NAME || 'pdms-server',
      module_id: 'petrel-storage-server',
      namespace_id: process.env.METADATA_NAMESPACE || 'default',
      pod_id: process.env.POD_NAME || 'unknown'
    },
    type: 'gke_container'
  }
};

