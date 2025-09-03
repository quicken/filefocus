import { workspace, Uri, FileSystemError } from "vscode";
import { FileFocusStorageProvider } from "../global";
import { Group } from "../Group";
import { GroupManager } from "../GroupManager";

type ProjectConfig = {
  store: ProjectGroup[];
};

type ProjectGroup = {
  name: string;
  path: string[];
  groups?: ProjectGroup[]; // Nested child groups using "groups" property
};

/**
 * Store focus group definition inside a JSON file that is stored
 * inside the root of a workspace.
 */
export class FileStorage implements FileFocusStorageProvider {
  id = "filestorage";

  public async loadRootNodes() {
    if (!workspace.workspaceFolders) {
      return [];
    }
    const groups: Group[] = [];

    for (const workspaceFolder of workspace.workspaceFolders) {
      const uri = Uri.joinPath(workspaceFolder.uri, ".filefocus.json");
      const json = await this.loadTextFile(uri);

      if (json) {
        const projectConfig = JSON.parse(json) as ProjectConfig;
        groups.push(
          ...this.processConfigFile(projectConfig, workspaceFolder.uri)
        );
      }
    }

    return groups;
  }

  public saveGroup(group: Group) {
    /* For file storage this is currently a NOOP.*/
  }

  public deleteGroupId(id: string) {
    /* For file storage this is currently a NOOP.*/
  }

  public async reset() {
    /* For file storage this is currently a NOOP.*/
  }

  private processConfigFile(config: ProjectConfig, baseUri: Uri) {
    const groups: Group[] = [];
    for (const projectGroup of config.store) {
      const group = this.createGroupFromProjectGroup(projectGroup, baseUri);
      groups.push(group);
    }

    return groups;
  }

  /**
   * Creates a Group from a ProjectGroup, including nested child groups.
   */
  private createGroupFromProjectGroup(projectGroup: ProjectGroup, baseUri: Uri, parentGroup?: Group): Group {
    const groupId = GroupManager.makeGroupId(projectGroup.name);
    const group = new Group(groupId);
    group.name = projectGroup.name;
    group.readonly = true;
    
    // Set parent relationship if provided
    if (parentGroup) {
      parentGroup.addChildGroup(group);
    }
    
    // Add resources
    for (const path of projectGroup.path) {
      const uri = Uri.joinPath(baseUri, path);
      group.addResource(uri);
    }
    
    // Add child groups recursively
    if (projectGroup.groups) {
      for (const childProjectGroup of projectGroup.groups) {
        this.createGroupFromProjectGroup(childProjectGroup, baseUri, group);
      }
    }
    
    return group;
  }

  private async loadTextFile(uri: Uri) {
    try {
      const data = await workspace.fs.readFile(uri);
      return data.toString();
    } catch (error) {
      const e = error as FileSystemError;
      if (e.code !== "FileNotFound") {
        throw error;
      }
    }
    return undefined;
  }
}
