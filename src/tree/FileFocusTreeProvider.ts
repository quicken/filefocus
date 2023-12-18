import * as vscode from "vscode";
import { GroupManager } from "../GroupManager";
import { Group } from "../Group";
import { FocusUtil } from "../FocusUtil";
import { TreeItemBuilder } from "./TreeItemBuilder";
import { FocusItem } from "./FocusItem";
import { GroupItem } from "./GroupItem";
import { BinderItem } from "./BinderItem";

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
    /* Only allow dragging Root FocusItems for now.*/
    for (const item of source) {
      if (item.objtype !== "FocusItem") {
        return;
      } else {
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
    }

    treeDataTransfer.set(
      "application/vnd.code.tree.fileFocusTree",
      new vscode.DataTransferItem(source)
    );

    if (uriList) {
      treeDataTransfer.set(
        "text/uri-list",
        new vscode.DataTransferItem(FocusUtil.arrayToUriList(uriList))
      );
    }
  }

  public async handleDrop(
    target: FocusItem | undefined,
    sources: vscode.DataTransfer,
    token: vscode.CancellationToken
  ): Promise<void> {
    if (!target) {
      return;
    }

    const targetGroup = this.groupManager.root.get(target.groupId);
    if (!targetGroup) {
      return;
    }

    const fileFocusDropType = this.fileFocusDropType(sources);
    if (!fileFocusDropType) {
      return;
    }

    switch (fileFocusDropType) {
      case "application/vnd.code.tree.fileFocusTree": {
        const transferItem = sources.get(
          "application/vnd.code.tree.fileFocusTree"
        );
        if (transferItem) {
          this.handleDropFileFocusItem(
            transferItem.value as FocusItem[],
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

  private handleDropFileFocusItem(treeItems: FocusItem[], targetGroup: Group) {
    const dirtyGroups = new Set<string>();
    for (const sourceItem of treeItems) {
      const sourceGroup = this.groupManager.root.get(sourceItem.groupId);
      if (!sourceGroup || sourceGroup.id === targetGroup.id) {
        continue;
      }

      dirtyGroups.add(sourceGroup.id);

      sourceGroup.removeResource(sourceItem.uri);
      targetGroup.addResource(sourceItem.uri);
    }

    for (const groupId of dirtyGroups) {
      const group = this.groupManager.root.get(groupId);
      if (group) {
        this.groupManager.saveGroup(group);
      }
    }

    this.groupManager.saveGroup(targetGroup);
    this.refresh();
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

  getChildren(element?: any): vscode.ProviderResult<FocusItem[] | GroupItem[]> {
    /* When defined the user has picked an element. */
    if (element?.hasOwnProperty("objtype")) {
      if (element.objtype === "BinderItem") {
        const binderItem = element as BinderItem;
        if (!binderItem.resourceUri) {
          return [];
        }
        const resource = FocusUtil.uriToResource(binderItem.resourceUri);
        return [];
      }
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
          ? this.itemBuilder.getResourceForGroup(group, this.sortkey)
          : [];
      }
    } else {
      return this.itemBuilder.getGroupItem(
        this.groupManager.root,
        this.groupManager.pinnedGroupId
      );
    }
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
