import * as vscode from "vscode";
import { workspace } from "vscode";
import { FileManager } from "./FileManager";
import { Group } from "./Group";
import { FocusItem } from "./tree/FocusItem";

/**
 * This class implements methods to afford users some limited capabilities to
 * manipulate workspace resources (file system) in a similar fashion to the native vscode
 * file explorer.
 *
 * The methods in this calls essentially provide some basic file management capability
 * directly from a focus group.
 *
 * We really should not be trying to replicate all the functionality of the vscode
 * file explorer as that is really insane and impossible.
 */
export class FileFacade {
  /**
   * Rename the FocusItem as well as the actual resource that the FocusItem references.
   *
   * @param group The group that contains the item that should be renamed.
   * @param focusItem The focusItem that will be renamed.
   */
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

  /**
   * Create a new folder resource inside the specifed folder location.
   *
   * @param group The group to which the new folder should be added.
   * @param focusItem The focus item in which the new folder should be created.
   * @returns
   */
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
