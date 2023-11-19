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
}
