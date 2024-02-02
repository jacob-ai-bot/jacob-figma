import {
  getDescriptionOfNode,
  simplifyNode,
  updateCoordinatesRelativeToParent,
  SimplifiedNode,
} from "./utils/nodes";
import { GitHubRepo } from "./github";

enum IMAGE_TYPE {
  JPEG = "image/jpeg",
  PNG = "image/png",
}

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
  fileName: string,
  additionalInstructions: string,
  isNewFile: boolean = false,
  snapshotUrl: string | undefined = undefined,
) {
  const figmaMap = relativeNodes ? getDescriptionOfNode(relativeNodes) : "";

  // Disabling this for now because we are going to change
  // how images are handled:
  // await createIssuesForImages(relativeNodes);

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
        repo,
        fileName,
        additionalInstructions,
        snapshotUrl,
      }),
    });
    return (await response.json()) as DesignResponse;
  } catch (error) {
    return { data: { success: false }, errors: [(error as Error).message] };
  }
}

export async function uploadSnapshot(
  image: string | undefined,
  imageType: IMAGE_TYPE = IMAGE_TYPE.PNG,
): Promise<{ data: { success: boolean; url?: string }; errors?: string[] }> {
  const accessToken = await figma.clientStorage.getAsync("ACCESS_TOKEN");
  //const url = `http://localhost:5173/api/image/upload`;
  const url = `https://app.jacb.ai/api/design/upload-snapshot`;

  try {
    if (!image || !image.length) {
      throw new Error("No image data provided");
    }
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image,
        imageType,
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
