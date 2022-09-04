import * as vscode from "vscode";

export class FocusItem extends vscode.TreeItem {
  objtype = "FocusItem";
  constructor(
    public readonly label: string,
    public readonly type: vscode.FileType,
    public readonly uri: vscode.Uri,
    public readonly isRootItem: boolean,
    public readonly groupId: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = `${uri.fsPath}`;
    this.description = this.getResourceLocationHint(uri);
  }

  private getResourceLocationHint(uri: vscode.Uri) {
    if (this.isRootItem) {
      const parentFolders = uri.path
        .split("/")
        .slice(0, -1)
        .slice(-2)
        .join("/");
      return `[${parentFolders}]`;
    }
  }
}
