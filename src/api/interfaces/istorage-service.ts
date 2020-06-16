// Copyright (c) 2020 Schlumberger
// Schlumberger Private

import { IStorageLocation } from './istorage-location';
import { IApiContext } from './i-api-context.model';
import { IUploadUrlOptions } from './iupload-url-options';
import { IDownloadUrlOptions } from './idownload-url-options';
import { IStorageWriteResult } from './istorage-write-result';
import { IStorageWriteOptions } from './istorage-write-options';
import { ISASTokenOptions } from './isas-token-options';

/**
 * Abstraction to expose common storage operation for different cloud providers
 *
 * @export
 * @interface IStorageService
 */
export interface IStorageService {

  /**
   *  Returns true if file exists for the supplied location
   *
   * @param {IApiContext} context API context
   * @param {IStorageLocation} location File location
   * @returns {Promise<boolean>} true if file exists
   * @memberof IStorageService
   */
  Exists(context: IApiContext, location: IStorageLocation): Promise<boolean>


/**
   * Generates a SAS token for file or container location
   *
   * @param {IApiContext} context API context
   * @param {IStorageLocation} location file location
   * @param {ISASTokenOptions} options SAS Token options (i.e. start, expiration)
   * @returns {Promise<string>}
   * @memberof IStorageService
   */
  GenerateSASToken(context: IApiContext, location: IStorageLocation, options: ISASTokenOptions): Promise<string>;  

  /**
   * Generates an upload url for file or container location
   *
   * @param {IApiContext} context API context
   * @param {IStorageLocation} location file location
   * @param {IUploadUrlOptions} options file upload options (i.e. start, expiration, batch)
   * @returns {Promise<string>}
   * @memberof IStorageService
   */
  GenerateUploadUrl(context: IApiContext, location: IStorageLocation, options: IUploadUrlOptions): Promise<string>;

  /**
   * Generates an download url for file or container location
   *
   * @param {IApiContext} context API context
   * @param {IStorageLocation} location file location
   * @param {IDownloadUrlOptions} options file upload options (i.e. start, expiration, batch)
   * @returns {Promise<string>}
   * @memberof IStorageService
   */
  GenerateDownloadUrl(context: IApiContext, location: IStorageLocation, options: IDownloadUrlOptions): Promise<string>;

  /**
   * Write stream to a blob
   *
   * @param {IApiContext} context API context
   * @param {IStorageLocation} location file location
   * @param {NodeJS.ReadableStream} stream data read stream
   * @param {IStorageWriteOptions} options storage write options
   * @returns {Promise<IStorageWriteResult} write result (metadata. i.e. MD5 hash)
   * @memberof IStorageService
   */
  Write(context: IApiContext, location: IStorageLocation, stream: NodeJS.ReadableStream, options?: IStorageWriteOptions): Promise<IStorageWriteResult>;

  /**
   * Write a buffer to a blob 
   *
   * @param {IApiContext} context API context
   * @param {IStorageLocation} location file location
   * @param {Buffer} data data buffer
   * @param {boolean} overwrite if true overwrite existing blob
   * @returns {Promise<void>}
   * @memberof IStorageService
   */
  WriteBuffer(context: IApiContext, location: IStorageLocation, data: Buffer, overwrite: boolean): Promise<void>;


  /**
   * Returns back a buffer from the given storage blob
   *
   * @param {IApiContext} context API context
   * @param {IStorageLocation} location file location
   * @returns {Promise<Buffer>} result buffer
   * @memberof IStorageService
   */
  ReadBuffer(context: IApiContext, location: IStorageLocation): Promise<Buffer>;

}
