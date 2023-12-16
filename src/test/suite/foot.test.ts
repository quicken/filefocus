import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
// import * as myExtension from '../../extension';
import { minimatch } from "minimatch";

suite("Foo Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Matching Test", () => {
    const file =
      "/Users/marcel/development/axcelerate/op-platform-api/node/service/imageserver/node_modules/.bin/acorn";
    const matches = minimatch(file, "**/node_modules/**", { dot: true });
    assert.strictEqual(matches, true);
  });
});
