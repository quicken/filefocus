import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { FileFacade } from "../../FileFacade";

/**
 * A helper function that simulates reading the contents of folders
 * of a contrieved file system.
 * @param base The folder which should be read.
 * @returns The contents of the folder.
 */
const readVirtualDirectory = (base: vscode.Uri) => {
  let directory: [string, vscode.FileType][] = [];
  switch (base.path) {
    case "/test":
      directory = [
        [".git", vscode.FileType.Directory],
        [".github", vscode.FileType.Directory],
        [".gitignore", vscode.FileType.File],
        ["README.md", vscode.FileType.File],
        ["src", vscode.FileType.Directory],
        ["package.json", vscode.FileType.File],
        ["package-lock.json", vscode.FileType.File],
      ];
      break;

    case "/test/.git":
      directory = [
        ["HEAD", vscode.FileType.File],
        ["config", vscode.FileType.File],
        ["objects", vscode.FileType.Directory],
        ["packed-refs", vscode.FileType.File],
      ];
      break;

    case "/test/.git/objects":
      directory = [
        ["00", vscode.FileType.Directory],
        ["0d", vscode.FileType.Directory],
      ];
      break;

    case "/test/.git/objects/0d":
      directory = [
        ["f580be29979de4e1d7cc91bf52274fca194e86", vscode.FileType.File],
      ];
      break;

    case "/test/src":
      directory = [
        ["global.ts", vscode.FileType.File],
        ["Funk.ts", vscode.FileType.File],
        ["lib", vscode.FileType.Directory],
        ["Bunch.ts", vscode.FileType.File],
        ["coolj.ts", vscode.FileType.File],
        ["coolj.d.ts", vscode.FileType.File],
      ];
      break;

    case "/test/src/lib":
      directory = [
        ["util.ts", vscode.FileType.File],
        ["math.ts", vscode.FileType.File],
        ["storage", vscode.FileType.Directory],
        ["sql.ts", vscode.FileType.File],
        ["fetch.sql", vscode.FileType.File],
      ];
      break;

    default:
      break;
  }

  return Promise.resolve(directory);
};

suite("File Facade Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("search (recursive all files inside src including the src folder.)", async () => {
    const file = await FileFacade.search(
      vscode.Uri.parse("/test"),
      ["**/src{,/**/*}"],
      undefined,
      undefined,
      readVirtualDirectory
    );

    assert.strictEqual(file.length, 12);
  });

  test("search (recursive all files inside src folder.)", async () => {
    const file = await FileFacade.search(
      vscode.Uri.parse("/test"),
      ["**/src/**"],
      undefined,
      undefined,
      readVirtualDirectory
    );

    assert.strictEqual(file.length, 11);
  });

  test("search (recursive all files inside src folder. Not greedy.)", async () => {
    const file = await FileFacade.search(
      vscode.Uri.parse("/test"),
      ["**/src/**"],
      undefined,
      { greedy: false },
      readVirtualDirectory
    );

    assert.strictEqual(file.length, 6);
  });

  test("search (all ts files no traversal.)", async () => {
    const file = await FileFacade.search(
      vscode.Uri.parse("/test/src"),
      ["**/*.ts"],
      undefined,
      { recurse: false },
      readVirtualDirectory
    );

    assert.strictEqual(file.length, 5);
  });

  test("search (all ts files traversal.)", async () => {
    const file = await FileFacade.search(
      vscode.Uri.parse("/test/src"),
      ["**/*.ts"],
      undefined,
      { recurse: true },
      readVirtualDirectory
    );

    assert.strictEqual(file.length, 8);
  });

  test("search (all ts files traversal. exclude sql.ts)", async () => {
    const file = await FileFacade.search(
      vscode.Uri.parse("/test/src"),
      ["**/*.ts"],
      ["**/sql.ts"],
      { recurse: true },
      readVirtualDirectory
    );

    assert.strictEqual(file.length, 7);
  });
});
