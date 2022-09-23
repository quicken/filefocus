import * as vscode from "vscode";
import { GroupManager } from "./GroupManager";
import { Group } from "./Group";

export class GroupFacade {
  constructor(private groupManager: GroupManager) {}

  async addGroup(): Promise<void> {
    const groupName = await vscode.window.showInputBox({
      placeHolder: "Enter a name for the focus group",
    });

    if (!groupName || groupName.trim() === "") {
      return;
    }

    const groupId = GroupManager.makeGroupId(groupName);
    if (this.groupManager.root.has(groupId)) {
      await vscode.window.showErrorMessage(
        "A focus group with this name already exists."
      );
      return;
    }

    const group = new Group(groupId);
    group.name = groupName;
    this.groupManager.addGroup(group, "statestorage");
    vscode.commands.executeCommand("fileFocusTree.refreshEntry");
  }

  pinGroup(groupId: string): void {
    this.groupManager.pinnedGroupId =
      this.groupManager.pinnedGroupId === groupId ? "" : groupId;
    vscode.commands.executeCommand("fileFocusTree.refreshEntry");
  }

  async removeGroup(groupId: string): Promise<void> {
    const action = await vscode.window.showInformationMessage(
      "Discard this focus group?",
      { modal: true },
      "Discard"
    );
    if (action === "Discard") {
      this.groupManager.removeGroup(groupId);
      vscode.commands.executeCommand("fileFocusTree.refreshEntry");
    }
  }

  async renameGroup(srcGroupId: string): Promise<void> {
    const group = this.groupManager.root.get(srcGroupId);
    if (group) {
      const groupName = await vscode.window.showInputBox({
        placeHolder: "Enter a name for the focus group",
        value: group.name,
      });

      if (
        !groupName ||
        groupName.trim() === group.name ||
        groupName.trim() === ""
      ) {
        return;
      }

      const destinationId = GroupManager.makeGroupId(groupName);
      if (this.groupManager.root.has(destinationId)) {
        await vscode.window.showErrorMessage(
          "A focus group with this name already exists."
        );
        return;
      }

      this.groupManager.renameGroup(srcGroupId, groupName);
      vscode.commands.executeCommand("fileFocusTree.refreshEntry");
    }
  }

  async addGroupResource(path: string): Promise<void> {
    /* If no writable focus group as been defined define a focus group. */

    if (this.groupManager.writableGroupNames.length === 0) {
      await vscode.window.showInformationMessage(
        "Please setup at least one focus group. Then retry adding this resource.",
        { modal: true }
      );
      vscode.commands.executeCommand("fileFocusExtension.addGroup");
      return;
    }

    let groupName;
    /* Skip showing the quick picker if there is only one focus group to choose. from. */
    if (this.groupManager.writableGroupNames.length === 1) {
      groupName = this.groupManager.writableGroupNames[0];
    } else if (
      this.groupManager.pinnedGroupId &&
      this.groupManager.root.has(this.groupManager.pinnedGroupId)
    ) {
      groupName = this.groupManager.root.get(
        this.groupManager.pinnedGroupId
      )?.name;
    } else {
      groupName = await vscode.window.showQuickPick(
        this.groupManager.writableGroupNames,
        {
          canPickMany: false,
          placeHolder: "Select the focus group for this resource.",
        }
      );
    }

    if (groupName) {
      const groupId = GroupManager.makeGroupId(groupName);
      if (this.groupManager.root.has(groupId)) {
        const group = this.groupManager.root.get(groupId);
        if (group && !group.readonly) {
          group.addResource(vscode.Uri.parse(path));
          this.groupManager.saveGroup(group);
          vscode.commands.executeCommand("fileFocusTree.refreshEntry");
        }
      }
    }
  }

  async removeGroupResource(groupId: string, uri: vscode.Uri): Promise<void> {
    const group = this.groupManager.root.get(groupId);
    if (group && !group.readonly) {
      group.removeResource(uri);
      this.groupManager.saveGroup(group);
      vscode.commands.executeCommand("fileFocusTree.refreshEntry");
    }
  }
}
