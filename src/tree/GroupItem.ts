import * as vscode from "vscode";

export class GroupItem extends vscode.TreeItem {
  objtype = "GroupItem";

  constructor(
    public readonly label: string,
    public readonly groupId: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly isFavourite: boolean
  ) {
    super(label, collapsibleState);
    this.contextValue = "GroupItem";
    this.label = this.isFavourite ? `⭐${this.label}` : this.label;
  }
}
