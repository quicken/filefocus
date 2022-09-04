import { StorageService } from "./StorageService";
import { FileFocusStorageProvider } from "../global";
import { Group } from "../Group";
import { Uri } from "vscode";
import { workspace } from "vscode";
import { GroupManager } from "../GroupManager";

type GroupRecord = {
  id: string;
  label: string;
};

type GroupStore = {
  [key: string]: GroupRecord;
};

type Resource = {
  workspace: string;
  path: string;
};

export class LocalStorage implements FileFocusStorageProvider {
  id = "local";

  constructor(private storage: StorageService) {}

  public loadRootNodes() {
    const groupStore = this.storage.getValue<GroupStore>("groupstore", {});
    const storeMap = new Map(Object.entries(groupStore));

    const groups: Group[] = [];
    for (const [groupId, record] of storeMap) {
      const group = this.loadGroupNode(groupId);
      if (group) {
        this.migrateToRelativePaths(group);
        groups.push(group);
      }
    }

    return groups;
  }

  private migrateToRelativePaths(group: Group) {
    const paths = this.storage.getValue<string[]>(`A-${group.id}`, []);

    const resources = paths.map((path) => {
      return this.uriToResource(Uri.parse(path));
    });
    if (resources.length > 0) {
      this.storage.setValue(`B-${group.id}`, resources);

      /*
      Ensure that the converted resources are assigned to the group, the very
      first time this code is executed.
      */
      for (const resource of resources) {
        const uri = this.resourceToUri(resource);
        if (uri) {
          group.addResource(uri);
        }
      }
    }
  }

  uriToResource(uri: Uri) {
    let resource: Resource;
    const workspaceName = workspace.getWorkspaceFolder(uri)?.name;
    if (workspaceName) {
      resource = {
        workspace: workspaceName,
        path: workspace.asRelativePath(uri, false),
      };
    } else {
      resource = {
        workspace: "",
        path: uri.toString(),
      };
    }

    return resource;
  }

  getWorkspaceUriByName(name: string) {
    if (workspace.workspaceFolders) {
      for (const ws of workspace.workspaceFolders) {
        if (ws.name === name) {
          return ws.uri;
        }
      }
    }

    return undefined;
  }

  resourceToUri(resource: Resource) {
    if (!resource.workspace) {
      return Uri.parse(resource.path);
    }

    const workspaceUri = this.getWorkspaceUriByName(resource.workspace);
    if (workspaceUri) {
      return Uri.joinPath(workspaceUri, resource.path);
    }

    return undefined;
  }

  public saveGroup(group: Group) {
    this.saveGroupNode(group);
  }

  private saveGroupNode(group: Group) {
    let groupStore = this.storage.getValue<GroupStore>("groupstore", {});
    const storeMap = new Map(Object.entries(groupStore));
    storeMap.set(group.id, { id: group.id, label: group.name });
    groupStore = Object.fromEntries(storeMap.entries());
    this.storage.setValue<GroupStore>("groupstore", groupStore);

    const resources = group.resources.map((uri) => this.uriToResource(uri));
    this.storage.setValue(`B-${group.id}`, resources);
  }

  private loadGroupNode(id: string) {
    const groupStore = this.storage.getValue<GroupStore>("groupstore", {});
    const groupMap = new Map(Object.entries(groupStore));
    const groupRecord = groupMap.get(id);
    if (groupRecord) {
      const group = new Group(groupRecord.id);
      group.name = groupRecord.label;
      const resources = this.storage.getValue<Resource[]>(`B-${group.id}`, []);
      for (const resource of resources) {
        const uri = this.resourceToUri(resource);
        if (uri) {
          group.addResource(uri);
        }
      }

      return group;
    }
  }

  public deleteGroupId(id: string) {
    let groupStore = this.storage.getValue<GroupStore>("groupstore", {});
    const storeMap = new Map(Object.entries(groupStore));
    storeMap.delete(id);
    groupStore = Object.fromEntries(storeMap.entries());
    this.storage.setValue<GroupStore>("groupstore", groupStore);
    this.storage.deleteValue(`A-${id}`);
  }
}
