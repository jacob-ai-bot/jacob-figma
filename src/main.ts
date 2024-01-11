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
} from "./types";
import { getRepos, type GitHubRepo } from "./github";
import { authRedirectPageHtml } from "./authPageRedirect";
import { defaultSize, accessTokenKey } from "./constants";
import { getSimplifiedNode, createIssuesForFigmaFile } from "./api";
import { SimplifiedNode } from "./utils/nodes";

export default function () {
  on<ResizeWindowHandler>("RESIZE_WINDOW", ({ width, height }) =>
    figma.ui.resize(width, height),
  );
  on<SaveAccessTokenHandler>("SAVE_ACCESS_TOKEN", async (accessToken) => {
    console.log("saveAccessToken", accessToken);
    await figma.clientStorage.setAsync(accessTokenKey, accessToken);
    checkAccessTokenAndShowUI();
  });
  on<EditExistingFileHandler>("EDIT_EXISTING_FILE", handleCreateOrEdit);
  on<CreateNewFileHandler>("CREATE_NEW_FILE", handleCreateOrEdit);
  checkAccessTokenAndShowUI();
}

async function handleCreateOrEdit({
  selectedRepo,
  fileName,
  fileType,
  additionalInstructions,
}: CreateNewFileData | EditExistingFileData) {
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

    const { data, errors } = await createIssuesForFigmaFile(
      node,
      selectedRepo,
      fullFileName,
      additionalInstructions,
      fileType !== undefined,
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

    emit<UpdateAccessTokenAndReposHandler>("UPDATE_ACCESS_TOKEN_AND_REPOS", {
      accessToken,
      repos,
    });
  } else {
    figma.showUI(authRedirectPageHtml, defaultSize);
  }
}
