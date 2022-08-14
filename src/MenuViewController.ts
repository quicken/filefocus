import * as vscode from "vscode";
import { FileFocus } from "./FileFocus";
import { Group } from "./Group";

export class MenuViewController {
  constructor(private fileFocus: FileFocus) {}

  async addGroup(): Promise<void> {
    const groupName = await vscode.window.showInputBox({
      placeHolder: "Enter a name for the focus group",
    });

    if (!groupName || groupName.trim() === "") {
      return;
    }

    const groupId = FileFocus.makeGroupId(groupName);
    if (this.fileFocus.root.has(groupId)) {
      await vscode.window.showErrorMessage(
        "A focus group with this name already exists."
      );
      return;
    }

    const group = new Group(groupId);
    group.name = groupName;
    this.fileFocus.addGroup(group);
    vscode.commands.executeCommand("fileFocusTree.refreshEntry");
  }

  async removeGroup(groupId: string): Promise<void> {
    const action = await vscode.window.showInformationMessage(
      "Discard this focus group?",
      { modal: true },
      "Discard"
    );
    if (action === "Discard") {
      this.fileFocus.removeGroup(groupId);
      vscode.commands.executeCommand("fileFocusTree.refreshEntry");
    }
  }

  async renameGroup(srcGroupId: string): Promise<void> {
    const group = this.fileFocus.root.get(srcGroupId);
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

      const destinationId = FileFocus.makeGroupId(groupName);
      if (this.fileFocus.root.has(destinationId)) {
        await vscode.window.showErrorMessage(
          "A focus group with this name already exists."
        );
        return;
      }

      this.fileFocus.renameGroup(srcGroupId, groupName);
      vscode.commands.executeCommand("fileFocusTree.refreshEntry");
    }
  }

  async addGroupResource(path: string): Promise<void> {
    /* If no focus group as been defined define a focus group. */
    if (this.fileFocus.root.size === 0) {
      await vscode.window.showInformationMessage(
        "Please setup at least one focus group. Then retry adding this resource.",
        { modal: true }
      );
      vscode.commands.executeCommand("fileFocusExtension.addGroup");
      return;
    }

    let groupName;
    /* Skip showing the quick picker if there is only one focus group to choose. from. */
    if (this.fileFocus.groupNames.length === 1) {
      groupName = this.fileFocus.groupNames[0];
    } else {
      groupName = await vscode.window.showQuickPick(this.fileFocus.groupNames, {
        canPickMany: false,
        placeHolder: "Select the focus group for this resource.",
      });
    }

    if (groupName) {
      const groupId = FileFocus.makeGroupId(groupName);
      if (this.fileFocus.root.has(groupId)) {
        const group = this.fileFocus.root.get(groupId);
        if (group) {
          group.addResource(vscode.Uri.parse(path));
          this.fileFocus.saveGroup(group);
          vscode.commands.executeCommand("fileFocusTree.refreshEntry");
        }
      }
    }
  }

  async removeGroupResource(groupId: string, uri: vscode.Uri): Promise<void> {
    const group = this.fileFocus.root.get(groupId);
    if (group) {
      group.removeResource(uri);
      this.fileFocus.saveGroup(group);
      vscode.commands.executeCommand("fileFocusTree.refreshEntry");
    }
  }
}
