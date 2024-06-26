import { emit } from "@create-figma-plugin/utilities";
import {
  IMAGE_TYPE,
  ImageData,
  SnapshotErrorHandler,
  SnapshotImageHandler,
} from "../types";
import { snapshotCacheTimeInMiliseconds, snapshotIdKey } from "../constants";
import { SimplifiedNode } from "./nodes";

export async function getImagesFromNodes(
  node: Partial<SimplifiedNode>,
  images: ImageData[] = [],
): Promise<ImageData[]> {
  if (!node) {
    return images;
  }
  if (node.image && node.image.imageHash) {
    const imageName = node.image.imageHash;
    const image = figma.getImageByHash(node.image.imageHash);

    // get the b64-encoded image string
    const imageBytes = await image?.getBytesAsync();
    const imageBase64 = convertToBase64(imageBytes as Uint8Array);

    images.push({
      imageBase64,
      imageName,
    } as ImageData);
  }
  if (node.children) {
    for (const child of node.children) {
      await getImagesFromNodes(child, images);
    }
  }
  return images;
}

function selectionIsValid(selection: readonly SceneNode[]) {
  if (selection.length === 0) {
    emit<SnapshotErrorHandler>("SNAPSHOT_ERROR", {
      message:
        "Please select the frame or group of the design to convert to code.",
    });
    return false;
  }
  if (selection.length > 1) {
    emit<SnapshotErrorHandler>("SNAPSHOT_ERROR", {
      message: "Please select only one frame or group at a time.",
    });
    return false;
  }
  return true;
}

const getUniqueSnapshotId = (node: SceneNode): string | null => {
  const { name, id, width, height } = node;
  if (!name || !id || !width || !height) {
    return null;
  }
  return `${name}-${id}-${width}-${height}`;
};

export async function handleSelectionChange() {
  const selection = figma.currentPage.selection;
  if (!selectionIsValid(selection)) {
    return;
  }
  const currentSnapshotId = getUniqueSnapshotId(selection[0]);
  const canUseSaved = await canUseSavedSnapshot(currentSnapshotId);

  if (currentSnapshotId && !canUseSaved) {
    snapshotSelectedNode(selection);

    // Save the current snapshot ID along with the current timestamp
    await figma.clientStorage.setAsync(snapshotIdKey, {
      id: currentSnapshotId,
      timestamp: Date.now(),
    });
  }
}

export async function canUseSavedSnapshot(currentSnapshotId: string | null) {
  if (!currentSnapshotId) {
    return false;
  }
  const savedSnapshot = await figma.clientStorage.getAsync(snapshotIdKey);
  const savedSnapshotId = savedSnapshot?.id;
  const savedTimestamp = savedSnapshot?.timestamp;

  // The signed url will expire, so we need to check if the snapshot is still valid
  const hasExpired =
    savedTimestamp &&
    Date.now() - savedTimestamp > snapshotCacheTimeInMiliseconds;

  return currentSnapshotId === savedSnapshotId && !hasExpired;
}

export async function snapshotSelectedNode(selection: readonly SceneNode[]) {
  if (!selectionIsValid(selection)) {
    return;
  }
  let imageBase64: string | undefined;
  try {
    const imageData = await selection[0].exportAsync({
      format: "PNG",
    });
    imageBase64 = convertToBase64(imageData);

    emit<SnapshotImageHandler>("SNAPSHOT_IMAGE", { imageBase64 });
  } catch (error) {
    console.log("error in snapshotSelectedNode", error);
    emit<SnapshotErrorHandler>("SNAPSHOT_ERROR", {
      message: "Failed to export the selected node. Please try again.",
    });
  }
  return imageBase64;
}

export function convertToBase64(
  imageData: Uint8Array,
  imageType: IMAGE_TYPE = IMAGE_TYPE.PNG,
): string {
  const imageString = base64ArrayBufferToString(imageData);
  const imageBase64 = `data:${imageType};base64,${imageString}`;
  return imageBase64;
}

// Figma doesn't have access to the btoa function, so we need to convert the array buffer to a base64 string manually
function base64ArrayBufferToString(arrayBuffer: ArrayBuffer) {
  let base64 = "";
  const encodings =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  const bytes = new Uint8Array(arrayBuffer);
  const byteLength = bytes.byteLength;
  const byteRemainder = byteLength % 3;
  const mainLength = byteLength - byteRemainder;

  let a, b, c, d;
  let chunk;

  // Main loop deals with bytes in chunks of 3
  for (let i = 0; i < mainLength; i = i + 3) {
    // Combine the three bytes into a single integer
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
    c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
    d = chunk & 63; // 63       = 2^6 - 1

    // Convert the raw binary segments to the appropriate ASCII encoding
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
  }

  // Deal with the remaining bytes and padding
  if (byteRemainder == 1) {
    chunk = bytes[mainLength];

    a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

    // Set the 4 least significant bits to zero
    b = (chunk & 3) << 4; // 3   = 2^2 - 1

    base64 += encodings[a] + encodings[b] + "==";
  } else if (byteRemainder == 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

    a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4

    // Set the 2 least significant bits to zero
    c = (chunk & 15) << 2; // 15    = 2^4 - 1

    base64 += encodings[a] + encodings[b] + encodings[c] + "=";
  }

  return base64;
}
