import { EventHandler } from "@create-figma-plugin/utilities";
import { GitHubRepo } from "./github";
export interface ResizeWindowHandler extends EventHandler {
  name: "RESIZE_WINDOW";
  handler: (windowSize: { width: number; height: number }) => void;
}

export interface UpdateAccessTokenAndReposHandler extends EventHandler {
  name: "UPDATE_ACCESS_TOKEN_AND_REPOS";
  handler: (data: { accessToken: string; repos: GitHubRepo[] }) => void;
}

export interface SaveAccessTokenHandler extends EventHandler {
  name: "SAVE_ACCESS_TOKEN";
  handler: (accessToken: string) => void;
}
