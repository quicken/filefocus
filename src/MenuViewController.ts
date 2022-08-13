import * as vscode from "vscode";
import { v5 as uuidv5 } from "uuid";
import { FileFocus } from "./FileFocus";
import { Group } from "./Group";

export class MenuViewController {
  private namespace = "cc51e20a-7c32-434c-971f-5b3ea332deaa";

  constructor(private fileFocus: FileFocus) {}

  async addGroup(): Promise<void> {
    const groupName = await vscode.window.showInputBox({});
    if (groupName) {
      const id = uuidv5(groupName, this.namespace);
      const group = new Group(id);
      group.name = groupName;
      this.fileFocus.addGroup(group);
    }
  }

  async removeGroup(): Promise<void> {
    const groupName = await vscode.window.showInputBox({});
    if (groupName) {
      const id = uuidv5(groupName, this.namespace);
      this.fileFocus.removeGroup(id);
    }
  }

  addGroupResource(path: string): void {
    const uri = vscode.Uri.parse(path);
    const groupId = uuidv5("testing", this.namespace);

    const group = this.fileFocus.root.get(groupId);
    if (group) {
      group.addResource(uri);
      this.fileFocus.saveGroup(group);
    }
  }
}
