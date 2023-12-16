import { workspace, GlobPattern, Uri, ConfigurationTarget } from "vscode";
import { FileFocusStorageProvider } from "../global";
import { FileFacade } from "../FileFacade";
import { FocusUtil } from "../FocusUtil";
import { DynamicGroup } from "../DynamicGroup";

/**
 * The configuration for a DynamicGroup configured to show only file resources based on Globs.
 */
type GlobConfig = {
  /**
   * The name that is assigned to the group.
   */
  name: string;
  /**
   * The glob pattern that is used to determine which workspace files will be included as group resources.
   */
  include: GlobPattern;
  /**
   * The glob pattern that is used to determine which workspace files will be excluded from the group resources.
   */
  exclude?: GlobPattern;
};

/**
 * A special pseude storage provider that manages Dynamic Groups.
 *
 * Files and/or Folders are automatically added to Dynamic Groups
 * based on different types of rules. e.g. Based on a glob pattern
 * or some other pre-defined function that is defined inside of this
 * class.
 */
export class DynamicStorage implements FileFocusStorageProvider {
  id = "dynamic";
  _store: Map<string, DynamicGroup> = new Map();
  private excludeGroupId = "filefocus-exclude";

  constructor(private showExcluded: boolean) {}

  public async loadRootNodes() {
    await this.addExcludeGroupToRoot(this.showExcluded);
    await this.addGlobGroupsToRoot();
    return [...this._store].map(([groupId, group]) => group);
  }

  public saveGroup(group: DynamicGroup) {
    /** This is a noop */
  }

  public deleteGroupId(id: string) {
    /** This is a noop */
  }

  public async reset() {
    /** This is a noop */
  }

  private async addExcludeGroupToRoot(showExcluded: boolean) {
    if (!showExcluded) {
      return;
    }

    let excludeGroup: DynamicGroup;
    if (this._store.has(this.excludeGroupId)) {
      excludeGroup = this._store.get(this.excludeGroupId) as DynamicGroup;
    } else {
      excludeGroup = this.createExcludedFileGroup();
    }
    await excludeGroup.refresh();
    this._store.set(excludeGroup.id, excludeGroup);
  }

  private async addGlobGroupsToRoot() {
    const globgroup = workspace
      .getConfiguration("filefocus")
      .get("globgroup") as GlobConfig[];

    for (let index = 0; index < globgroup.length; index++) {
      const globConfig = globgroup[index];
      const groupId = "filefocus-glob-" + index;
      let group: DynamicGroup;
      if (this._store.has(groupId)) {
        group = this._store.get(groupId) as DynamicGroup;
      } else {
        group = this.createFileGlobGroup(groupId, globConfig);
      }
      await group.refresh();
      this._store.set(groupId, group);
    }
  }

  /**
   * Creates a dynamic group based on a specific type of Glob pattern.
   * @param id The id for the created group.
   * @param config The configuration for this GlobGroup see the GlobConfig Type for details.
   * @returns A dynamic group that shows all files matching a specific glob pattern.
   */
  private createFileGlobGroup(id: string, config: GlobConfig) {
    const findFilesFilter = async () => {
      const files = workspace.findFiles(config.include, config.exclude);
      return files;
    };

    const globGroup = new DynamicGroup(id, findFilesFilter);
    globGroup.name = config.name;
    return globGroup;
  }

  /**
   * Returns a dynamic group that includes all resources that have been defined inside
   * the vscode exclude file of the current workspace.
   *
   * Note: The inbuild findFiles is not suitable method as this method
   * automatically excludes the files that we are actually trying to show and
   * the method does not find directories.
   *
   */
  private createExcludedFileGroup() {
    const excludedFiles = async () => {
      const excludes =
        workspace
          .getConfiguration()
          .get("files.exclude", ConfigurationTarget.Workspace) || {};

      const globs = Object.keys(excludes);
      const resources: Uri[] = [];
      const workspaceUris = FocusUtil.getWorkspaceUris();
      for (const workspaceUri of workspaceUris) {
        const uris = await FileFacade.searchAllFilesAndFolders(
          workspaceUri,
          globs
        );
        resources.push(...uris);
      }

      return resources;
    };

    const excludedFileGroup = new DynamicGroup(
      this.excludeGroupId,
      excludedFiles
    );
    excludedFileGroup.name = "Excluded";
    return excludedFileGroup;
  }
}
