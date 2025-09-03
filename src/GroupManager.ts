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
   * This now includes both root groups and all nested groups for fast lookup.
   */
  public readonly root: Map<string, Group> = new Map();

  /**
   * Storage for root-level groups only (groups without parents).
   * Maps group.id to a group.
   */
  public readonly rootGroups: Map<string, Group> = new Map();

  /* Looks up which storage provider should be used to persist a group.
   * Maps group.id to FileFocusStorageProvider.id .
   */
  private readonly storageMap: Map<string, string> = new Map();

  /**
   * Identifies which group is currently "pinned".
   * Added resources are automatically assigned to the "pinned" group.
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
    if (!this.rootGroups) {
      this.rootGroups = new Map();
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
   * Removes a storage provider.
   * @param storageProvider The storage provider that is used to load/save groups.
   */
  removeStorageProvider(storageProviderId: string) {
    this._storageProvider.delete(storageProviderId);
  }

  /**
   * Loads groups from all registered storage providers into the root.
   */
  async loadAll() {
    this.root.clear();
    this.rootGroups.clear();

    for (const storageProvider of this._storageProvider) {
      const groups = await storageProvider[1].loadRootNodes();
      for (const group of groups) {
        this.addGroupToMemory(group, storageProvider[1].id);
      }
    }
  }

  /**
   * Adds a group and all its nested children to the in-memory storage.
   * @param group The group to add to memory.
   * @param storageProviderId The storage provider ID.
   */
  private addGroupToMemory(group: Group, storageProviderId: string) {
    // Add the group itself
    this.root.set(group.id, group);
    this.storageMap.set(group.id, storageProviderId);
    
    // If it's a root group, also add it to rootGroups
    if (group.isRootGroup) {
      this.rootGroups.set(group.id, group);
    }
    
    // Recursively add all child groups
    for (const childGroup of group.childGroups) {
      this.addGroupToMemory(childGroup, storageProviderId);
    }
  }

  /**
   * Reloads all groups from the given storage provider.
   */
  async reloadProvider(storageProviderId: string) {
    const storageProvider = this._storageProvider.get(storageProviderId);
    if (storageProvider) {
      // Remove existing groups from this provider
      const groupsToRemove: string[] = [];
      for (const [groupId, providerId] of this.storageMap) {
        if (providerId === storageProviderId) {
          groupsToRemove.push(groupId);
        }
      }
      
      for (const groupId of groupsToRemove) {
        this.root.delete(groupId);
        this.rootGroups.delete(groupId);
        this.storageMap.delete(groupId);
      }

      // Load and add new groups
      const groups = await storageProvider.loadRootNodes();
      for (const group of groups) {
        this.addGroupToMemory(group, storageProvider.id);
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
    this.rootGroups.clear();
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
   * @param parentGroupId Optional ID of the parent group if this should be a nested group.
   */
  public addGroup = (group: Group, storageProviderId: string, parentGroupId?: string) => {
    // If a parent group is specified, add as child group
    if (parentGroupId) {
      const parentGroup = this.root.get(parentGroupId);
      if (parentGroup) {
        parentGroup.addChildGroup(group);
      }
    } else {
      // Add as root group
      this.rootGroups.set(group.id, group);
    }
    
    // Always add to the main lookup map
    this.root.set(group.id, group);
    this.storageMap.set(group.id, storageProviderId);
    this.saveGroup(group);
  };

  /**
   * Removes/Deletes a group and all its child groups.
   * @param id The ID of the group that should be deleted.
   */
  public removeGroup = (id: string) => {
    const group = this.root.get(id);
    if (!group) {
      return;
    }

    const provider = this._storageProvider.get(this.storageMap.get(id) ?? "");

    // Remove from parent if it has one
    if (group.parentGroup) {
      group.parentGroup.removeChildGroup(group);
    } else {
      // Remove from root groups if it's a root group
      this.rootGroups.delete(id);
    }

    // Recursively remove all child groups
    const allChildGroups = group.getAllChildGroups();
    for (const childGroup of allChildGroups) {
      this.root.delete(childGroup.id);
      this.storageMap.delete(childGroup.id);
      if (provider) {
        provider.deleteGroupId(childGroup.id);
      }
    }

    // Remove the group itself
    this.root.delete(id);
    this.storageMap.delete(id);
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
    const provider = this._storageProvider.get(this.storageMap.get(id) ?? "");
    const src = this.root.get(id);
    if (provider && src) {
      // Create new group with new ID based on new name
      const newGroupId = GroupManager.makeGroupId(name);
      const dst = new Group(newGroupId);
      dst.name = name;
      dst.readonly = src.readonly;
      
      // Copy all direct resources
      for (const uri of src.resources) {
        if (uri) {
          dst.addResource(uri);
        }
      }
      
      // Copy all child groups and maintain their hierarchy
      // We need to copy the child groups array to avoid modification during iteration
      const childGroups = [...src.childGroups];
      for (const childGroup of childGroups) {
        dst.addChildGroup(childGroup);
      }
      
      // Preserve parent relationship
      const parentGroup = src.parentGroup;
      
      // Remove the old group from maps and parent, but don't delete child groups
      this.root.delete(id);
      this.storageMap.delete(id);
      if (src.isRootGroup) {
        this.rootGroups.delete(id);
      }
      if (parentGroup) {
        parentGroup.removeChildGroup(src);
      }
      
      // Add the new group to maps
      this.root.set(newGroupId, dst);
      this.storageMap.set(newGroupId, provider.id);
      
      // Add to parent or root as appropriate
      if (parentGroup) {
        parentGroup.addChildGroup(dst);
      } else {
        this.rootGroups.set(newGroupId, dst);
      }
      
      // Delete the old group from storage and save the new one
      provider.deleteGroupId(id);
      this.saveGroup(dst);
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

  /**
   * Gets the names of all root groups only.
   */
  public get rootGroupNames() {
    const names: string[] = [];
    this.rootGroups.forEach((group) => {
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
   * maped to a file focus storage provider.
   * @param group The group that is to be persisted.
   */
  public saveGroup(group: Group) {
    const provider = this._storageProvider.get(
      this.storageMap.get(group.id) ?? ""
    );
    if (provider) {
      provider.saveGroup(group);
    }
  }

  /**
   * Move a group to be a child of another group.
   * @param groupId The ID of the group to move.
   * @param newParentId The ID of the new parent group, or null to make it a root group.
   */
  public moveGroup(groupId: string, newParentId: string | null): boolean {
    const group = this.root.get(groupId);
    if (!group) {
      return false;
    }

    // Remove from current parent
    if (group.parentGroup) {
      group.parentGroup.removeChildGroup(group);
    } else {
      this.rootGroups.delete(groupId);
    }

    // Add to new parent
    if (newParentId) {
      const newParent = this.root.get(newParentId);
      if (!newParent) {
        return false;
      }
      newParent.addChildGroup(group);
    } else {
      // Make it a root group
      this.rootGroups.set(groupId, group);
      group.parentGroup = null;
    }

    // Save the affected groups
    this.saveGroup(group);
    if (newParentId) {
      const newParent = this.root.get(newParentId);
      if (newParent) {
        this.saveGroup(newParent);
      }
    }

    return true;
  }

  /**
   * Find a group by ID, searching through all groups including nested ones.
   * @param groupId The ID of the group to find.
   */
  public findGroup(groupId: string): Group | null {
    return this.root.get(groupId) || null;
  }
}
