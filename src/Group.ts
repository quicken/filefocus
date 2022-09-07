import { Uri } from "vscode";

export class Group {
  private _resource: Uri[] = [];
  public name = "";
  public readonly = false;

  constructor(public readonly id: string) {}

  get resources() {
    return this._resource;
  }

  public addResource = (uri: Uri) => {
    if (this._resourceContains(uri)) {
      return;
    }
    this._resource.push(uri);
  };

  public removeResource = (uri: Uri) => {
    const i = this._resource.indexOf(uri);
    if (i < 0) {
      return;
    }
    this._resource.splice(i, 1);
  };

  private _resourceContains = (uri: Uri) => {
    return this._resource.some((value) => value.fsPath === uri.fsPath);
  };
}
