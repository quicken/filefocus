import * as vscode from "vscode";
import { workspace } from "vscode";
import { FileManager } from "./FileManager";
import { Group } from "./Group";
import { FocusItem } from "./tree/FocusItem";

export class FileFacade {
  private constructor() {}
  static async renameFocusItem(group: Group, focusItem: FocusItem) {
    const oldPath = focusItem.resourceUri;
    const newFilenName = await vscode.window.showInputBox({
      prompt: "New file name",
      value: oldPath?.path.split("/").pop(),
    });

    if (oldPath && newFilenName) {
      const newPath = FileManager.renameFilenameInUri(oldPath, newFilenName);
      workspace.fs.rename(oldPath, newPath, { overwrite: false });
      if (focusItem.isRootItem) {
        group.removeResource(oldPath);
        group.addResource(newPath);
      }
    }
  }

  static async createFolder(group: Group, focusItem: FocusItem) {
    if (focusItem.type !== vscode.FileType.Directory) {
      return;
    }

    const parentUri = focusItem.resourceUri;
    const newFolderName = await vscode.window.showInputBox({
      prompt: "New folder name",
      value: "",
    });

    if (parentUri && newFolderName) {
      const newFolderUri = FileManager.newFolderUri(parentUri, newFolderName);
      workspace.fs.createDirectory(newFolderUri);
      group.addResource(newFolderUri);
    }
  }
}
