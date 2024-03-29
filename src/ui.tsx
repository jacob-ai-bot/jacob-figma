import {
  render,
  useWindowResize,
  Button,
  Textbox,
  Dropdown,
  TextboxMultiline,
  SegmentedControl,
  Text,
  Bold,
} from "@create-figma-plugin/ui";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import "!./output.css";
import { on, emit } from "@create-figma-plugin/utilities";

import {
  ResizeWindowHandler,
  UpdateAccessTokenAndReposHandler,
  EditExistingFileHandler,
  CreateNewFileHandler,
  CreateOrEditResultHandler,
  FileType,
  NotifyHandler,
  ClosePluginHandler,
  SnapshotErrorHandler,
  SnapshotImageHandler,
  UIHandlersRegisteredHandler,
  NewOrEditMode,
  ReauthGithubHandler,
} from "./types";
import { resizeValues } from "./constants";
import { getTree, GitTreeFile, GitHubRepo } from "./github";
import { Section } from "./section";

function Plugin() {
  const [accessToken, setAccessToken] = useState<string>();
  const [repos, setRepos] = useState<GitHubRepo[]>();
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo>();
  const [tree, setTree] = useState<GitTreeFile[]>();
  const [selectedFile, setSelectedFile] = useState<GitTreeFile>();
  const [fileType, setFileType] = useState(FileType.Component);
  const [newFilename, setNewFilename] = useState("");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [creatingIssue, setCreatingIssue] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState("");
  const [mode, setMode] = useState(NewOrEditMode.CreateNewFile);

  useWindowResize(
    (windowSize) => emit<ResizeWindowHandler>("RESIZE_WINDOW", windowSize),
    {
      ...resizeValues,
      resizeBehaviorOnDoubleClick: "minimize",
    },
  );

  useEffect(() => {
    if (!accessToken || !selectedRepo) return;

    const updateTree = async () => {
      setSelectedFile(undefined);
      const { owner, name, default_branch } = selectedRepo ?? {};
      try {
        const { tree } = await getTree(
          accessToken,
          owner.login,
          name,
          default_branch,
        );
        setTree(
          tree.filter(
            ({ path }) => path?.endsWith(".tsx") || path?.endsWith(".jsx"),
          ),
        );
      } catch (error) {
        console.error("Failed in getTree", error);
      }
    };
    updateTree();
  }, [selectedRepo]);

  useEffect(() => {
    // Listening for an image snapshot
    on<SnapshotImageHandler>("SNAPSHOT_IMAGE", ({ imageBase64 }) => {
      setImageBase64(imageBase64);
      setErrorMessage("");
    });

    // Listening for an error message
    on<SnapshotErrorHandler>("SNAPSHOT_ERROR", ({ message }) => {
      setErrorMessage(message);
      setImageBase64(undefined); // Clear any existing image
    });

    on<UpdateAccessTokenAndReposHandler>(
      "UPDATE_ACCESS_TOKEN_AND_REPOS",
      ({ accessToken, repos }) => {
        setAccessToken(accessToken);
        setRepos(repos);
      },
    );

    on<CreateOrEditResultHandler>(
      "CREATE_OR_EDIT_RESULT",
      ({ success, error }) => {
        setCreatingIssue(false);
        if (success) {
          emit<NotifyHandler>("NOTIFY", "Successfully created GitHub issue");
          emit<ClosePluginHandler>("CLOSE_PLUGIN");
        }
        if (error) {
          emit<NotifyHandler>("NOTIFY", "Error: Failed to create GitHub issue");
          console.error("Failed to create issue", error);
          // The issue was likely related to GitHub auth - show the github auth page again
          emit<ReauthGithubHandler>("REAUTH_GITHUB");
        }
      },
    );
    emit<UIHandlersRegisteredHandler>("UI_HANDLERS_REGISTERED", true);
  }, []);

  const onRepoChange = (fullName: string) => {
    setSelectedRepo(repos?.find((repo) => repo.full_name === fullName));
  };

  const onFileChange = (path: string) => {
    setNewFilename("");
    setSelectedFile(tree?.find((treeFile) => treeFile.path === path));
  };

  const onNewFilenameChange = (value: string) => {
    setSelectedFile(undefined);
    setNewFilename(value);
  };

  const onWriteCode = async () => {
    const fileName = selectedFile?.path ?? newFilename.trim();
    if (!selectedRepo || !fileName) return;

    setCreatingIssue(true);

    const emitData = {
      selectedRepo,
      fileName,
      additionalInstructions,
      fileType: selectedFile ? undefined : fileType,
    };

    if (selectedFile) {
      emit<EditExistingFileHandler>("EDIT_EXISTING_FILE", {
        ...emitData,
        fileType: undefined,
      });
    } else {
      emit<CreateNewFileHandler>("CREATE_NEW_FILE", { ...emitData, fileType });
    }
  };

  if (!repos) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-blue-100 ">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin ease-linear rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
          <div className="animate-pulse text-2xl font-semibold text-purple-800 text-center">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-4">
      <Section
        label="Please choose a repo:"
        linkLabel="(Install JACoB)"
        href="https://github.com/apps/jacob-ai-bot/installations/select_target"
      >
        <Dropdown
          placeholder="Select a repo where JACoB is installed"
          disabled={creatingIssue}
          value={selectedRepo?.full_name ?? null}
          options={(repos ?? []).map((repo) => ({
            value: repo.full_name,
          }))}
          onValueChange={onRepoChange}
        />
      </Section>
      <Section label="Name:">
        <div>
          <SegmentedControl
            options={[
              {
                value: NewOrEditMode.CreateNewFile,
              },
              {
                value: NewOrEditMode.UpdateExistingFile,
              },
            ]}
            disabled={creatingIssue || !selectedRepo}
            value={mode}
            onValueChange={(value) => setMode(value as NewOrEditMode)}
          />
        </div>
        {mode === NewOrEditMode.CreateNewFile ? (
          <div>
            <Textbox
              placeholder="Enter a name for the component or page"
              disabled={creatingIssue || !selectedRepo}
              value={newFilename}
              onValueInput={onNewFilenameChange}
            />
            {newFilename && (
              <div className="mt-2">
                <Text className="my-2">
                  <Bold>Choose a Type:</Bold>
                </Text>
                <SegmentedControl
                  value={fileType}
                  disabled={creatingIssue || !selectedRepo}
                  options={Object.values(FileType).map((value) => ({ value }))}
                  onValueChange={(value) => setFileType(value as FileType)}
                />
              </div>
            )}
          </div>
        ) : (
          <Dropdown
            placeholder="Select a file"
            disabled={creatingIssue || !tree}
            value={selectedFile?.path ?? null}
            options={(tree ?? []).map((treeFile) => ({
              value: treeFile.path ?? "",
            }))}
            onValueChange={onFileChange}
          />
        )}
      </Section>
      <Section label="If you want, add additional instructions here:">
        <TextboxMultiline
          placeholder="Enter additional instructions"
          disabled={creatingIssue || !selectedRepo}
          grow
          rows={1}
          value={additionalInstructions}
          onValueInput={setAdditionalInstructions}
        />
      </Section>
      <Section label="Preview:" isCollapsable={true}>
        {errorMessage && <div className="error">{errorMessage}</div>}
        {imageBase64 && (
          <img
            src={imageBase64}
            alt="Snapshot of the selected node"
            style={{ objectFit: "contain", maxHeight: "150px" }}
          />
        )}
        {!imageBase64 && !errorMessage && <div>Please select a node.</div>}
      </Section>
      <div className="p-4">
        <Button
          disabled={
            creatingIssue ||
            !selectedRepo ||
            !imageBase64 ||
            (!selectedFile && !newFilename.trim())
          }
          loading={creatingIssue}
          fullWidth
          onClick={onWriteCode}
        >
          Start writing code
        </Button>
        {creatingIssue && (
          <p className="mt-4 text-center text-gray-500">
            Creating issue, this will take about 30 seconds...
          </p>
        )}
      </div>
    </div>
  );
}

export default render(Plugin);
