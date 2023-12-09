import { Uri } from "vscode";
/**
 * A collection of resources that should be shown together are managed by a Group.
 *
 * Note: In FileFocus a folder is an actual resources like a directory while a Group is a logical (virtual)
 * folder for arbitraily organising actual resources.
 */
export class Group {
  private _resource: Uri[] = [];

  /**
   * The name of the group that is shown in the UI.
   */
  public name = "";

  /**
   * A read only group can not he altered or saved into storage.
   */
  public readonly = false;

  constructor(public readonly id: string) {}

  /**
   * Retuns all resources (files and folders) that are associated with a group.
   */
  get resources() {
    return this._resource;
  }

  /**
   * Add a resource (file/folder) to the group.
   * @param uri The vscode.URI of the resource.
   */
  public addResource = (uri: Uri) => {
    if (this._resourceContains(uri)) {
      return;
    }

    this._resource.push(uri);
  };
  /**
   * Remove a resource (file/folder) from the group.
   * @param uri
   */
  public removeResource = (uri: Uri) => {
    const i = this._resource.findIndex(
      (item) => item.toString() === uri.toString()
    );
    if (i < 0) {
      return;
    }
    this._resource.splice(i, 1);
  };

  private _resourceContains = (uri: Uri) => {
    return this._resource.some((value) => value.fsPath === uri.fsPath);
  };
}
