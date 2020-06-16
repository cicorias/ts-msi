// Copyright (c) 2020 Schlumberger
// Schlumberger Private

/**
 * Cloud agnostic download url options
 *
 * @export
 * @interface IDownloadUrlOptions
 */
export interface IDownloadUrlOptions {
  Start: Date;
  Expiration: Date;
  BatchDownload: boolean;
}
