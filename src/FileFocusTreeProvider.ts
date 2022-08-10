import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

/*
Maybe Chekc here for more information on how tree view operates:
https://github.com/microsoft/vscode-extension-samples/blob/main/tree-view-sample/src/fileExplorer.ts */

export class FileFocusTreeProvider
  implements vscode.TreeDataProvider<FocusItem>
{
  constructor(private workspaceRoot: string) {}

  getTreeItem(element: FocusItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    console.log("get Tree Item");
    return element;
  }

  getChildren(element?: any): vscode.ProviderResult<FocusItem[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage("No FocusItem in empty workspace.");
      return Promise.resolve([]);
    }

    /* when element is defined the user has picked an element. */
    if (element) {
      const focusItem = element as FocusItem;
      switch (focusItem.type) {
        case vscode.FileType.Directory: {
          const baseUri = vscode.Uri.parse(focusItem.parent);
          const uri = vscode.Uri.joinPath(baseUri, focusItem.label);
          return this.getFileInFolder(uri);
        }

        case vscode.FileType.File: {
          const baseUri = vscode.Uri.parse(focusItem.parent);
          const uri = vscode.Uri.joinPath(baseUri, focusItem.label);
          return;
        }

        default:
          break;
      }

      return Promise.resolve([]);
    } else {
      return this.getFileInFolder(vscode.Uri.file(this.workspaceRoot));
    }
  }

  private async getFileInFolder(uri: vscode.Uri): Promise<FocusItem[]> {
    const result = await vscode.workspace.fs.readDirectory(uri);

    const out: FocusItem[] = [];
    for (const item of result) {
      const itemUri = vscode.Uri.joinPath(uri, item[0]);

      vscode.ThemeIcon.File;

      switch (item[1]) {
        case vscode.FileType.File:
          {
            const focusItem = new FocusItem(
              item[0],
              item[1],
              uri.toString(),
              vscode.TreeItemCollapsibleState.None
            );
            focusItem.command = {
              command: "vscode.open",
              title: "Open File",
              arguments: [itemUri],
            };
            focusItem.resourceUri = itemUri;
            focusItem.iconPath = vscode.ThemeIcon.File;
            out.push(focusItem);
          }
          break;

        case vscode.FileType.Directory:
          out.push(
            new FocusItem(
              item[0],
              item[1],
              uri.toString(),
              vscode.TreeItemCollapsibleState.Collapsed
            )
          );
          break;

        default:
          break;
      }
    }

    return out;
  }

  private _onDidChangeTreeData: vscode.EventEmitter<
    FocusItem | undefined | null | void
  > = new vscode.EventEmitter<FocusItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    FocusItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  refresh(): void {
    console.log("refreshing");

    // vscode.workspace.openTextDocument();

    this._onDidChangeTreeData.fire();
  }
}

class FocusItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly type: vscode.FileType,
    public readonly parent: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}`;
    this.description = "dsc";
  }
}
