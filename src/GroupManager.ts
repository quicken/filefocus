import { v5 as uuidv5 } from "uuid";
import { StorageService } from "./StorageService";
import { Group } from "./Group";

import { FileFocusStorageProvider } from "./global";

export class GroupManager {
  static makeGroupId(name: string) {
    const namespace = "cc51e20a-7c32-434c-971f-5b3ea332deaa";
    return uuidv5(name, namespace);
  }

  public readonly root: Map<string, Group> = new Map();
  private readonly storageMap: Map<string, string> = new Map();

  private _pinnedGroupId = "";
  private _storageProvider: Map<string, FileFocusStorageProvider> = new Map();

  constructor() {
    if (!this.root) {
      this.root = new Map();
    }
  }

  addStorageProvider(storageProvider: FileFocusStorageProvider) {
    this._storageProvider.set(storageProvider.id, storageProvider);
  }

  async loadAll() {
    for (const storageProvider of this._storageProvider) {
      const groups = await storageProvider[1].loadRootNodes();
      for (const group of groups) {
        this.root.set(group.id, group);
        this.storageMap.set(group.id, storageProvider[1].id);
      }
    }
  }

  get pinnedGroupId() {
    return this._pinnedGroupId;
  }

  set pinnedGroupId(value: string) {
    this._pinnedGroupId = value;
  }

  public addGroup = (group: Group, storageProviderId: string) => {
    this.root.set(group.id, group);
    this.storageMap.set(group.id, storageProviderId);
    this.saveGroup(group);
  };

  public removeGroup = (id: string) => {
    this.root.delete(id);
    this.storageMap.delete(id);
    const provider = this._storageProvider.get(this.storageMap.get(id) || "");
    if (provider) {
      provider.deleteGroupId(id);
    }
  };

  public renameGroup = (id: string, name: string) => {
    const provider = this._storageProvider.get(this.storageMap.get(id) || "");
    const src = this.root.get(id);
    if (provider && src) {
      const dst = new Group(GroupManager.makeGroupId(name));
      dst.name = name;
      for (const uri of src.resources) {
        if (uri) {
          dst.addResource(uri);
        }
      }
      this.removeGroup(id);
      this.addGroup(dst, provider.id);
    }
  };

  public get groupNames() {
    const names: string[] = [];
    this.root.forEach((group) => {
      names.push(group.name);
    });
    return names;
  }

  public saveGroup(group: Group) {
    const provider = this._storageProvider.get(
      this.storageMap.get(group.id) || ""
    );
    if (provider) {
      provider.saveGroup(group);
    }
  }
}
