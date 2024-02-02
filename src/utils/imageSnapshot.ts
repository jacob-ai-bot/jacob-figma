import { emit } from "@create-figma-plugin/utilities";
import { SnapshotErrorHandler, SnapshotImageHandler } from "../types";
import { snapshotIdKey } from "../constants";

export async function handleSelectionChange() {
  const currentSnapshotId = figma.currentPage.selection[0]?.id;
  const canUseSaved = await canUseSavedSnapshot(figma.currentPage.selection);

  if (currentSnapshotId && !canUseSaved) {
    snapshotSelectedNode(figma.currentPage.selection);

    // Save the current snapshot ID along with the current timestamp
    await figma.clientStorage.setAsync(snapshotIdKey, {
      id: currentSnapshotId,
      timestamp: Date.now(),
    });
  }
}

export async function canUseSavedSnapshot(selection: readonly SceneNode[]) {
  const currentSnapshotId = selection[0]?.id;
  const savedSnapshot = await figma.clientStorage.getAsync(snapshotIdKey);
  const savedSnapshotId = savedSnapshot?.id;
  const savedTimestamp = savedSnapshot?.timestamp;

  // If the saved snapshot is older than 30 mins, we run the risk of the signed url expiring
  const hasExpired =
    savedTimestamp && Date.now() - savedTimestamp > 30 * 60 * 1000;

  return currentSnapshotId === savedSnapshotId && !hasExpired;
}

export async function snapshotSelectedNode(selection: readonly SceneNode[]) {
  if (selection.length === 0) {
    emit<SnapshotErrorHandler>("SNAPSHOT_ERROR", {
      message:
        "No node selected. Please select a node to capture its snapshot.",
    });
    return;
  }
  let imageBase64: string | undefined;
  try {
    const imageData = await selection[0].exportAsync({
      format: "PNG",
      constraint: { type: "SCALE", value: 2 },
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

export function convertToBase64(imageData: Uint8Array): string {
  const imageString = base64ArrayBufferToString(imageData);
  const imageBase64 = `data:image/png;base64,${imageString}`;
  return imageBase64;
}

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