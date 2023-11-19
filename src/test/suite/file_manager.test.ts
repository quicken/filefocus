import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import { Uri } from "vscode";
import { FileManager } from "../../FileManager";

suite("File Manager Test Suite", () => {
  test("fileNameFromUri", () => {
    const uri = Uri.parse("file:///home/user/1_bad.txt");
    const filename = FileManager.fileNameFromUri(uri);
    assert.strictEqual(filename, "1_bad.txt");
  });

  test("renameFilenameInUri", () => {
    const uri = Uri.parse("file:///home/user/1_bad.txt");
    const newUri = FileManager.renameFilenameInUri(uri, "foo.json");
    assert.strictEqual(newUri.toString(), "file:///home/user/foo.json");
  });
});
