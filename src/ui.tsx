import {
  render,
  useWindowResize,
  Button,
  Textbox,
  Dropdown,
  TextboxMultiline,
  SegmentedControl,
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
      }
    },
  );

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

  return (
    <div className="flex flex-col pb-4">
      <Section label="Please choose a repo:">
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
      <Section label="Please choose an existing file or component:">
        <Dropdown
          placeholder="Select a file"
          disabled={creatingIssue || !tree}
          value={selectedFile?.path ?? null}
          options={(tree ?? []).map((treeFile) => ({
            value: treeFile.path ?? "",
          }))}
          onValueChange={onFileChange}
        />
      </Section>
      <Section label="Or create a new file:">
        <Textbox
          placeholder="Enter a filename"
          disabled={creatingIssue || !selectedRepo}
          value={newFilename}
          onValueInput={onNewFilenameChange}
        />
        {newFilename && (
          <div className="inline-flex">
            <SegmentedControl
              value={fileType}
              disabled={creatingIssue || !selectedRepo}
              options={Object.values(FileType).map((value) => ({ value }))}
              onValueChange={(value) => setFileType(value as FileType)}
            />
          </div>
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
      <div className="p-4">
        <Button
          disabled={!selectedRepo || (!selectedFile && !newFilename.trim())}
          loading={creatingIssue}
          fullWidth
          onClick={onWriteCode}
        >
          Start writing code
        </Button>
      </div>
    </div>
  );
}

export default render(Plugin);
