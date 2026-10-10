/** Stable app URL for a ready file asset (proxied S3 read). */
export function buildFileAssetServeUrl(fileAssetId: string): string {
  return `/api/files/${fileAssetId}`;
}
