import { type FabricObject } from "fabric";

let messageID = -1;

const isImageDataTransparent = (imageData: ImageData) =>
  imageData.data.every((x, i) => i % 4 !== 3 || x === 0);

function isTransparent(object: FabricObject, worker?: Worker) {
  // should also move to offscreen
  const canvas = object.toCanvasElement({
    // multiplier: 0.1,
    enableRetinaScaling: false,
    viewportTransform: false,
    withoutTransform: true,
    withoutShadow: true,
  });

  const id = ++messageID;
  return new Promise<boolean>((resolve, reject) => {
    const imageData = canvas
      .getContext("2d")
      ?.getImageData(0, 0, canvas.width, canvas.height);

    if (!imageData) {
      reject();
    } else if (!worker) {
      resolve(isImageDataTransparent(imageData));
    } else {
      const messageHandler = (
        e: MessageEvent<{ messageID: number; isTransparent: boolean }>
      ) => {
        if (e.data.messageID === id) {
          worker.removeEventListener("message", messageHandler);
          resolve(e.data.isTransparent);
        }
      };
      worker.addEventListener("message", messageHandler);
      worker.postMessage(
        {
          imageData,
          messageID: id,
        },
        []
      );
    }
  });
}

isTransparent.installWorker = function installWorker() {
  addEventListener(
    "message",
    (e: MessageEvent<{ imageData: ImageData; messageID: number }>) => {
      const { imageData, messageID } = e.data;
      postMessage({
        isTransparent: isImageDataTransparent(imageData),
        messageID,
      });
    }
  );
};

export { isTransparent };
