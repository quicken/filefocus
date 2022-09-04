import * as vscode from "vscode";
import { Utils } from "vscode-uri";
import { Group } from "../Group";
import { FocusItem } from "../tree/FocusItem";
import { GroupItem } from "../tree/GroupItem";

export class TreeItemBuilder {
  constructor() {}

  public async getResourceForGroup(group: Group): Promise<FocusItem[]> {
    const out: FocusItem[] = [];
    const resources = group.resources;
    if (resources) {
      resources.sort((a, b) =>
        Utils.basename(a).localeCompare(Utils.basename(b))
      );

      for (const uri of resources) {
        const fileType = await this.getResourceType(uri);
        switch (fileType) {
          case vscode.FileType.File:
            out.push(
              this.createFileItem(Utils.basename(uri), uri, true, group.id)
            );
            break;

          case vscode.FileType.Directory:
            out.push(
              this.createFolderItem(Utils.basename(uri), uri, true, group.id)
            );
            break;
          case vscode.FileType.Unknown:
            out.push(
              this.createUnknownItem(Utils.basename(uri), uri, true, group.id)
            );
            break;
        }
      }
    }

    return out;
  }

  public createFolderItem(
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

  public async getGroupItem(
    groups: Map<string, Group>,
    pinnedGroupId: string
  ): Promise<GroupItem[]> {
    const out: GroupItem[] = [];
    for (const [id, group] of groups) {
      out.push(this.createGroupItem(group, pinnedGroupId));
    }

    out.sort((a, b) => a.label.localeCompare(b.label));

    return out;
  }

  public createUnknownItem(
    label: string,
    uri: vscode.Uri,
    isRootItem: boolean,
    groupId: string
  ) {
    const fileItem = new FocusItem(
      label,
      vscode.FileType.Unknown,
      uri,
      isRootItem,
      groupId,
      vscode.TreeItemCollapsibleState.None
    );
    fileItem.resourceUri = uri;
    fileItem.iconPath = new vscode.ThemeIcon("warning");
    fileItem.contextValue = isRootItem ? "FocusRootItem" : "FocusItem";
    return fileItem;
  }

  private createGroupItem(group: Group, pinnedGroupId: string) {
    const isFavourite = group.id === pinnedGroupId;
    const groupItem = new GroupItem(
      group.name,
      group.id,
      vscode.TreeItemCollapsibleState.Collapsed,
      isFavourite
    );

    return groupItem;
  }

  public createFileItem(
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

  private async getResourceType(uri: vscode.Uri) {
    try {
      return await (
        await vscode.workspace.fs.stat(uri)
      ).type;
    } catch (error) {
      return vscode.FileType.Unknown;
    }
  }
}
