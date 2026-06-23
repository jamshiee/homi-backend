export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';

export interface IStorageProvider {
  /**
   * Uploads a file buffer to the storage provider.
   * @param buffer The file buffer to upload.
   * @param filename The intended filename (or path) for the file.
   * @param mimeType The MIME type of the file.
   * @returns A promise that resolves to the public URL of the uploaded file.
   */
  uploadFile(
    buffer: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<string>;
}
