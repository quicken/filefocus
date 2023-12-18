import * as vscode from "vscode";
import { FocusItem } from "./FocusItem";
import { Resource } from "../global";

/**
 * Represent a FileFocus Binder. A binder is a mechanism for displaying folders that have not been
 * specficially added to a group but contain the paths to file resouces that have been added to a group.
 *
 * Note: In FileFocus a folder is an actual resources like a directory while a Group is a logical (virtual)
 * folder for arbitraily organising actual resources.
 *
 */
export class BinderItem extends FocusItem {
  objtype = "BinderItem";
  constructor(
    type: vscode.FileType,
    label: string,
    uri: vscode.Uri,
    isRootItem: boolean,
    groupId: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly resource: Resource
  ) {
    super(label, type, uri, isRootItem, groupId, collapsibleState);
  }
}
