import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { DynamicGroup } from "../../DynamicGroup";

suite("Dynamic Group Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("dynamicGoup - test init.", async () => {
    const filePath = "/path/to/some/file.txt";
    const group = new DynamicGroup("test", async () => [
      vscode.Uri.file(filePath),
    ]);
    await group.refresh();
    assert.strictEqual(group.resources.length, 1);
  });
});
