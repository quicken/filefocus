import { Uri } from "vscode";
import * as fs from 'fs/promises';

/**
 * A collection of resources that should be shown together are managed by a Group.
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

  constructor(public readonly id: string) { }

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
  public addResource = async (uri: Uri) => {
    if (this._resourceContains(uri)) {
      return;
    }

    // Check if the file or folder at the URI's fsPath exists
    try {
      await fs.access(uri.fsPath);
      this._resource.push(uri);
    } catch (err) {
      console.error(`The file or folder at ${uri.fsPath} does not exist`);
    }
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
