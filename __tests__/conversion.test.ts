import { getSimplifiedNode } from "../src/api";
import fs from "fs";
import path from "path";
import { getDescriptionOfNode } from "../src/utils/nodes";

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

        // write the result to a file. It should be in the same folder as the input file.
        // The folder is the name of the file without the extension (with the base folder being mockFolderPath)
        // The name of the new file is simplified_<original_file_name>.json
        const folder = path.basename(file, path.extname(file));
        const outputFolder = path.join(mockFolderPath, folder);
        const outputFile = path.join(
          outputFolder,
          `simplified_${path.basename(file)}`,
        );

        if (!fs.existsSync(outputFolder)) {
          fs.mkdirSync(outputFolder);
        }
        fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
      }
    });
  });
});

describe("getGithubIssues", () => {
  it("should generate node descriptions from simplified nodes", async () => {
    const mockFolderPath = path.join(__dirname, "../__mocks__/test_samples");
    const jsonFiles = findJsonFiles(mockFolderPath, [], true);

    for (const file of jsonFiles) {
      const nodeStr = fs.readFileSync(file, "utf8");
      const node = JSON.parse(nodeStr);
      // first get the description of the node
      const nodeDescription = getDescriptionOfNode(node);
      expect(nodeDescription).toBeDefined();
      expect(nodeDescription).not.toBeNull();
      expect(typeof nodeDescription).toBe("string");
      expect(nodeDescription.length).toBeGreaterThan(0);
    }
  });

  // it("should generate github issues from simplified nodes", async () => {
  //   const mockFolderPath = path.join(__dirname, "../__mocks__/test_samples");
  //   const jsonFiles = findJsonFiles(mockFolderPath, [], true);

  //   for (const file of jsonFiles) {
  //     const nodeStr = fs.readFileSync(file, "utf8");
  //     const node = JSON.parse(nodeStr);
  //     // first get the description of the node
  //     const nodeDescription = getDescriptionOfNode(node);
  //     expect(nodeDescription).toBeDefined();
  //   }
  // });
});
