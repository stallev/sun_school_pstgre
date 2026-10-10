export function isIosSafari(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  const userAgent = navigator.userAgent;
  const isAppleDevice = /iPad|iPhone|iPod/.test(userAgent);
  const isSafari =
    /Safari/.test(userAgent) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS|Chrome/.test(userAgent);

  return isAppleDevice && isSafari;
}
