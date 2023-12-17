import * as vscode from "vscode";
import { workspace, Uri } from "vscode";
import { FileManager } from "./FileManager";
import { Group } from "./Group";
import { FocusItem } from "./tree/FocusItem";
import { minimatch } from "minimatch";

type SearchOptions = {
  recurse?: boolean;
  greedy?: boolean;
};

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

  /**
   * Create a new file resource inside the specifed folder location.
   *
   * @param group The group to which the new folder should be added.
   * @param focusItem The focus item in which the new file should be created.
   * @returns
   */
  static async createFile(group: Group, focusItem: FocusItem) {
    if (focusItem.type !== vscode.FileType.Directory) {
      return;
    }

    const parentUri = focusItem.resourceUri;
    const newFileName = await vscode.window.showInputBox({
      prompt: "New file name",
      value: "",
    });

    if (parentUri && newFileName) {
      const fileUri = Uri.joinPath(parentUri, newFileName);
      if (await FileFacade.uriExists(fileUri)) {
        return;
      }
      await workspace.fs.writeFile(fileUri, new Uint8Array());
      group.addResource(fileUri);
      vscode.workspace.openTextDocument(fileUri).then((doc) => {
        vscode.window.showTextDocument(doc);
      });
    }
  }

  /**
   * Check if a given Uri already exists as a file or folder in the file system.
   * @param uri The uri that should be checked.
   * @returns
   */
  static async uriExists(uri: Uri) {
    try {
      await workspace.fs.stat(uri);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Search for all files and folders that match the passed in glob patterns inside the given
   * base folders. This method also finds files that would normally be excluded by VSCode.
   *
   * Note: GLOB matching uses a third party package that works slightly different to the VSCode glob matching.
   * Ideally we would use the same code as VSCode for glob matching in the future.
   *
   * @param baseUri The base uri from which to start the search. This must be a folder URI.
   * @param includes An array of GLOB patterns that define what should be matched.
   * @param excludes An array of GLOB patterns that define what should not be matched.
   * @options Search options.
   * recurse: Set to true to search into subfolders.
   * greedy: Set to false to stop traversing into subfolders if the folder name is matched.
   * @readDirectory Only use for unit-testing. It would have been nicer to be able to mock vscode.workspace.fs.readDirectory with
   * simple-mock but I just could not get that working this is more simple and just works.
   * @returns An array of URIs that match the glob pattern.
   */
  static async search(
    baseUri: Uri,
    includes: string[],
    excludes: string[] = [],
    options?: SearchOptions,
    readDirectory: any = workspace.fs.readDirectory
  ): Promise<Uri[]> {
    options ??= {};
    options.recurse ??= true;
    options.greedy ??= true;

    const matches: Uri[] = [];
    const directory = await readDirectory(baseUri);

    for (const [name, type] of directory) {
      const entryUri = vscode.Uri.joinPath(baseUri, name);

      if (FileFacade.isMatch(entryUri.path, includes, excludes)) {
        matches.push(entryUri);
        /* If the folder is matched don't bother also adding a files within the
        folder because when a folder is added to a group expanding the folder will
        automatically show all resouces. */
        if (!options.greedy && type === vscode.FileType.Directory) {
          continue;
        }
      }

      if (options.recurse && type === vscode.FileType.Directory) {
        const uris = await FileFacade.search(
          entryUri,
          includes,
          excludes,
          options,
          readDirectory
        );
        matches.push(...uris);
      }
    }
    return matches;
  }

  private static isMatch(path: string, includes: string[], excludes: string[]) {
    if (FileFacade.matchesPatterns(path, excludes)) {
      return false;
    }

    return FileFacade.matchesPatterns(path, includes);
  }

  private static matchesPatterns(path: string, patterns: string[]) {
    for (const pattern of patterns) {
      if (minimatch(path, pattern, { dot: true })) {
        return true;
      }
    }
    return false;
  }
}
