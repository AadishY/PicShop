// Fix: Populate file with necessary type definitions.

export interface ImageFile {
  file?: File;
  url: string;
  data: string;
  mimeType: string;
}