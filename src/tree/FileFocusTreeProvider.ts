import * as vscode from "vscode";
import { GroupManager } from "../GroupManager";
import { Group } from "../Group";
import { FocusUtil } from "../FocusUtil";
import { TreeItemBuilder } from "./TreeItemBuilder";
import { FocusItem } from "./FocusItem";
import { GroupItem } from "./GroupItem";

/**
 * Defines the mime type used to detect when a file
 * focus TreeViewItem has been dropped.
 */
type FileFocusDropType =
  | "application/vnd.code.tree.fileFocusTree"
  | "text/uri-list"
  | "";

/**
 * A file focus specifc event type. For working with dragging
 * and dropping FocusItems.
 */
type FileFocusEvent = FocusItem | undefined | null | void;

/**
 * FileFocusTreeProvider implement the functioinality required by the
 * vscode TreeView component to render and manipulate FileFocus data
 * using the concepts of a Tree based UI.
 *
 * Implements any functionality that is directly required by the
 * VSCode Tree View Component such as implementing Tree View interfaces.
 *
 * Any other functioiniality related to working with a Tree view that is
 * specifically related to FileFocus is manged by the TreeItemBuilder Class.
 **
 */
export class FileFocusTreeProvider
  implements
    vscode.TreeDataProvider<FocusItem | GroupItem>,
    vscode.TreeDragAndDropController<FocusItem | GroupItem>
{
  /**
   * Define how the items shown inside a filefocus group should be sorted (displayed)
   * path: Sort items based on the full file path
   * base: Sort only on the filename. This allows grouping the same
   * filename together even if they are in different folder.
   */
  sortkey: "path" | "basename" = "basename";
  dropMimeTypes = ["application/vnd.code.tree.fileFocusTree", "text/uri-list"];
  dragMimeTypes = ["text/uri-list"];
  itemBuilder: TreeItemBuilder;
  constructor(
    context: vscode.ExtensionContext,
    private groupManager: GroupManager
  ) {
    this.itemBuilder = new TreeItemBuilder();
    const view = vscode.window.createTreeView("fileFocusTree", {
      treeDataProvider: this,
      showCollapseAll: true,
      canSelectMany: true,
      dragAndDropController: this,
    });
    context.subscriptions.push(view);
  }

  public async handleDrag(
    source: (FocusItem | GroupItem)[],
    treeDataTransfer: vscode.DataTransfer,
    token: vscode.CancellationToken
  ): Promise<void> {
    const uriList: string[] = [];
    
    // Check if any source items are from readonly groups (can't be dragged)
    for (const item of source) {
      if (item.objtype === "GroupItem") {
        const groupItem = item as GroupItem;
        const group = this.groupManager.root.get(groupItem.groupId);
        if (group && group.readonly) {
          // Prevent dragging readonly groups (from .filefocus.json)
          vscode.window.showInformationMessage(
            `Cannot move "${group.name}" - groups from .filefocus.json are read-only and cannot be moved.`
          );
          return;
        }
      } else if (item.objtype === "FocusItem") {
        const focusItem = item as FocusItem;
        const group = this.groupManager.root.get(focusItem.groupId);
        if (group && group.readonly) {
          // Prevent dragging files/folders from readonly groups
          vscode.window.showInformationMessage(
            `Cannot move files from "${group.name}" - groups from .filefocus.json are read-only.`
          );
          return;
        }
      }
    }
    
    for (const item of source) {
      if (item.objtype === "FocusItem") {
        const focusItem = item as FocusItem;
        /*
        When working with a wsl remote only file dragged to focus group from the
        file explorer will have "vscode-remote:" as a host. Files added via any other
        means have a host of "file:". However, any file dragged to the editor with a host
        of file: can not be found. This piece of hackery makes sure that vscode can
        locate the file when dropping into the editor pane even when working inside WSL.
        */
        const externalUri = await vscode.env.asExternalUri(focusItem.uri);
        const uri = vscode.Uri.parse(externalUri.query);
        uriList.push(uri.toString());
      }
      // For GroupItems, we don't add to uriList since they're not file resources
    }

    treeDataTransfer.set(
      "application/vnd.code.tree.fileFocusTree",
      new vscode.DataTransferItem(source)
    );

    if (uriList.length > 0) {
      treeDataTransfer.set(
        "text/uri-list",
        new vscode.DataTransferItem(FocusUtil.arrayToUriList(uriList))
      );
    }
  }

  public async handleDrop(
    target: FocusItem | GroupItem | undefined,
    sources: vscode.DataTransfer,
    token: vscode.CancellationToken
  ): Promise<void> {
    const fileFocusDropType = this.fileFocusDropType(sources);
    if (!fileFocusDropType) {
      return;
    }

    // Handle dropping onto root level (when target is undefined)
    if (!target) {
      if (fileFocusDropType === "application/vnd.code.tree.fileFocusTree") {
        const transferItem = sources.get("application/vnd.code.tree.fileFocusTree");
        if (transferItem) {
          this.handleDropToRoot(transferItem.value as (FocusItem | GroupItem)[]);
        }
      }
      return;
    }

    // Determine the target group based on the target type
    let targetGroup: Group | undefined;
    if (target.objtype === "FocusItem") {
      targetGroup = this.groupManager.root.get(target.groupId);
    } else if (target.objtype === "GroupItem") {
      targetGroup = this.groupManager.root.get(target.groupId);
    }

    if (!targetGroup) {
      return;
    }

    // Prevent dropping into readonly groups (from .filefocus.json)
    if (targetGroup.readonly) {
      vscode.window.showInformationMessage(
        `Cannot drop items into "${targetGroup.name}" - groups from .filefocus.json are read-only.`
      );
      return;
    }

    switch (fileFocusDropType) {
      case "application/vnd.code.tree.fileFocusTree": {
        const transferItem = sources.get(
          "application/vnd.code.tree.fileFocusTree"
        );
        if (transferItem) {
          this.handleDropFileFocusItem(
            transferItem.value as (FocusItem | GroupItem)[],
            targetGroup
          );
        }
        break;
      }

      case "text/uri-list": {
        const transferItem = sources.get("text/uri-list");
        if (transferItem) {
          this.handleDropUriList(transferItem.value as string, targetGroup);
        }
        break;
      }

      default:
        return;
    }
  }

  /**
   * Handle dropping items onto the root level of the tree (when target is undefined).
   */
  private handleDropToRoot(treeItems: (FocusItem | GroupItem)[]) {
    const dirtyGroups = new Set<string>();
    
    for (const sourceItem of treeItems) {
      if (sourceItem.objtype === "GroupItem") {
        // Handle dropping groups to root level (move to root)
        const groupItem = sourceItem as GroupItem;
        const sourceGroup = this.groupManager.root.get(groupItem.groupId);
        
        if (!sourceGroup) {
          continue;
        }

        // If the group is already at root level, skip it
        if (sourceGroup.isRootGroup) {
          continue;
        }

        // Move the group to root level
        if (this.groupManager.moveGroup(sourceGroup.id, null)) {
          if (sourceGroup.parentGroup) {
            dirtyGroups.add(sourceGroup.parentGroup.id);
          }
          dirtyGroups.add(sourceGroup.id);
        }
      }
      // Note: We don't handle FocusItems dropped to root because they need a group to belong to
    }

    // Save all affected groups
    for (const groupId of dirtyGroups) {
      const group = this.groupManager.root.get(groupId);
      if (group) {
        this.groupManager.saveGroup(group);
      }
    }

    this.refresh();
  }

  private handleDropFileFocusItem(treeItems: (FocusItem | GroupItem)[], targetGroup: Group) {
    const dirtyGroups = new Set<string>();
    
    for (const sourceItem of treeItems) {
      if (sourceItem.objtype === "FocusItem") {
        // Handle dropping file/folder resources
        const focusItem = sourceItem as FocusItem;
        const sourceGroup = this.groupManager.root.get(focusItem.groupId);
        if (!sourceGroup || sourceGroup.id === targetGroup.id) {
          continue;
        }

        dirtyGroups.add(sourceGroup.id);
        sourceGroup.removeResource(focusItem.uri);
        targetGroup.addResource(focusItem.uri);
        
      } else if (sourceItem.objtype === "GroupItem") {
        // Handle dropping groups into other groups (nesting)
        const groupItem = sourceItem as GroupItem;
        const sourceGroup = this.groupManager.root.get(groupItem.groupId);
        
        if (!sourceGroup || sourceGroup.id === targetGroup.id) {
          continue;
        }

        // Prevent circular nesting (group can't be moved into its own child)
        if (this.wouldCreateCircularReference(sourceGroup, targetGroup)) {
          vscode.window.showErrorMessage(
            `Cannot move group "${sourceGroup.name}" into "${targetGroup.name}" - this would create a circular reference.`
          );
          continue;
        }

        // Move the group to be a child of the target group
        if (this.groupManager.moveGroup(sourceGroup.id, targetGroup.id)) {
          dirtyGroups.add(targetGroup.id);
          if (sourceGroup.parentGroup) {
            dirtyGroups.add(sourceGroup.parentGroup.id);
          }
        }
      }
    }

    // Save all affected groups
    for (const groupId of dirtyGroups) {
      const group = this.groupManager.root.get(groupId);
      if (group) {
        this.groupManager.saveGroup(group);
      }
    }

    this.groupManager.saveGroup(targetGroup);
    this.refresh();
  }

  /**
   * Check if moving sourceGroup into targetGroup would create a circular reference.
   */
  private wouldCreateCircularReference(sourceGroup: Group, targetGroup: Group): boolean {
    // A group cannot be moved into itself
    if (sourceGroup.id === targetGroup.id) {
      return true;
    }

    // A group cannot be moved into one of its own descendants
    const allDescendants = sourceGroup.getAllChildGroups();
    return allDescendants.some(descendant => descendant.id === targetGroup.id);
  }

  private handleDropUriList(uriList: string, targetGroup: Group) {
    const paths = FocusUtil.uriListToArray(uriList);
    for (const path of paths) {
      const uri = vscode.Uri.parse(path);
      targetGroup.addResource(uri);
    }
    this.groupManager.saveGroup(targetGroup);
    this.refresh();
  }

  private fileFocusDropType(sources: vscode.DataTransfer): FileFocusDropType {
    let transferItem = sources.get("application/vnd.code.tree.fileFocusTree");
    if (transferItem) {
      return "application/vnd.code.tree.fileFocusTree";
    }

    transferItem = sources.get("text/uri-list");
    if (transferItem) {
      return "text/uri-list";
    }

    return "";
  }

  getTreeItem(element: FocusItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: any): vscode.ProviderResult<(FocusItem | GroupItem)[]> {
    /* When defined the user has picked an element. */
    if (element?.hasOwnProperty("objtype")) {
      if (element.objtype === "FocusItem") {
        const focusItem = element as FocusItem;
        const group = this.groupManager.root.get(focusItem.groupId);
        const readonly = group ? group.readonly : false;
        switch (focusItem.type) {
          case vscode.FileType.Directory: {
            return this.getFolderContents(
              focusItem.groupId,
              focusItem.uri,
              readonly
            );
          }

          case vscode.FileType.File:
          case vscode.FileType.Unknown:
        }
      } else if (element.objtype === "GroupItem") {
        const groupItem = element as GroupItem;
        const group = this.groupManager.root.get(groupItem.groupId);
        return group
          ? this.getGroupContents(group, this.sortkey)
          : [];
      }
    } else {
      // Return root level groups only
      return this.itemBuilder.getGroupItem(
        this.groupManager.rootGroups,
        this.groupManager.pinnedGroupId
      );
    }
  }

  /**
   * Get the contents of a group, including both resources and child groups.
   */
  private async getGroupContents(group: Group, sortKey: "path" | "basename"): Promise<(FocusItem | GroupItem)[]> {
    const items: (FocusItem | GroupItem)[] = [];
    
    // Add child groups first
    for (const childGroup of group.childGroups) {
      const isPinned = childGroup.id === this.groupManager.pinnedGroupId;
      items.push(this.itemBuilder.createGroupItemPublic(childGroup, isPinned));
    }
    
    // Add file/folder resources
    const resourceItems = await this.itemBuilder.getResourceForGroup(group, sortKey);
    items.push(...resourceItems);
    
    return items;
  }

  private async getFolderContents(
    groupId: string,
    uri: vscode.Uri,
    isReadOnly: boolean
  ): Promise<FocusItem[]> {
    const result = await vscode.workspace.fs.readDirectory(uri);

    const out: FocusItem[] = [];
    for (const item of result) {
      const resourceUri = vscode.Uri.joinPath(uri, item[0]);

      switch (item[1]) {
        case vscode.FileType.File:
          out.push(
            this.itemBuilder.createFileItem(
              item[0],
              resourceUri,
              false,
              groupId,
              isReadOnly
            )
          );
          break;

        case vscode.FileType.Directory:
          out.push(
            this.itemBuilder.createFolderItem(
              item[0],
              resourceUri,
              false,
              groupId,
              isReadOnly
            )
          );
          break;

        default:
      }
    }

    return out;
  }

  private _onDidChangeTreeData: vscode.EventEmitter<FileFocusEvent> =
    new vscode.EventEmitter<FileFocusEvent>();
  readonly onDidChangeTreeData: vscode.Event<FileFocusEvent> =
    this._onDidChangeTreeData.event;

  async refresh(): Promise<void> {
    this._onDidChangeTreeData.fire();
  }
}
