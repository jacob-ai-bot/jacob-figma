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
  FileType,
  NotifyHandler,
  ClosePluginHandler,
} from "./types";
import { getRepos, type GitHubRepo } from "./github";
import { authRedirectPageHtml } from "./authPageRedirect";
import { defaultSize, accessTokenKey } from "./constants";
import {
  getSimplifiedNode,
  createIssuesForFigmaFile,
  uploadSnapshot,
} from "./api";
import { SimplifiedNode } from "./utils/nodes";
import { snapshotSelectedNode } from "./utils/imageSnapshot";

export default function () {
  on<ResizeWindowHandler>("RESIZE_WINDOW", ({ width, height }) =>
    figma.ui.resize(width, height),
  );
  on<NotifyHandler>("NOTIFY", (message) => figma.notify(message));
  on<ClosePluginHandler>("CLOSE_PLUGIN", () => figma.closePlugin());
  on<SaveAccessTokenHandler>("SAVE_ACCESS_TOKEN", async (accessToken) => {
    await figma.clientStorage.setAsync(accessTokenKey, accessToken);
    checkAccessTokenAndShowUI();
  });
  on<EditExistingFileHandler>("EDIT_EXISTING_FILE", handleCreateOrEdit);
  on<CreateNewFileHandler>("CREATE_NEW_FILE", handleCreateOrEdit);
  figma.on("selectionchange", () =>
    snapshotSelectedNode(figma.currentPage.selection),
  );

  checkAccessTokenAndShowUI();
}

async function handleCreateOrEdit({
  selectedRepo,
  fileName,
  fileType,
  additionalInstructions,
}: CreateNewFileData | EditExistingFileData) {
  const selection = figma.currentPage.selection;
  const snapshot = await snapshotSelectedNode(selection);

  const nodes = figma.currentPage.selection
    .map((node) => getSimplifiedNode(node))
    .filter((node) => node) as Partial<SimplifiedNode>[];

  for (const node of nodes) {
    let fullFileName: string;
    if (fileType) {
      // New component or page - generate a fullFileName
      const newFileName = fileName.trim();
      const updatedFileName = newFileName.endsWith(".tsx")
        ? newFileName
        : `${newFileName}.tsx`;
      fullFileName =
        fileType === FileType.Component
          ? `src/components/${updatedFileName}`
          : `src/pages/${updatedFileName}`;
    } else {
      fullFileName = fileName;
    }

    // upload this to s3 and get the signed url with a 60 minute expiry
    const { data: snapshotData, errors: snapshotErrors } =
      await uploadSnapshot(snapshot);
    if (!snapshotData?.success || snapshotErrors) {
      emit<CreateOrEditResultHandler>("CREATE_OR_EDIT_RESULT", {
        success: false,
        error: new Error(snapshotErrors?.[0]),
      });
      break;
    }

    const { data, errors } = await createIssuesForFigmaFile(
      node,
      selectedRepo,
      fullFileName,
      additionalInstructions,
      fileType !== undefined,
      snapshotData?.url,
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
    }
  }
  if (repos && accessToken) {
    showUI(defaultSize);
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
