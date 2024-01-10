import { on, emit, showUI } from "@create-figma-plugin/utilities";

import {
  ResizeWindowHandler,
  SaveAccessTokenHandler,
  UpdateAccessTokenAndReposHandler,
} from "./types";
import { getRepos, type GitHubRepo } from "./github";
import { authRedirectPageHtml } from "./authPageRedirect";
import { defaultSize, accessTokenKey } from "./constants";

export default function () {
  on<ResizeWindowHandler>("RESIZE_WINDOW", ({ width, height }) =>
    figma.ui.resize(width, height),
  );
  on<SaveAccessTokenHandler>("SAVE_ACCESS_TOKEN", async (accessToken) => {
    await figma.clientStorage.setAsync(accessTokenKey, accessToken);
    checkAccessTokenAndShowUI();
  });
  checkAccessTokenAndShowUI();
}

const checkAccessTokenAndShowUI = async () => {
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
};
