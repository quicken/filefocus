import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { Group } from "../../Group";

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Prevent adding duplicate resources.", () => {
    const group = new Group("test");
    group.addResource(vscode.Uri.parse("file:///usr/home"));
    group.addResource(vscode.Uri.parse("file:///usr/home"));
    assert.strictEqual(group.resources.length, 1);
  });
});
