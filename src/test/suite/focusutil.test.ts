import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { FocusUtil } from "../../FocusUtil";

suite("Focus Util Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Create single entry text/uri-list.", () => {
    const uriList = FocusUtil.arrayToUriList(["file:///usr/home"]);
    assert.strictEqual(uriList, "file:///usr/home");
  });

  test("Create multi entry text/uri-list.", () => {
    const uriList = FocusUtil.arrayToUriList([
      "file:///usr/home",
      "file:///usr/home/foo",
    ]);
    assert.strictEqual(uriList, "file:///usr/home\r\nfile:///usr/home/foo");
  });

  test("Create array from single entry text/uri-list.", () => {
    const uriArray = FocusUtil.uriListToArray("file:///usr/home");
    assert.deepEqual(uriArray, ["file:///usr/home"]);
  });

  test("Create array from multi entry text/uri-list.", () => {
    const uriArray = FocusUtil.uriListToArray(
      "file:///usr/home\r\nfile:///usr/home/foo"
    );
    assert.deepEqual(uriArray, ["file:///usr/home", "file:///usr/home/foo"]);
  });
});
