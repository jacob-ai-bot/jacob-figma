import { on, emit, showUI } from "@create-figma-plugin/utilities";

import {
  EditExistingFileData,
  EditExistingFileHandler,
  CreateNewFileData,
  CreateNewFileHandler,
  CreateOrEditResultHandler,
  ResizeWindowHandler,
  SaveAccessTokenHandler,
  UpdateAccessTokenAndReposHandler,
  UIHandlersRegisteredHandler,
  FileType,
  NotifyHandler,
  ClosePluginHandler,
  IMAGE_TYPE,
  ImageData,
  ReauthGithubHandler,
} from "./types";
import { getRepos, type GitHubRepo } from "./github";
import { authRedirectPageHtml } from "./authPageRedirect";
import { defaultSize, accessTokenKey } from "./constants";
import {
  getSimplifiedNode,
  createIssuesForFigmaFile,
  uploadImage,
} from "./api";
import { SimplifiedNode } from "./utils/nodes";
import {
  snapshotSelectedNode,
  handleSelectionChange,
  getImagesFromNodes,
} from "./utils/images";

let resolveUIHandlersPromise: (success: boolean) => void;
const uiHandlersPromise = new Promise(
  (resolve) => (resolveUIHandlersPromise = resolve),
);

export default async function () {
  on<ResizeWindowHandler>("RESIZE_WINDOW", ({ width, height }) =>
    figma.ui.resize(width, height),
  );
  on<NotifyHandler>("NOTIFY", (message) => figma.notify(message));
  on<UIHandlersRegisteredHandler>(
    "UI_HANDLERS_REGISTERED",
    resolveUIHandlersPromise,
  );
  on<ClosePluginHandler>("CLOSE_PLUGIN", () => figma.closePlugin());
  on<SaveAccessTokenHandler>("SAVE_ACCESS_TOKEN", async (accessToken) => {
    await figma.clientStorage.setAsync(accessTokenKey, accessToken);
    await checkAccessTokenAndShowUI();
  });
  on<EditExistingFileHandler>("EDIT_EXISTING_FILE", handleCreateOrEdit);
  on<CreateNewFileHandler>("CREATE_NEW_FILE", handleCreateOrEdit);
  on<ReauthGithubHandler>("REAUTH_GITHUB", () => {
    figma.showUI(authRedirectPageHtml, defaultSize);
  });
  figma.on("selectionchange", handleSelectionChange);
  await checkAccessTokenAndShowUI();
}

async function handleCreateOrEdit({
  selectedRepo,
  fileName,
  fileType,
  additionalInstructions,
}: CreateNewFileData | EditExistingFileData) {
  const selection = figma.currentPage.selection;

  // -- Convert the Figma json to a simplified FigML format --
  const nodes = figma.currentPage.selection
    .map((node) => getSimplifiedNode(node))
    .filter((node) => node) as Partial<SimplifiedNode>[];
  if (nodes.length === 0) {
    figma.notify("Please select a node");
    emit<CreateOrEditResultHandler>("CREATE_OR_EDIT_RESULT", {});
  }

  for (const node of nodes) {
    let fullFileName: string;
    if (fileType) {
      // New component or page - generate a fullFileName
      const newFileName = fileName.trim();
      fullFileName =
        fileType === FileType.Component
          ? `src/components/${newFileName}`
          : `src/pages/${newFileName}`;
    } else {
      fullFileName = fileName;
    }

    // upload the snapshot to s3 and get the signed url with a 60 minute expiry
    const snapshot = await snapshotSelectedNode(selection);
    const { data: snapshotData, errors: snapshotErrors } = await uploadImage(
      snapshot,
      IMAGE_TYPE.PNG,
      true,
    );
    if (!snapshotData?.success || snapshotErrors) {
      emit<CreateOrEditResultHandler>("CREATE_OR_EDIT_RESULT", {
        success: false,
        error: new Error(snapshotErrors?.[0]),
      });
      break;
    }
    const snapshotUrl = snapshotData.url;

    // -- Get the images from the selected node --
    const images: ImageData[] = await getImagesFromNodes(node);

    // send to the upload image API in parallel
    const imageUploadPromises = images.map(
      ({ imageBase64, imageType, imageName }) =>
        uploadImage(imageBase64, imageType, false, imageName),
    );
    const imageUploadResults = await Promise.all(imageUploadPromises);
    const imageUrls = imageUploadResults
      .map((result) => result.data.url)
      .filter((url) => url !== undefined) as string[];

    // -- Create the GitHub issue --
    const { data, errors } = await createIssuesForFigmaFile(
      node,
      selectedRepo,
      fullFileName,
      additionalInstructions,
      fileType !== undefined,
      snapshotUrl,
      imageUrls,
    );
    const error = errors?.[0];
    if (!data?.success || error) {
      emit<CreateOrEditResultHandler>("CREATE_OR_EDIT_RESULT", {
        success: false,
        error: new Error(error),
      });
      break;
    }

    emit<CreateOrEditResultHandler>("CREATE_OR_EDIT_RESULT", {
      success: true,
    });
  }
}

async function checkAccessTokenAndShowUI() {
  const accessToken = await figma.clientStorage.getAsync(accessTokenKey);
  let repos: GitHubRepo[] | undefined;
  if (accessToken) {
    try {
      repos = await getRepos(accessToken);
    } catch (error) {
      console.error("error in getRepos", error);
      figma.showUI(authRedirectPageHtml, defaultSize);
    }
  }
  if (repos && accessToken) {
    showUI(defaultSize);
    await uiHandlersPromise;
    snapshotSelectedNode(figma.currentPage.selection);

    emit<UpdateAccessTokenAndReposHandler>("UPDATE_ACCESS_TOKEN_AND_REPOS", {
      accessToken,
      repos,
    });
  } else {
    figma.showUI(authRedirectPageHtml, defaultSize);
  }
  return;
}
