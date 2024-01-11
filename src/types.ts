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

export enum FileType {
  Component = "component",
  Page = "page",
}

export interface BaseFileData {
  selectedRepo: GitHubRepo;
  fileName: string;
  additionalInstructions: string;
}

export interface EditExistingFileData extends BaseFileData {
  fileType: undefined;
}

export interface EditExistingFileHandler extends EventHandler {
  name: "EDIT_EXISTING_FILE";
  handler: (data: EditExistingFileData) => void;
}

export interface CreateNewFileData extends BaseFileData {
  fileType: FileType;
}

export interface CreateNewFileHandler extends EventHandler {
  name: "CREATE_NEW_FILE";
  handler: (data: CreateNewFileData) => void;
}

export interface CreateOrEditResultHandler extends EventHandler {
  name: "CREATE_OR_EDIT_RESULT";
  handler: (data: { success?: boolean; error?: Error }) => void;
}

export interface NotifyHandler extends EventHandler {
  name: "NOTIFY";
  handler: (message: string) => void;
}

export interface ClosePluginHandler extends EventHandler {
  name: "CLOSE_PLUGIN";
  handler: () => void;
}
