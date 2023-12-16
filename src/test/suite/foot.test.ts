import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
// import * as myExtension from '../../extension';
import { minimatch } from "minimatch";

suite("Foo Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Matching file in subfolder (node_modules)", () => {
    const file =
      "/Users/marcel/development/axcelerate/op-platform-api/node/service/imageserver/node_modules/.bin/acorn";
    const matches = minimatch(file, "**/node_modules/**", {
      dot: true,
    });
    assert.strictEqual(matches, true);
  });

  test("Matching Folder", () => {
    let file = "/Users/marcel/development/axcelerate/op-platform-api/.git/ff";
    let matches = minimatch(file, "**/.git{,/**/*}", { dot: true });
    assert.strictEqual(matches, true);

    file = "/Users/marcel/development/axcelerate/op-platform-api/.git";
    matches = minimatch(file, "**/.git{,/**/*}", { dot: true });
    assert.strictEqual(matches, true);

    file = "/Users/marcel/development/axcelerate/op-platform-api/git/ff";
    matches = minimatch(file, "**/.git{,/**/*}", { dot: true });
    assert.strictEqual(matches, false);

    file = "/Users/marcel/development/axcelerate/op-platform-api/git";
    matches = minimatch(file, "**/.git{,/**/*}", { dot: true });
    assert.strictEqual(matches, false);
  });
});
