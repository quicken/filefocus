import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Foo Test", async () => {
    const foo = vscode.workspace
      .findFiles("**/*.ts", "node_modules", 10)
      .then((f) => {
        console.log(f);
      });
    console.log("cunt face.");
    console.log(foo);

    assert.strictEqual("slut", "slut");
  });
});
