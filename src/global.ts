import { Group } from "./Group";

/**
 * Defines the interface for persisting resource groups. Resource can be loaded from
 * multiple resource providers.
 */
export interface FileFocusStorageProvider {
  /**
   * A unique identifer for the storage provider. The id is used to map resources groups to a
   * storage provider.
   */
  readonly id: string;

  /**
   * Loads all groups that have been stored.
   *
   * @returns An array fo groups that are managed by this resource provider.
   */
  loadRootNodes(): Promise<Group[]>;

  /**
   * Saves a group to storage.
   * @param record The group that should be persisted.
   */
  saveGroup(record: Group): void;

  /**
   * Removes/Deletes a group from storage.
   * @param id  The id of the group that should be deleted.
   */
  deleteGroupId(id: string): void;

  /**
   * Deleted all groups from storage.
   */
  reset(): Promise<void>;
}

/**
 * A resource is either a file or folder that is located within a workspce.
 */
export type Resource = {
  /**
   * The name of the workspace to which this resource belongs.
   */
  workspace: string;

  /**
   * The relative path to this resource from the workspace root.
   */
  path: string;
};
