import * as vscode from "vscode";
import { FileFocus } from "./FileFocus";
import { Utils } from "vscode-uri";
import { Group } from "./Group";

export class FileFocusTreeProvider
  implements vscode.TreeDataProvider<FocusItem | GroupItem>
{
  constructor(private workspaceRoot: string, private fileFocus: FileFocus) {}

  getTreeItem(element: FocusItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: any): vscode.ProviderResult<FocusItem[] | GroupItem[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage("No FocusItem in empty workspace.");
      return Promise.resolve([]);
    }

    /* When element is defined the user has picked an element. */
    if (element && element.hasOwnProperty("objtype")) {
      if (element.objtype === "FocusItem") {
        const focusItem = element as FocusItem;
        switch (focusItem.type) {
          case vscode.FileType.Directory: {
            return this.getFolderContents(focusItem.groupId, focusItem.uri);
          }

          case vscode.FileType.File:
          case vscode.FileType.Unknown:
        }
      } else if (element.objtype === "GroupItem") {
        const groupItem = element as GroupItem;
        return this.getResourceForGroup(groupItem.groupId);
      }

      return Promise.resolve([]);
    } else {
      return this.getGroupItem();
    }
  }

  private async getResourceForGroup(groupId: string): Promise<FocusItem[]> {
    const out: FocusItem[] = [];
    const resources = this.fileFocus.root.get(groupId)?.resources;
    if (resources) {
      for (const uri of resources) {
        const fileStats = await vscode.workspace.fs.stat(uri);
        switch (fileStats.type) {
          case vscode.FileType.File:
            out.push(
              this.createFileItem(Utils.basename(uri), uri, true, groupId)
            );
            break;

          case vscode.FileType.Directory:
            out.push(
              this.createFolderItem(Utils.basename(uri), uri, true, groupId)
            );
        }
      }
    }

    return out;
  }

  private async getGroupItem(): Promise<GroupItem[]> {
    const out: GroupItem[] = [];
    for (const [id, group] of this.fileFocus.root) {
      out.push(this.createGroupItem(group));
    }

    return out;
  }

  private async getFolderContents(
    groupId: string,
    uri: vscode.Uri
  ): Promise<FocusItem[]> {
    const result = await vscode.workspace.fs.readDirectory(uri);

    const out: FocusItem[] = [];
    for (const item of result) {
      const resourceUri = vscode.Uri.joinPath(uri, item[0]);

      switch (item[1]) {
        case vscode.FileType.File:
          out.push(this.createFileItem(item[0], resourceUri, false, groupId));
          break;

        case vscode.FileType.Directory:
          out.push(this.createFolderItem(item[0], resourceUri, false, groupId));
          break;

        default:
      }
    }

    return out;
  }

  private createFileItem(
    label: string,
    uri: vscode.Uri,
    isRootItem: boolean,
    groupId: string
  ) {
    const fileItem = new FocusItem(
      label,
      vscode.FileType.File,
      uri,
      isRootItem,
      groupId,
      vscode.TreeItemCollapsibleState.None
    );
    fileItem.command = {
      command: "vscode.open",
      title: "Open File",
      arguments: [uri],
    };
    fileItem.resourceUri = uri;
    fileItem.iconPath = vscode.ThemeIcon.File;
    fileItem.contextValue = isRootItem ? "FocusRootItem" : "FocusItem";
    return fileItem;
  }

  private createFolderItem(
    label: string,
    uri: vscode.Uri,
    isRootItem: boolean,
    groupId: string
  ) {
    const folderItem = new FocusItem(
      label,
      vscode.FileType.Directory,
      uri,
      isRootItem,
      groupId,
      vscode.TreeItemCollapsibleState.Collapsed
    );
    folderItem.resourceUri = uri;
    folderItem.iconPath = vscode.ThemeIcon.File;
    folderItem.contextValue = isRootItem ? "FocusRootItem" : "FocusItem";
    return folderItem;
  }

  private createGroupItem(group: Group) {
    const groupItem = new GroupItem(
      group.name,
      group.id,
      vscode.TreeItemCollapsibleState.Collapsed
    );

    return groupItem;
  }

  private _onDidChangeTreeData: vscode.EventEmitter<
    FocusItem | undefined | null | void
  > = new vscode.EventEmitter<FocusItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    FocusItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  async refresh(): Promise<void> {
    this._onDidChangeTreeData.fire();
  }
}

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
    // this.tooltip = `${this.label}`;
    // this.description = "";
  }
}

export class GroupItem extends vscode.TreeItem {
  objtype = "GroupItem";
  constructor(
    public readonly label: string,
    public readonly groupId: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}`;
    this.contextValue = "GroupItem";
  }
}
