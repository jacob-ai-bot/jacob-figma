import {
  getDescriptionOfNode,
  simplifyNode,
  updateCoordinatesRelativeToParent,
  SimplifiedNode,
} from "./utils/nodes";
import { GitHubRepo } from "./github";
import { IMAGE_TYPE } from "./types";

export function getSimplifiedNode(node?: BaseNode) {
  if (typeof node === "undefined") {
    return;
  }

  const simpleNode = simplifyNode(node as SceneNode);
  if (!simpleNode) {
    return undefined;
  }

  return updateCoordinatesRelativeToParent(simpleNode);
}

interface DesignResponse {
  data?: { success: boolean };
  errors?: string[];
}

export async function createIssuesForFigmaFile(
  relativeNodes: Partial<SimplifiedNode>,
  repo: GitHubRepo,
  specifiedFileName: string,
  fileName: string,
  additionalInstructions: string,
  newFileType?: string,
  snapshotUrl?: string,
  imageUrls?: string[],
) {
  const isNewFile = newFileType !== undefined;
  const figmaMap = relativeNodes
    ? getDescriptionOfNode(relativeNodes, true)
    : "";
  const figmaMapCSS = relativeNodes
    ? getDescriptionOfNode(relativeNodes, false)
    : "";

  const accessToken = await figma.clientStorage.getAsync("ACCESS_TOKEN");
  // const url = `http://localhost:5173/api/design/${isNewFile ? "new" : "edit"}`;
  const url = `https://app.jacb.ai/api/design/${isNewFile ? "new" : "edit"}`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        figmaMap,
        figmaMapCSS,
        repo,
        specifiedFileName,
        fileName,
        newFileType,
        additionalInstructions,
        snapshotUrl,
        imageUrls,
      }),
    });
    return (await response.json()) as DesignResponse;
  } catch (error) {
    return { data: { success: false }, errors: [(error as Error).message] };
  }
}

export async function uploadImage(
  image: string | undefined,
  imageType: IMAGE_TYPE = IMAGE_TYPE.PNG,
  shouldResize: boolean = false,
  imageName?: string,
): Promise<{ data: { success: boolean; url?: string }; errors?: string[] }> {
  const accessToken = await figma.clientStorage.getAsync("ACCESS_TOKEN");
  //const url = `http://localhost:5173/api/image/upload`;
  const url = `https://app.jacb.ai/api/image/upload`;

  try {
    if (!image || !image.length) {
      throw new Error("No image data provided");
    }
    image = image.replace(/^data:image\/\w+;base64,/, "");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image,
        imageType,
        imageName,
        shouldResize,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Assuming the API returns a JSON object with a 'success' boolean
    // and, if successful, a 'url' string pointing to the uploaded image.
    if (data.success) {
      return { data: { success: true, url: data.url } };
    } else {
      return {
        data: { success: false },
        errors: data.errors || ["Unknown error occurred"],
      };
    }
  } catch (error) {
    console.error("Error uploading snapshot:", error);
    return { data: { success: false }, errors: [(error as Error).message] };
  }
}
