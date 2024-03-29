import { convertToBase64 } from "../src/utils/images";
import { createIssuesForFigmaFile, uploadImage } from "../src/api";
import fs from "fs";
import path from "path";
import { vi } from "vitest";
import { IMAGE_TYPE } from "../src/types";

const mockedRepo = vi.hoisted(() => ({
  getRepos: vi.fn().mockImplementation(
    () =>
      new Promise((resolve) =>
        resolve([
          {
            name: "mock-repo",
            owner: "mock-owner",
            full_name: "mock-owner/mock-repo",
          },
        ]),
      ),
  ),
}));
vi.mock("../src/github", () => mockedRepo);

const mockedApi = vi.hoisted(() => ({
  uploadImage: vi.fn().mockImplementation(
    () =>
      new Promise((resolve) =>
        resolve({
          data: {
            success: true,
            url: "https://www.example.com/image.png",
          },
        }),
      ),
  ),
  createIssuesForFigmaFile: vi.fn().mockImplementation(
    () =>
      new Promise((resolve) =>
        resolve({
          data: {
            success: true,
          },
        }),
      ),
  ),
}));
vi.mock("../src/api", () => mockedApi);

const figmaMock = {
  ui: {
    postMessage: vi.fn(),
  },
  clientStorage: {
    getAsync: vi.fn().mockResolvedValue("mock-access-token"),
  },
};

// @ts-expect-error - We're adding a mock to the global scope
global.figma = figmaMock; // Assign the mock to the global scope
global.fetch = vi.fn().mockResolvedValue({
  json: () => Promise.resolve({ data: { success: true } }),
});

vi.mock("@create-figma-plugin/utilities", () => ({
  emit: vi.fn(),
}));

function findPngFiles(dir: string, pngFiles: string[] = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file) as string;
    if (fs.statSync(filePath).isDirectory()) {
      findPngFiles(filePath, pngFiles);
    } else if (path.extname(file) === ".png") {
      pngFiles.push(filePath);
    }
  });

  return pngFiles;
}

describe("snapshotSelectedNode", () => {
  const mockFolderPath = path.join(__dirname, "../__mocks__/test_samples");

  // find all the image files in the mock folder
  const imageFiles = findPngFiles(mockFolderPath);

  // get just the first file
  const file = imageFiles[0];

  it(`should correctly snapshot image files`, async () => {
    // open the file and read the image data
    const imageData = fs.readFileSync(file);

    // convert to base64
    const imageBase64 = convertToBase64(imageData);

    // Verify that the base64 string is valid
    expect(typeof imageBase64).toBe("string");
    expect(imageBase64.length).toBeGreaterThan(0);

    // it should be a png
    expect(imageBase64.startsWith("data:image/png;base64,")).toBe(true);

    // send the base64 string to the snapshot API
    const { data, errors } = await uploadImage(
      imageBase64,
      IMAGE_TYPE.PNG,
      true,
    );
    expect(data).toBeDefined();
    expect(errors).toBeUndefined();

    // it should return a signed url
    expect(data?.success).toBe(true);
    expect(data?.url).toBe("https://www.example.com/image.png");
  });
});

describe("createIssuesForFigmaFile", () => {
  it("should correctly create issues for a Figma file", async () => {
    const relativeNodes = {};

    const fileName = "test";
    const additionalInstructions = "test";
    const snapshotUrl = "https://www.example.com/image.png";
    const repo = await mockedRepo.getRepos("mock-access-token")[0];

    const { data, errors } = await createIssuesForFigmaFile(
      relativeNodes,
      repo,
      fileName,
      fileName,
      additionalInstructions,
      undefined,
      snapshotUrl,
    );

    expect(data).toBeDefined();
    expect(errors).toBeUndefined();

    // Verify that the function correctly handled the response
    expect(data?.success).toBe(true);
  });
});
