// Copyright (c) 2020 Schlumberger
// Schlumberger Private

/**
 * Cloud agnostic download url options.
 *
 * @export
 * @interface IUploadUrlOptions
 */
export interface IUploadUrlOptions {
  Start: Date;
  Expiration: Date;
  BatchUpload: boolean;
  StartResumable: boolean;
}
