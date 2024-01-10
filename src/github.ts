import { Endpoints } from "@octokit/types";

type GetUserInstallationsResponse =
  Endpoints["GET /user/installations"]["response"]["data"];
type GetUserInstallationReposResponse =
  Endpoints["GET /user/installations/{installation_id}/repositories"]["response"]["data"];
export type GitHubRepo = GetUserInstallationReposResponse["repositories"][0];
type GetTreeResponse =
  Endpoints["GET /repos/{owner}/{repo}/git/trees/{tree_sha}"]["response"]["data"];
export type GitTreeFile = GetTreeResponse["tree"][0];

export const getRepos = async (accessToken: string) => {
  // Fetch the user's repos
  const userInstallationsResponse = await fetch(
    "https://api.github.com/user/installations",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "Otto",
        "Content-Type": "application/json",
      },
    },
  );

  if (userInstallationsResponse.ok) {
    const { installations } =
      (await userInstallationsResponse.json()) as GetUserInstallationsResponse;

    const repoLists = await Promise.all(
      installations.map(async (installation) => {
        const reposResponse = await fetch(
          `https://api.github.com/user/installations/${installation.id}/repositories`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "User-Agent": "Otto",
              "Content-Type": "application/json",
            },
          },
        );
        if (reposResponse.ok) {
          const { repositories } =
            (await reposResponse.json()) as GetUserInstallationReposResponse;
          return repositories;
        } else {
          throw new Error(
            `Failed to fetch user repos: ${reposResponse.status} ${reposResponse.statusText}`,
          );
        }
      }),
    );

    return repoLists.flat();
  } else {
    throw new Error(
      `Failed to fetch user installations: ${userInstallationsResponse.status} ${userInstallationsResponse.statusText}`,
    );
  }
};

export const getTree = async (
  accessToken: string,
  owner: string,
  repo: string,
  tree_sha: string,
) => {
  // Fetch the tree
  const treeResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${tree_sha}?recursive=1`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "Otto",
        "Content-Type": "application/json",
      },
    },
  );

  if (treeResponse.ok) {
    return (await treeResponse.json()) as GetTreeResponse;
  } else {
    throw new Error(
      `Failed to fetch repo tree: ${treeResponse.status} ${treeResponse.statusText}`,
    );
  }
};
