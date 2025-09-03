import { Uri } from "vscode";
/**
 * A collection of resources and/or child groups that should be shown together are managed by a Group.
 *
 * Note: In FileFocus a folder is an actual resources like a directory while a Group is a logical (virtual)
 * folder for arbitraily organising actual resources and other groups.
 */
export class Group {
  private _resource: Uri[] = [];
  private _childGroups: Group[] = [];
  private _name = "";

  /**
   * The name of the group that is shown in the UI.
   */
  get name(): string {
    return this._name;
  }

  set name(value: string | any) {
    // Ensure the name is always a string to prevent [object Object] display issues
    this._name = typeof value === 'string' ? value : String(value || '');
  }

  /**
   * A read only group can not be altered or saved into storage.
   */
  public readonly = false;

  /**
   * Reference to the parent group (if this group is nested within another).
   */
  public parentGroup: Group | null = null;

  constructor(public readonly id: string) {}

  /**
   * Returns all resources (files and folders) that are associated with a group.
   */
  get resources() {
    return this._resource;
  }

  /**
   * Returns all child groups that are nested within this group.
   */
  get childGroups() {
    return this._childGroups;
  }

  /**
   * Returns all resources recursively from this group and all nested child groups.
   */
  getAllResources(): Uri[] {
    const allResources = [...this._resource];
    for (const childGroup of this._childGroups) {
      allResources.push(...childGroup.getAllResources());
    }
    return allResources;
  }

  /**
   * Returns true if this group has any child groups.
   */
  get hasChildGroups(): boolean {
    return this._childGroups.length > 0;
  }

  /**
   * Returns true if this group is a root group (has no parent).
   */
  get isRootGroup(): boolean {
    return this.parentGroup === null;
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

  /**
   * Add a child group to this group.
   * @param childGroup The child group to add.
   */
  public addChildGroup = (childGroup: Group) => {
    if (this._childGroupContains(childGroup)) {
      return;
    }

    // Remove from previous parent if it has one
    if (childGroup.parentGroup) {
      childGroup.parentGroup.removeChildGroup(childGroup);
    }

    this._childGroups.push(childGroup);
    childGroup.parentGroup = this;
  };

  /**
   * Remove a child group from this group.
   * @param childGroup The child group to remove.
   */
  public removeChildGroup = (childGroup: Group) => {
    const i = this._childGroups.findIndex(
      (item) => item.id === childGroup.id
    );
    if (i < 0) {
      return;
    }
    this._childGroups.splice(i, 1);
    childGroup.parentGroup = null;
  };

  /**
   * Remove a child group by ID from this group.
   * @param childGroupId The ID of the child group to remove.
   */
  public removeChildGroupById = (childGroupId: string) => {
    const i = this._childGroups.findIndex(
      (item) => item.id === childGroupId
    );
    if (i < 0) {
      return;
    }
    const childGroup = this._childGroups[i];
    this._childGroups.splice(i, 1);
    childGroup.parentGroup = null;
  };

  /**
   * Find a child group by ID (searches recursively).
   * @param groupId The ID of the group to find.
   */
  public findChildGroup = (groupId: string): Group | null => {
    // Check direct children first
    for (const childGroup of this._childGroups) {
      if (childGroup.id === groupId) {
        return childGroup;
      }
    }
    
    // Search recursively in child groups
    for (const childGroup of this._childGroups) {
      const found = childGroup.findChildGroup(groupId);
      if (found) {
        return found;
      }
    }
    
    return null;
  };

  /**
   * Get all nested groups recursively (flattened list).
   */
  public getAllChildGroups = (): Group[] => {
    const allChildren: Group[] = [];
    for (const childGroup of this._childGroups) {
      allChildren.push(childGroup);
      allChildren.push(...childGroup.getAllChildGroups());
    }
    return allChildren;
  };

  /**
   * Removes all resources (file/folder) from the group.
   */
  public clearResources = () => {
    this._resource = [];
  };

  /**
   * Removes all child groups from this group.
   */
  public clearChildGroups = () => {
    for (const childGroup of this._childGroups) {
      childGroup.parentGroup = null;
    }
    this._childGroups = [];
  };

  /**
   * Replaces one resource with another.
   *
   * @param from The resource that will be removed.
   * @param to The resource that will be added in place.
   */
  public replaceResource = (from: Uri, to: Uri) => {
    const i = this._resource.indexOf(from);
    this._resource[i] = to;
  };

  private _resourceContains = (uri: Uri) => {
    return this._resource.some((value) => value.fsPath === uri.fsPath);
  };

  private _childGroupContains = (group: Group) => {
    return this._childGroups.some((value) => value.id === group.id);
  };
}
