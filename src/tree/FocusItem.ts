import * as vscode from "vscode";

/**
 * Represent a FileFocus folder or file resource that is rendered inside of a
 * vscode TreeViewComponent.
 *
 * Note: In FileFocus a folder is an actual resources like a directory while a Group is a logical (virtual)
 * folder for arbitraily organising actual resources.
 *
 */
export class FocusItem extends vscode.TreeItem {
  objtype = "FocusItem";
  /**
   *
   * @param label The label for the node that is rendered in the TreeView
   * @param type The vscode FileType of this resource. (Lets vscode decide what icon to render for a file based on vscodes rules/themes.)
   * @param uri The vscode.URI that this node should point to. Typically this is a location in the workspace.
   * @param isRootItem True if this item is directly in the root of a FileFocus Group.
   * @param groupId The ID of the group that contains this item.
   * @param collapsibleState See vscode.TreeItemCollapsibleState.
   */
  constructor(
    public readonly label: string,
    public readonly type: vscode.FileType,
    public readonly uri: vscode.Uri,
    public readonly isRootItem: boolean,
    public readonly groupId: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    // Ensure label is always a string to prevent [object Object] display
    const safeLabel = typeof label === 'string' ? label : String(label || 'Unknown');
    super(safeLabel, collapsibleState);
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
    return undefined; // Explicitly return undefined instead of implicit undefined
  }
}
