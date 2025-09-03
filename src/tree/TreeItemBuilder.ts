import * as vscode from "vscode";
import { Utils } from "vscode-uri";
import { Group } from "../Group";
import { FocusItem } from "../tree/FocusItem";
import { GroupItem } from "../tree/GroupItem";

/**
 * The TreeItemBuilder class is helper class used by the FileFocusTreeProvider.
 *
 * Specifically, this class implement methods specifically related to
 * rendering file focus data with the vscode TreeView component.
 *
 * However, the class does not implement interfaces specified by vscode for working
 * with the TreeView, those implementation are inside the FileFocusTreeProvider class.
 *
 */
export class TreeItemBuilder {
  /**
   * Converts the resources inside a Group into FocusItems (TreeViewItems) in the order
   * in which they should be rendered inside of an expanded TreeView node.
   * @param group The resource group which should be converted to FocusItems.
   * @param sortkey How the items should be sorted (order in which items should be rendered) path:sorted by the full path,
   * basename: only sort based on the file/folder name. This way all items with the same name will be sorted together regardless
   * of location.
   * @returns A sorted list of FocusItems (TreeViewItems) that can be rendered by a vscode TreeView.
   */
  public async getResourceForGroup(
    group: Group,
    sortkey: "path" | "basename"
  ): Promise<FocusItem[]> {
    const out: FocusItem[] = [];
    const resources = group.resources;
    if (resources) {
      switch (sortkey) {
        case "path":
          resources.sort((a, b) => a.path.localeCompare(b.path));
          break;
        case "basename":
        default:
          resources.sort((a, b) =>
            Utils.basename(a).localeCompare(Utils.basename(b))
          );
          break;
      }

      for (const uri of resources) {
        // Skip invalid or null URIs
        if (!uri) {
          continue;
        }
        
        const fileType = await this.getResourceType(uri);
        const basename = Utils.basename(uri);
        
        // Ensure basename is a string
        const safeBasename = typeof basename === 'string' ? basename : String(basename || 'Unknown');
        
        switch (fileType) {
          case vscode.FileType.File:
            out.push(
              this.createFileItem(
                safeBasename,
                uri,
                true,
                group.id,
                group.readonly
              )
            );
            break;

          case vscode.FileType.Directory:
            out.push(
              this.createFolderItem(
                safeBasename,
                uri,
                true,
                group.id,
                group.readonly
              )
            );
            break;
          case vscode.FileType.Unknown:
            out.push(
              this.createUnknownItem(
                safeBasename,
                uri,
                true,
                group.id,
                group.readonly
              )
            );
            break;
        }
      }
    }

    return out;
  }

  /**
   * Create new TreeViewItem for representing a Folder inside a vscode TreeView.
   *
   * Note: In FileFocus a folder is an actual resources like a directory while a Group is a logical (virtual)
   * folder for arbitraily organising actual resources.
   *
   * @param label The label rendered for the Item in the tree view.
   * @param uri The URI the item points to.
   * @param isRootItem True if this item is directly in the root of a Group.
   * @param groupId The id of the Group that this item is owned by.
   * @param isReadOnly The item should be readonly.
   * @returns A TreeViewItem that represent a Folder.
   */
  public createFolderItem(
    label: string,
    uri: vscode.Uri,
    isRootItem: boolean,
    groupId: string,
    isReadOnly: boolean
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
    folderItem.iconPath = vscode.ThemeIcon.Folder;
    folderItem.contextValue = isRootItem ? "FocusFolderRoot" : "FocusFolder";
    folderItem.contextValue = isReadOnly
      ? folderItem.contextValue
      : folderItem.contextValue + "Write";
    return folderItem;
  }

  /**
   * Returns TreeViewItem for rendering multiple FileFocus Groups inside a vscode TreeView.
   *
   * In other words this method renders the ROOT of the FileFocus TreeView.
   *
   * Note: In FileFocus a folder is an actual resources like a directory while a Group is a logical (virtual)
   * folder for arbitraily organising actual resources.
   *
   * @param groups The set of groups that should be rendered.
   * @param pinnedGroupId The ID of the group that should be rendered as pinned.
   * @returns An array of TreeViewItem that represent all groups to render in a TreeView.
   */
  public async getGroupItem(
    groups: Map<string, Group>,
    pinnedGroupId: string
  ): Promise<GroupItem[]> {
    const out: GroupItem[] = [];
    for (const [, group] of groups) {
      out.push(this.createGroupItem(group, pinnedGroupId));
    }

    out.sort((a, b) => a.label.localeCompare(b.label));

    return out;
  }

  /**
   * Create new TreeViewItem for representing an unknown/missing resource inside a vscode TreeView.
   *
   * An unkown item is typically a resource that can not be located inside a workspace. This can happen
   * when syncing FileFocus settings between computers where the source code between the two machines
   * is different such as being on a different code branch.
   *
   * @param label The label rendered for the Item in the tree view.
   * @param uri The URI the item points to.
   * @param isRootItem True if this item is directly in the root of a Group.
   * @param groupId The id of the Group that this item is owned by.
   * @param isReadOnly The item should be readonly.
   * @returns A TreeViewItem that represent a unknown/missing resource.
   */
  public createUnknownItem(
    label: string,
    uri: vscode.Uri,
    isRootItem: boolean,
    groupId: string,
    isReadOnly: boolean
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
    fileItem.contextValue = isRootItem ? "FocusItemRoot" : "FocusItem";
    fileItem.contextValue = isReadOnly
      ? fileItem.contextValue
      : fileItem.contextValue + "Write";
    return fileItem;
  }

  private createGroupItem(group: Group, pinnedGroupId: string) {
    const isFavourite = group.id === pinnedGroupId;
    // Ensure the name is always a string to prevent [object Object] display
    const groupName = typeof group.name === 'string' ? group.name : String(group.name || '');
    const groupItem = new GroupItem(
      groupName,
      group.id,
      vscode.TreeItemCollapsibleState.Collapsed,
      isFavourite,
      group.readonly
    );

    return groupItem;
  }

  /**
   * Create new TreeViewItem for representing a Group inside a vscode TreeView.
   * This is the public version that can be used to create individual group items.
   *
   * @param group The group to create an item for.
   * @param isPinned Whether this group is currently pinned.
   * @returns A TreeViewItem that represents a group.
   */
  public createGroupItemPublic(group: Group, isPinned: boolean) {
    // Ensure the name is always a string to prevent [object Object] display
    const groupName = typeof group.name === 'string' ? group.name : String(group.name || '');
    const groupItem = new GroupItem(
      groupName,
      group.id,
      vscode.TreeItemCollapsibleState.Collapsed,
      isPinned,
      group.readonly
    );

    return groupItem;
  }

  /**
   * Create new TreeViewItem for representing a file inside a vscode TreeView.
   *
   * @param label The label rendered for the Item in the tree view.
   * @param uri The URI the item points to.
   * @param isRootItem True if this item is directly in the root of a Group.
   * @param groupId The id of the Group that this item is owned by.
   * @param isReadOnly The item should be readonly.
   * @returns A TreeViewItem that represent a unknown/missing resource.
   */
  public createFileItem(
    label: string,
    uri: vscode.Uri,
    isRootItem: boolean,
    groupId: string,
    isReadOnly: boolean
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
    fileItem.contextValue = isRootItem ? "FocusFileRoot" : "FocusFile";
    fileItem.contextValue = isReadOnly
      ? fileItem.contextValue
      : fileItem.contextValue + "Write";
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
