import { workspace, GlobPattern, Uri, ConfigurationTarget } from "vscode";
import { FileFocusStorageProvider } from "../global";
import { FileFacade } from "../FileFacade";
import { FocusUtil } from "../FocusUtil";
import { DynamicGroup } from "../DynamicGroup";

export class DynamicStorage implements FileFocusStorageProvider {
  id = "dynamic";
  _store: Map<string, DynamicGroup> = new Map();
  private excludeGroupId = "filefocus-exclude";

  public async loadRootNodes() {
    let excludeGroup: DynamicGroup;
    if (this._store.has(this.excludeGroupId)) {
      excludeGroup = this._store.get(this.excludeGroupId) as DynamicGroup;
    } else {
      excludeGroup = this.createExcludedFileGroup();
    }
    await excludeGroup.refresh();
    this._store.set(excludeGroup.id, excludeGroup);

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

  /**
   * Creates a dynamic group based on a specific type of Glob pattern.
   * @param id The id for the created group.
   * @param name The name of the created group.
   * @param include The glob pattern that is used to determin which files should be added to this resource.
   * @returns A dynamic group that shows all files matching a specific glob pattern.
   */
  private static createFileGlobGroup(
    id: string,
    name: string,
    include: GlobPattern
  ) {
    const findFiles = async () => {
      const files = workspace.findFiles(include);
      return files;
    };

    const globGroup = new DynamicGroup(id, findFiles);
    globGroup.name = name;
    return globGroup;
  }

  /**
   * Returns a dynamic group that includes all resources that have been defined inside
   * the vscode exclude file of the current workspace.
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
