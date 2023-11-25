import { Uri } from "vscode";

export class FileManager {
  /**
   * Retunrs the filename from a Uri including the file extension.
   * @param uri The uri to get the filename from.
   * @returns The filename including the file extension.
   */
  static fileNameFromUri(uri: Uri) {
    return uri.path.split("/").pop();
  }

  /**
   * Changes the filepart and extension of a uri, with the new filename..
   * @param uri The uri to change.
   * @param newFilenName The new filename.
   * @returns The new uri with the new filename.
   */
  static renameFilenameInUri(uri: Uri, newFilenName: string): Uri {
    const path = uri.path.split("/");
    path.pop();
    path.push(newFilenName);
    const pathString = path.join("/");
    return uri.with({ path: pathString });
  }

  /**
   * Creates a URI for creating a new folder.
   *
   * Importantly this method does NOT perfom the file system operation it
   * only creates the URI.
   *
   * @param parentURI The parent uri in which the folder will be created.
   * @param newFolderName The name of the folder that will be created.
   * @returns The uri of the new folder.
   */
  static newFolderUri(parentUri: Uri, newFolderName: string): Uri {
    const path = parentUri.path.split("/");
    path.push(newFolderName);
    const pathString = path.join("/");
    return parentUri.with({ path: pathString });
  }
}
