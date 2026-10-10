export type PutFileToPresignedUrlOptions = {
  presignedUrl: string;
  file: File;
  mimeType: string;
  onProgress?: (loaded: number, total: number) => void;
};

export function putFileToPresignedUrl({
  presignedUrl,
  file,
  mimeType,
  onProgress,
}: PutFileToPresignedUrlOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress?.(event.loaded, event.total);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }

      reject(new Error(`S3 upload failed with status ${xhr.status}`));
    });

    xhr.addEventListener("error", () => {
      reject(new Error("S3 upload network error"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("S3 upload aborted"));
    });

    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", mimeType);
    xhr.send(file);
  });
}
