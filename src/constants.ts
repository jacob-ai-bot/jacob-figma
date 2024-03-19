//
// UX constants
//

export const maxSize = { width: 350, height: 700 };
export const defaultSize = { width: 300, height: 610 };
export const resizeValues = {
  maxHeight: maxSize.height,
  maxWidth: maxSize.width,
  minHeight: 300,
  minWidth: 200,
};

//
// Client storage constants
//

export const accessTokenKey = "ACCESS_TOKEN";
export const snapshotIdKey = "SNAPSHOT_ID";
export const snapshotUrlKey = "SNAPSHOT_URL";
const snapshotCacheTimeInMinutes = 30;
export const snapshotCacheTimeInMiliseconds =
  snapshotCacheTimeInMinutes * 60 * 1000;

//
// Networking constants
//

export const API_URL = "https://app.jacb.ai/api";
// export const API_URL = "http://localhost:5173/api"; // For local use
