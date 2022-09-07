import * as assert from "assert";
import * as simple from "simple-mock";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { FocusUtil } from "../../FocusUtil";
import { Resource } from "../../global";
import { Uri, WorkspaceFolder, workspace } from "vscode";

suite("Focus Util Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  /* ##################################### */
  /* arrayToUriList - Tests*/
  test("arrayToUriList - Create single entry text/uri-list.", () => {
    const uriList = FocusUtil.arrayToUriList(["file:///usr/home"]);
    assert.strictEqual(uriList, "file:///usr/home");
  });

  test("arrayToUriList - Create multi entry text/uri-list.", () => {
    const uriList = FocusUtil.arrayToUriList([
      "file:///usr/home",
      "file:///usr/home/foo",
    ]);
    assert.strictEqual(uriList, "file:///usr/home\r\nfile:///usr/home/foo");
  });

  /* ##################################### */
  /* uriListToArray - Tests*/
  test("uriListToArray - Create array from single entry text/uri-list.", () => {
    const uriArray = FocusUtil.uriListToArray("file:///usr/home");
    assert.deepEqual(uriArray, ["file:///usr/home"]);
  });

  test("uriListToArray - Create array from multi entry text/uri-list.", () => {
    const uriArray = FocusUtil.uriListToArray(
      "file:///usr/home\r\nfile:///usr/home/foo"
    );
    assert.deepEqual(uriArray, ["file:///usr/home", "file:///usr/home/foo"]);
  });

  /* ##################################### */
  /* resourceToUri - Tests*/
  test("resourceToUri - Resource without workspace in mono workspace", () => {
    const workspaceFolders: WorkspaceFolder[] = [
      { index: 0, name: "testing", uri: Uri.file("/home/vader/deathstar") },
    ];
    const uri = FocusUtil.resourceToUri(
      { workspace: "", path: "/todo/fixvent.txt" },
      workspaceFolders
    );

    assert.equal(uri?.toString(), ["file:///todo/fixvent.txt"]);
  });

  test("resourceToUri - Resource with wrong workspace name in mono workspace", () => {
    const workspaceFolders: WorkspaceFolder[] = [
      { index: 0, name: "testing", uri: Uri.file("/home/vader/deathstar") },
    ];
    const uri = FocusUtil.resourceToUri(
      { workspace: "production", path: "/todo/fixvent.txt" },
      workspaceFolders
    );

    assert.equal(uri?.toString(), [
      "file:///home/vader/deathstar/todo/fixvent.txt",
    ]);
  });

  test("resourceToUri - Resource in multi workspace", () => {
    const workspaceFolders: WorkspaceFolder[] = [
      { index: 0, name: "project", uri: Uri.file("/home/vader/clones") },
      { index: 1, name: "testing", uri: Uri.file("/home/vader/deathstar") },
    ];
    const uri = FocusUtil.resourceToUri(
      { workspace: "testing", path: "/todo/fixvent.txt" },
      workspaceFolders
    );

    assert.equal(uri?.toString(), [
      "file:///home/vader/deathstar/todo/fixvent.txt",
    ]);
  });

  test("resourceToUri - Resource in unknown multi workspace", () => {
    const workspaceFolders: WorkspaceFolder[] = [
      { index: 0, name: "project", uri: Uri.file("/home/vader/clones") },
      { index: 1, name: "testing", uri: Uri.file("/home/vader/deathstar") },
    ];
    const uri = FocusUtil.resourceToUri(
      { workspace: "hothbase", path: "/spy/deathstar_plan.txt" },
      workspaceFolders
    );

    assert.equal(uri?.toString(), undefined);
  });

  /* ##################################### */
  /* uriToResource - Tests*/
  test("uriToResource - matching workspace.", () => {
    simple.mock(workspace, "getWorkspaceFolder").returnWith({
      index: 0,
      name: "testing",
      uri: Uri.file("/home/vader/deathstar"),
    });
    simple.mock(workspace, "asRelativePath").returnWith("/todo/fixvent.txt");

    const uri = Uri.file("/home/vader/deathstar/todo/fixvent.txt");
    const resource = FocusUtil.uriToResource(uri);

    assert.deepEqual(resource, {
      workspace: "testing",
      path: "/todo/fixvent.txt",
    });

    simple.restore();
  });

  test("uriToResource - missing workspace.", () => {
    simple.mock(workspace, "getWorkspaceFolder").returnWith(undefined);

    const uri = Uri.file("/home/vader/deathstar/todo/fixvent.txt");
    const resource = FocusUtil.uriToResource(uri);

    assert.deepEqual(resource, {
      workspace: "",
      path: "file:///home/vader/deathstar/todo/fixvent.txt",
    });

    simple.restore();
  });

  /* ##################################### */
  /* getWorkspaceUriByName - Tests*/
  test("getWorkspaceUriByName - Matching Name", () => {
    const workspaceFolders: WorkspaceFolder[] = [
      { index: 0, name: "project", uri: Uri.file("/home/vader/clones") },
      { index: 1, name: "testing", uri: Uri.file("/home/vader/deathstar") },
    ];
    let uri = FocusUtil.getWorkspaceUriByName("testing", workspaceFolders);
    assert.equal(uri?.toString(), "file:///home/vader/deathstar");
    uri = FocusUtil.getWorkspaceUriByName("project", workspaceFolders);
    assert.equal(uri?.toString(), "file:///home/vader/clones");
  });

  test("getWorkspaceUriByName - Miss Matched Name", () => {
    const workspaceFolders: WorkspaceFolder[] = [
      { index: 0, name: "project", uri: Uri.file("/home/vader/clones") },
      { index: 1, name: "testing", uri: Uri.file("/home/vader/deathstar") },
    ];
    let uri = FocusUtil.getWorkspaceUriByName("hothbase", workspaceFolders);
    assert.equal(uri?.toString(), undefined);
  });
});
