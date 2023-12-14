import * as vscode from "vscode";
import { FileFacade } from "./FileFacade";
import { FocusUtil } from "./FocusUtil";
import { DynamicGroup } from "./DynamicGroup";

/**
 * Contains helper methods to construct specific types of
 * dynamic groups.
 *
 * The main purpose of this class is to define various
 * algorithms that dynamically add resources to a group.
 */
export class DynamicGroupFactory {
  /**
   * Creates a dynamic group based on a specific type of Glob pattern.
   * @param id The id for the created group.
   * @param name The name of the created group.
   * @param include The glob pattern that is used to determin which files should be added to this resource.
   * @returns A dynamic group that shows all files matching a specific glob pattern.
   */
  static createFileGlobGroup(
    id: string,
    name: string,
    include: vscode.GlobPattern
  ) {
    const findFiles = async () => {
      const files = vscode.workspace.findFiles(include);
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
  static createExcludedFileGroup() {
    const excludedFiles = async () => {
      const excludes =
        vscode.workspace
          .getConfiguration()
          .get("files.exclude", vscode.ConfigurationTarget.Workspace) || {};

      const globs = Object.keys(excludes);
      const resources: vscode.Uri[] = [];
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
      "filefocus-excludes",
      excludedFiles
    );
    excludedFileGroup.name = "Excluded Files";
    return excludedFileGroup;
  }
}
