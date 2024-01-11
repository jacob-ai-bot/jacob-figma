import {
  getDescriptionOfNode,
  simplifyNode,
  updateCoordinatesRelativeToParent,
  SimplifiedNode,
} from "./utils/nodes";
import { GitHubRepo } from "./github";

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
) {
  const figmaMap = relativeNodes ? getDescriptionOfNode(relativeNodes) : "";

  // Disabling this for now because we are going to change
  // how images are handled with otto-mvp:
  // await createIssuesForImages(relativeNodes);

  const accessToken = await figma.clientStorage.getAsync("ACCESS_TOKEN");
  // const url = `http://localhost:5173/api/design/${isNewFile ? "new" : "edit"}`;
  const url = `https://otto-mvp.onrender.com/api/design/${
    isNewFile ? "new" : "edit"
  }`;
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
      }),
    });
    return (await response.json()) as DesignResponse;
  } catch (error) {
    return { data: { success: false }, errors: [(error as Error).message] };
  }
}
