import * as vscode from "vscode";
import { workspace, Uri } from "vscode";
import { FileManager } from "./FileManager";
import { Group } from "./Group";
import { FocusItem } from "./tree/FocusItem";
import { minimatch } from "minimatch";

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
      vscode.workspace.workspaceFolders;
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

  /**
   * Recursively search for all files and folders that match the passed in glob patterns in
   * all workspace folders. This method also searches files that would normally be excluded by VSCode.
   *
   * Note: This may work slightly different to the VSCode glob matching as VSCode currently provides
   * no direct access to its implementation. As such we rely on a third party glob package that
   * may work slightly differently.
   *
   * @param baseUri The base uri from which to start the search. This must be a folder URI.
   * @param patterns An array of GLOB patterns that define what should be matched.
   * @returns An array of URIs that match the glob pattern.
   */
  static async searchAllFilesAndFolders(
    baseUri: Uri,
    patterns: string[]
  ): Promise<Uri[]> {
    const matches: Uri[] = [];
    const listing = await workspace.fs.readDirectory(baseUri);
    for (const [name, type] of listing) {
      const entryUri = vscode.Uri.joinPath(baseUri, name);
      if (type === vscode.FileType.Directory) {
        const uris = await FileFacade.searchAllFilesAndFolders(
          entryUri,
          patterns
        );
        matches.push(...uris);
      }
      for (const pattern of patterns) {
        if (minimatch(name, pattern)) {
          matches.push(entryUri);
          break;
        }
      }
    }
    return matches;
  }
}
