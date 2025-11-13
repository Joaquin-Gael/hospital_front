export function downloadBlob(blob: Blob, filename: string): void {
  if (!(blob instanceof Blob)) {
    return;
  }

  const safeFilename = filename?.trim() ? filename.trim() : `document-${Date.now()}`;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = safeFilename;
  anchor.rel = 'noopener';
  anchor.click();

  URL.revokeObjectURL(url);
}
