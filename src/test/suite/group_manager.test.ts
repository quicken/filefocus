import * as assert from "assert";
import * as simple from "simple-mock";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { GroupManager } from "../../GroupManager";
import { EphemeralStorage } from "../../storage/EphemeralStorage";
import { Group } from "../../Group";

suite("Group Manager Test Suite", () => {
  test("addGroup", () => {
    const groupManager = new GroupManager();
    const ephemeralStorage = new EphemeralStorage();
    groupManager.addStorageProvider(ephemeralStorage);

    const group = new Group(GroupManager.makeGroupId("Testing"));

    assert.strictEqual(groupManager.root.size, 0);

    groupManager.addGroup(group, ephemeralStorage.id);

    assert.strictEqual(groupManager.root.size, 1);
  });
});
