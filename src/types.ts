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

export interface UIHandlersRegisteredHandler extends EventHandler {
  name: "UI_HANDLERS_REGISTERED";
  handler: (success: boolean) => void;
}

export enum FileType {
  Component = "component",
  Page = "page",
}

export enum NewOrEditMode {
  CreateNewFile = "Create New File",
  UpdateExistingFile = "Update Existing File",
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

export interface SnapshotImageHandler extends EventHandler {
  name: "SNAPSHOT_IMAGE";
  handler: (data: { imageBase64: string }) => void;
}

export interface SnapshotErrorHandler extends EventHandler {
  name: "SNAPSHOT_ERROR";
  handler: (data: { message: string }) => void;
}

export interface SelectionChangeHandler extends EventHandler {
  name: "SELECTION_CHANGE";
  handler: (selection: readonly SceneNode[]) => void;
}

export enum IMAGE_TYPE {
  JPEG = "image/jpeg",
  PNG = "image/png",
}

export interface ImageData {
  imageBase64: string;
  imageName: string;
  imageType: IMAGE_TYPE;
}
