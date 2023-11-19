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
}
