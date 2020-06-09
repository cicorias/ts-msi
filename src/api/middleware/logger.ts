// Copyright (c) 2017 Schlumberger
// Schlumberger Private
import * as _ from 'lodash';
import { BasicTimer } from 'timecount/utils';
import { Time, TimeWriter, TimeWriterSettings } from 'timecount';
import * as winston from 'winston';
import { Label, Severity } from './label';
import { IApiContext } from '../interfaces/i-api-context.model';


export const DefaultStackDriverLoggingOptions = {
  level: Severity.Info,
  logName: process.env.SERVICE_NAME || 'sdms-server',
  resource: {
    labels: {
      cluster_name: process.env.CLUSTER_NAME || 'cluster',
      container_name: process.env.SERVICE_NAME || 'sdms-server',
      module_id: 'sdms-storage-server',
      namespace_id: process.env.METADATA_NAMESPACE || 'default',
      pod_id: process.env.POD_NAME || 'unknown'
    },
    type: 'az_container'
  }
};

export class Logger {

  public static Log(message: string, severity = Severity.Info, prefix: string = "", ...labels: Label[]): void {
    Logger.initialize();

    const messgePrefix: string = prefix || Logger.getMessagePrefix();
    const severityName: string = severity.toString();
    const metadata: any = {
      labels: {}
    };

    Logger.applyLabels(metadata, Logger.labels);
    Logger.applyLabels(metadata, Logger.labelFactories.map((labelFactory) => labelFactory()));
    Logger.applyLabels(metadata, labels);

    const logMessage = _.isEmpty(messgePrefix) ? message : `${messgePrefix} ${message}`;
    Logger.logger?.log(severityName, logMessage, metadata);
  }

  public static Debug(message: string, ...labels: Label[]): void {
    const args: [string, (Severity | undefined)?, (string | undefined)?, ...Label[]] = [message, Severity.Debug, undefined, ...labels];
    Logger.Log.apply(this, args);
  }

  public static Info(message: string, ...labels: Label[]): void {
    const args: [string, (Severity | undefined)?, (string | undefined)?, ...Label[]] = [message, Severity.Info, undefined, ...labels];
    Logger.Log.apply(this, args);
  }

  public static Warning(message: string, ...labels: Label[]): void {
    const args: [string, (Severity | undefined)?, (string | undefined)?, ...Label[]] = [message, Severity.Warning, undefined, ...labels];
    Logger.Log.apply(this, args);
  }

  public static Error(message: string, ...labels: Label[]): void {
    const args: [string, (Severity | undefined)?, (string | undefined)?, ...Label[]] = [message, Severity.Error, undefined, ...labels];
    Logger.Log.apply(this, args);
  }

  public static Critical(message: string, ...labels: Label[]): void {
    const args: [string, (Severity | undefined)?, (string | undefined)?, ...Label[]] = [message, Severity.Critical, undefined, ...labels];
    Logger.Log.apply(this, args);
  }

  public static UseMessagePrefix(prefix: string): void {
    Logger.prefix = prefix;
  }

  public static UseLogEntryLabel(label: Label): void {
    if (Logger.labels.findIndex((item) => item.key === label.key) === -1) {
      Logger.labels.push(label);
    }
  }

  public static UseLogEntryLabelFactory(factory: () => Label): void {
    Logger.labelFactories.push(factory);
  }

  public static UseConsoleLogging(options?: any): void {
    const loggerOptions: any = Object.assign(DefaultStackDriverLoggingOptions, options);
    loggerOptions.format = winston.format.simple();
    Logger.addTransportOption(new winston.transports.Console(loggerOptions));
  }

  public static UseMinimumSeverity(severity: Severity): void {
    Logger.minimumSeverity = severity;
  }

  public static async MeasureAsync(operation: Promise<any>, label: string, context: IApiContext, logMemoryUsage: boolean = true): Promise<any> {

    const timer = new BasicTimer(false);
    const correlationId: string = context.CorrelationId;
    const messagePrefix = `${label} - ${correlationId}`;

    timer.start();

    if (logMemoryUsage) {
      const memoryUsage: string = `${messagePrefix}: ${this.getMemoryUsageMessage()}`;
      Logger.Log(memoryUsage, Severity.Debug, '[PERF - START]', Label.From('performance', 'category'), Label.FromContext(context));
    }

    try {
      const result = await operation;
      return result;

    } finally {

      const measure: Time = timer.stop();

      const timingMessage = `${messagePrefix}: ${Logger.timeWriter.write(measure, 'milisecond')}`;

      Logger.Log(timingMessage, Severity.Debug, '[TIME]', Label.From('performance', 'category'), Label.FromContext(context));

      if (logMemoryUsage) {
        const memoryUsage: string = `${messagePrefix}: ${this.getMemoryUsageMessage()}`;
        Logger.Log(memoryUsage, Severity.Debug, '[PERF - END]', Label.From('performance', 'category'), Label.FromContext(context));
      }

    }
  }

  public static Measure(func: any, label: string, logMemoryUsage: boolean = true, context?: IApiContext): any {
    return (...args: any[]) => {
      const onlyArgs: any[] = args.slice(0, args.length - 1);
      const callback: any = args[args.length - 1];
      let apiContext = context;

      if (!context) {
        onlyArgs.find((a) => {
          if (a && a.ApiContext) {
            apiContext = a.ApiContext;
            return true;
          } else if (a && a.CorrelationId) {
            apiContext = a;
            return true;
          }
          return false;
        });

        apiContext = apiContext || { CorrelationId: Logger.correlationIdNotSet } as IApiContext;
      }

      if(apiContext === undefined) return;

      const correlationId: string = apiContext.CorrelationId;
      const messagePrefix = `${label} - ${correlationId}`;
      const timer = new BasicTimer(false);
      timer.start();

      if (logMemoryUsage) {
        const memoryUsage: string = `${messagePrefix}: ${this.getMemoryUsageMessage()}`;
        Logger.Log(memoryUsage, Severity.Debug, '[PERF - START]', Label.From('performance', 'category'), Label.FromContext(apiContext));
      }

      onlyArgs.push((...args2: any[]) => {

        if(apiContext === undefined) return;
        const measure: Time = timer.stop();
        const timingMessage = `${messagePrefix}: ${Logger.timeWriter.write(measure, 'milisecond')}`;

        Logger.Log(timingMessage, Severity.Debug, '[TIME]', Label.From('performance', 'category'), Label.FromContext(apiContext));

        if (logMemoryUsage) {
          const memoryUsage: string = `${messagePrefix}: ${this.getMemoryUsageMessage()}`;
          Logger.Log(memoryUsage, Severity.Debug, '[PERF - END]', Label.From('performance', 'category'), Label.FromContext(apiContext));
        }

        if (callback) {
          callback.apply(this, args2);
        }
      });

      func.apply(this, onlyArgs);
    };
  }

  public static IsInitialized(): boolean {
    return Logger.initialized;
  }

  public static initialize(reInitialize: boolean = false, logger: any = null): void {
    if (!Logger.logger || reInitialize) {

      if (!Logger.loggerOptions) {
        Logger.initializeLoggerOptions();
      }

      if (!logger) {
        logger = winston.createLogger(Logger.loggerOptions);
      }

      Logger.logger = logger;
      Logger.initialized = true;
    }
  }

  public static getMemoryUsageMessage(): string {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    return `The script uses approximately ${Math.round(used * 100) / 100} MB`;
  }

  private static prefix: string;
  private static logger: winston.Logger | undefined;
  private static loggerOptions: any;
  private static labels: Label[] = [];
  private static labelFactories: (() => Label)[] = [];
  private static minimumSeverity: Severity = Severity.Info;
  private static initialized: boolean = false;
  private static correlationIdNotSet: string = '<not set>';
  private static timeWriter = new TimeWriter({ decimalPlaces: 2 } as TimeWriterSettings);

  private static initializeLoggerOptions(options?: winston.LoggerOptions): void {
    if (Logger.logger) {
      Logger.logger = undefined;
    }

    if (!Logger.loggerOptions || options) {
      Logger.loggerOptions = options || {
        level: Logger.minimumSeverity,
        transports: []
      };
    }

    if (!options) {
      Logger.loggerOptions.level = Logger.minimumSeverity;
    }
  }

  private static addTransportOption(transport: any): void {
    Logger.initializeLoggerOptions();
    Logger.loggerOptions.transports.push(transport);
  }

  private static getMessagePrefix(): string {
    if (Logger.prefix) {
      return `[${Logger.prefix.toUpperCase()}] - `;
    }

    return '';
  }

  private static applyLabels(metadata: any, labels: Label[]): void {
    if (!labels) {
      return;
    }

    if (metadata) {

      if (!metadata.labels) {
        metadata.labels = {};
      }

      labels.forEach((label: Label | Label[]) => {
        if (_.isArray(label)) {
          const innerLabels = label as Label[];
          innerLabels.forEach((l) => {
            metadata.labels[l.key] = l.value;
          });
        } else {

          metadata.labels[(label as Label).key] = (label as Label).value;
        }
      });
    }
  }
}
