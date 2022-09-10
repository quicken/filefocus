import { v5 as uuidv5 } from "uuid";
import { Group } from "./Group";
import { FileFocusStorageProvider } from "./global";

/**
 * Manages how groups are loaded and stored.
 */
export class GroupManager {
  /**
   * Creates a identifier for a group based on the groups name.
   *
   * @name The name of the group.
   */
  static makeGroupId(name: string) {
    const namespace = "cc51e20a-7c32-434c-971f-5b3ea332deaa";
    return uuidv5(name, namespace);
  }

  /**
   * Central in memory storage of all managed groups.
   * Maps group.id to a group to quickly look up a group.
   */
  public readonly root: Map<string, Group> = new Map();

  /* Looks up which storage provider should be used to persist a group.
   * Maps group.id to FileFocusStorageProvider.id .
   */
  private readonly storageMap: Map<string, string> = new Map();

  /**
   * Identifies which group is currently "pinned".
   * Added resources are automatically assinged to the "pinned" group.
   */
  private _pinnedGroupId = "";

  /**
   * Contains all configured storage providers.
   * Maps a FileFocusStorageProvider.id to a FileFocusStorageProvider
   */
  private _storageProvider: Map<string, FileFocusStorageProvider> = new Map();

  constructor() {
    if (!this.root) {
      this.root = new Map();
    }
  }

  /**
   * Registers a storage provider.
   * @param storageProvider The storage provider that is used to load/save groups.
   */
  addStorageProvider(storageProvider: FileFocusStorageProvider) {
    this._storageProvider.set(storageProvider.id, storageProvider);
  }

  /**
   * Loads groups from all registered storage providers into the root.
   */
  async loadAll() {
    this.root.clear();
    for (const storageProvider of this._storageProvider) {
      const groups = await storageProvider[1].loadRootNodes();
      for (const group of groups) {
        this.root.set(group.id, group);
        this.storageMap.set(group.id, storageProvider[1].id);
      }
    }
  }

  /**
   * Resets/clears all registered storage providers.
   */
  async resetStorage() {
    for (const storageProvider of this._storageProvider) {
      await storageProvider[1].reset();
    }
    this.root.clear();
  }

  get pinnedGroupId() {
    return this._pinnedGroupId;
  }

  set pinnedGroupId(value: string) {
    this._pinnedGroupId = value;
  }

  /**
   * Adds a group.
   * @param group The group that is to be added.
   * @param storageProviderId The id of the storage provider that will manage loading/saving this group.
   */
  public addGroup = (group: Group, storageProviderId: string) => {
    this.root.set(group.id, group);
    this.storageMap.set(group.id, storageProviderId);
    this.saveGroup(group);
  };

  /**
   * Removes/Deletes a group.
   * @param id The ID of the group that should be deleted.
   */
  public removeGroup = (id: string) => {
    const provider = this._storageProvider.get(this.storageMap.get(id) || "");

    this.root.delete(id);
    this.storageMap.delete(
      id
    ); /* Order matters: Do no delete the storageMap value prior to locating the storage provider.*/
    if (provider) {
      provider.deleteGroupId(id);
    }
  };

  /**
   * Change the name of a group.
   * @param id The id of the group that should be renamed.
   * @param name The new name of the group.
   */
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

  /**
   * Gets the names of all groups that are currenly being managed.
   */
  public get groupNames() {
    const names: string[] = [];
    this.root.forEach((group) => {
      names.push(group.name);
    });
    return names;
  }

  /* Gets the names of all groups that are writable. That is excludes groups
   * which can not be edited.
   */
  public get writableGroupNames() {
    const names: string[] = [];
    this.root.forEach((group) => {
      if (!group.readonly) {
        names.push(group.name);
      }
    });
    return names;
  }

  /**
   * Persists a group. A group is only persisted if the group id can be
   * maped a file focus storage provider.
   * @param group The group that is to be persisted.
   */
  public saveGroup(group: Group) {
    const provider = this._storageProvider.get(
      this.storageMap.get(group.id) || ""
    );
    if (provider) {
      provider.saveGroup(group);
    }
  }
}
