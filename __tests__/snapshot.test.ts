import { convertToBase64 } from "../src/utils/imageSnapshot";
import fs from "fs";
import path from "path";
import { vi } from "vitest";
import { uploadSnapshot } from "../src/api";

const figmaMock = {
  ui: {
    postMessage: vi.fn(),
  },
  clientStorage: {
    getAsync: vi.fn().mockResolvedValue("mock-access-token"), // Mock implementation
  },
};

// @ts-expect-error - We're adding a mock to the global scope
global.figma = figmaMock; // Assign the mock to the global scope

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
    const { data, errors } = await uploadSnapshot(imageBase64);
    expect(data).toBeDefined();
    expect(errors).toBeUndefined();

    // it should return a signed url
    expect(data?.success).toBe(true);
    expect(data?.url).toBeDefined();
    // the url should be in the format of an s3 signed url
    expect(data?.url?.startsWith("https://")).toBe(true);
  });
});
