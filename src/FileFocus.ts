import { StorageService } from "./StorageService";
import { Uri } from "vscode";

export type FocusGroup = {
  id: string;
  label: string;
};

export class FileFocus {
  public readonly group: FocusGroup[] = [];
  private _active: string = "";
  private _resource: Uri[] = [];

  constructor(private storage: StorageService) {
    this.group = this.loadGroups();
    if (!this.group) {
      this.group = [];
    }
  }

  get active() {
    return this._active;
  }

  get _resources() {
    return this._resource;
  }

  public activate = (id: string) => {
    if (!this.groupContains(id)) {
      return;
    }

    this._active = id;
    this._resource = this.loadResources(id);
  };

  public addGroup = (id: string, label: string) => {
    if (this.groupContains(id)) {
      return;
    }

    this.group.push({ id: id, label: label });
    this.saveGroups(this.group);
    this.saveResources(id, []);
  };

  public deleteGroup = (id: string) => {
    const i = this.group.findIndex((_group) => {
      return _group.id === id;
    });
    if (i < 0) {
      return;
    }

    if (this._active === id) {
      this._active = "";
      this._resource = [];
    }

    this.saveGroups(this.group.splice(i, 1));
    this.deleteResources(id);
  };

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

  private groupContains = (id: string) => {
    for (const item of this.group) {
      if (item.id === id) {
        return true;
      }
    }
    return false;
  };

  private _resourceContains = (uri: Uri) => {
    return this._resource.includes(uri);
  };

  private loadResources(id: string) {
    return this.storage.getValue<Uri[]>(`A-${id}`);
  }

  private saveResources(id: string, resources: Uri[]) {
    this.storage.setValue(`A-${id}`, resources);
  }

  private deleteResources(id: string) {
    this.storage.deleteValue(`A-${id}`);
  }

  private loadGroups() {
    return this.storage.getValue<FocusGroup[]>("group");
  }

  private saveGroups(groups: FocusGroup[]) {
    this.storage.setValue("group", groups);
  }
}
