import * as vscode from "vscode";

export class GroupItem extends vscode.TreeItem {
  objtype = "GroupItem";

  constructor(
    public readonly label: string,
    public readonly groupId: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly isFavourite: boolean,
    public readonly isReadOnly: boolean
  ) {
    super(label, collapsibleState);
    this.contextValue = isReadOnly ? "GroupItemReadOnly" : "GroupItem";
    this.label = this.isFavourite
      ? `⭐ ${this.label}`
      : this.isReadOnly
      ? `🔹 ${this.label}`
      : this.label;
  }
}
