/**
 * Read a file as a data URL
 */
export const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });

/**
 * Trigger the browser download of the given url (a data or object url)
 */
export const downloadUrl = (url: string, filename: string): void => {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
};

/**
 * Trigger the browser download of the given text
 */
export const downloadText = (text: string, filename: string): void => {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  downloadUrl(url, filename);
  // Some browsers start the download asynchronously
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
