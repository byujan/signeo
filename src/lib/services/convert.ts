const WORD_TYPES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/msword", // .doc
];

export function isWordFile(mimeType: string): boolean {
  return WORD_TYPES.includes(mimeType);
}

export function isPdfFile(mimeType: string): boolean {
  return mimeType === "application/pdf";
}
