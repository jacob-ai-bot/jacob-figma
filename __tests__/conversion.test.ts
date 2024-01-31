import { getSimplifiedNode } from "../src/api";
import fs from "fs";
import path from "path";

function findJsonFiles(dir: string, jsonFiles: string[] = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file) as string;
    if (fs.statSync(filePath).isDirectory()) {
      findJsonFiles(filePath, jsonFiles);
    } else if (path.extname(file) === ".json") {
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
      for (const node of nodeArray) {
        const result = getSimplifiedNode(node);
        // the results has to be an object and not be empty
        expect(typeof result).toBe("object");
        expect(Object.keys(result || {}).length).toBeGreaterThan(0);
        // it must have an id key
        expect(result?.id).toBeDefined();
        expect(result?.name).toBeDefined();
      }
    });
  });
});
