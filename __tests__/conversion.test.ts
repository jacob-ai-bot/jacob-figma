import { getSimplifiedNode } from "../src/api";
import fs from "fs";
import path from "path";
import { getDescriptionOfNode } from "../src/utils/nodes";
import { getImagesFromNodes } from "../src/utils/images";
import { vi } from "vitest";

const figmaMock = {
  ui: {
    postMessage: vi.fn(),
  },
  clientStorage: {
    getAsync: vi.fn().mockResolvedValue("mock-access-token"),
  },
  getImageByHash: vi.fn().mockReturnValue({
    getBytesAsync: vi.fn().mockResolvedValue(new Uint8Array()),
  }),
};

// @ts-expect-error - We're adding a mock to the global scope
global.figma = figmaMock; // Assign the mock to the global scope
global.fetch = vi.fn().mockResolvedValue({
  json: () => Promise.resolve({ data: { success: true } }),
});

vi.mock("@create-figma-plugin/utilities", () => ({
  emit: vi.fn(),
}));

function findJsonFiles(
  dir: string,
  jsonFiles: string[] = [],
  findSimplified = false,
) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file) as string;
    if (fs.statSync(filePath).isDirectory()) {
      findJsonFiles(filePath, jsonFiles, findSimplified);
    } else if (
      path.extname(file) === ".json" &&
      (findSimplified
        ? file.startsWith("simplified_")
        : !file.startsWith("simplified_"))
    ) {
      jsonFiles.push(filePath);
    }
  });

  return jsonFiles;
}

describe("getSimplifiedNode", () => {
  const mockFolderPath = path.join(__dirname, "../__mocks__/test_samples");

  it("should handle undefined node", () => {
    expect(getSimplifiedNode(undefined)).toBeUndefined();
  });

  // find all the json files in the mock folder
  const jsonFiles = findJsonFiles(mockFolderPath);

  jsonFiles.forEach((file) => {
    it(`should correctly process mock Figma nodes (in json files)`, () => {
      // open the file and parse the json
      const nodeStr = fs.readFileSync(file, "utf8");

      let nodeArray = [];
      try {
        nodeArray = JSON.parse(nodeStr);
      } catch (error) {
        throw new Error(`Error parsing json file: ${file}`);
      }

      // there should only be one node in the array
      for (const node of nodeArray) {
        const result = getSimplifiedNode(node);
        expect(typeof result).toBe("object");
        expect(Object.keys(result || {}).length).toBeGreaterThan(0);
        expect(result?.id).toBeDefined();
        expect(result?.name).toBeDefined();
      }
    });
  });
});

describe("getDescriptionsFromSimplifiedNodes", () => {
  it("should generate node descriptions from simplified nodes", async () => {
    const mockFolderPath = path.join(__dirname, "../__mocks__/test_samples");
    const jsonFiles = findJsonFiles(mockFolderPath, [], true);

    for (const file of jsonFiles) {
      const nodeStr = fs.readFileSync(file, "utf8");
      const node = JSON.parse(nodeStr);

      const nodeDescriptionTailwind = getDescriptionOfNode(node, true);
      expect(nodeDescriptionTailwind).toBeDefined();
      expect(nodeDescriptionTailwind).not.toBeNull();
      expect(typeof nodeDescriptionTailwind).toBe("string");
      expect(nodeDescriptionTailwind.length).toBeGreaterThan(0);

      const nodeDescriptionCSS = getDescriptionOfNode(node, false);
      expect(nodeDescriptionCSS).toBeDefined();
      expect(nodeDescriptionCSS).not.toBeNull();
      expect(typeof nodeDescriptionCSS).toBe("string");
      expect(nodeDescriptionCSS.length).toBeGreaterThan(0);
    }
  });
});

describe("getImagesFromSimplifiedNodes", () => {
  it("should generate image urls from simplified nodes", async () => {
    const mockFolderPath = path.join(__dirname, "../__mocks__/test_samples");
    const jsonFiles = findJsonFiles(mockFolderPath, [], true);

    for (const file of jsonFiles) {
      const nodeStr = fs.readFileSync(file, "utf8");
      const node = JSON.parse(nodeStr);
      // first get the description of the node
      const imageUrls = await getImagesFromNodes(node);
      expect(imageUrls).toBeDefined();
      expect(imageUrls).not.toBeNull();
      expect(Array.isArray(imageUrls)).toBe(true);
    }
  });
});
