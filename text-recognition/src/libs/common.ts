function file2Buffer(file: File): Promise<Buffer | Error> {
  return new Promise(function (resolve, reject) {
    try {
      const reader = new FileReader();
      const readFile = function (e: ProgressEvent<FileReader>) {
        const buffer = reader.result;
        resolve(buffer as Buffer);
      };

      reader.addEventListener("load", readFile);
      reader.readAsArrayBuffer(file);
    } catch (error) {
      reject(new Error("Failed to convert file to buffer."));
    }
  });
}
