import { StorageService } from "./StorageService";
import { FileFocusStorageProvider } from "../global";
import { Group } from "../Group";
import { Uri } from "vscode";
import { workspace } from "vscode";

type GroupRecord = {
  id: string;
  label: string;
  resources: Resource[];
};

type GroupStore = {
  [key: string]: GroupRecord;
};

type Resource = {
  workspace: string;
  path: string;
};

type DeprecateGroupStore = {
  [key: string]: DeprecateGroupRecord;
};

type DeprecateGroupRecord = {
  id: string;
  label: string;
};

export class StateStorage implements FileFocusStorageProvider {
  id = "statestorage";

  constructor(private storage: StorageService) {}

  public loadRootNodes() {
    this.migrateStorageV1();

    const groupStore = this.storage.getValue<GroupStore>("groupmap", {});

    const storeMap = new Map(Object.entries(groupStore));
    const groups: Group[] = [];
    for (const [groupId, groupRecord] of storeMap) {
      const group = new Group(groupRecord.id);
      group.name = groupRecord.label;
      for (const resource of groupRecord.resources) {
        const uri = this.resourceToUri(resource);
        if (uri) {
          group.addResource(uri);
        }
      }

      groups.push(group);
    }

    return groups;
  }

  public saveGroup(group: Group) {
    const groupRecord: GroupRecord = {
      id: group.id,
      label: group.name,
      resources: group.resources.map((uri) => this.uriToResource(uri)),
    };

    let groupStore = this.storage.getValue<GroupStore>("groupmap", {});
    const storeMap = new Map(Object.entries(groupStore));
    storeMap.set(groupRecord.id, groupRecord);

    groupStore = Object.fromEntries(storeMap.entries());
    this.storage.setValue<GroupStore>("groupmap", groupStore);
  }

  public deleteGroupId(id: string) {
    let groupStore = this.storage.getValue<GroupStore>("groupmap", {});
    const storeMap = new Map(Object.entries(groupStore));
    storeMap.delete(id);
    groupStore = Object.fromEntries(storeMap.entries());
    this.storage.setValue<GroupStore>("groupmap", groupStore);
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

  migrateStorageV1() {
    const storeversion = this.storage.getValue<number>("storeversion", 0);
    if (storeversion > 0) {
      return;
    }

    let dstStore = this.storage.getValue<GroupStore>("groupmap", {});
    const dstMap = new Map(Object.entries(dstStore));

    const srcStore = this.storage.getValue<DeprecateGroupStore>(
      "groupstore",
      {}
    );
    const srcMap = new Map(Object.entries(srcStore));

    for (const [groupId, srcRecord] of srcMap) {
      const paths = this.storage.getValue<string[]>(`A-${srcRecord.id}`, []);
      const groupRecord: GroupRecord = {
        id: srcRecord.id,
        label: srcRecord.label,
        resources: paths.map((path) => {
          return this.uriToResource(Uri.parse(path));
        }),
      };
      dstMap.set(groupRecord.id, groupRecord);
    }

    dstStore = Object.fromEntries(dstMap.entries());
    this.storage.setValue<GroupStore>("groupmap", dstStore);

    /* Now delete old values. */
    for (const [groupId, srcRecord] of srcMap) {
      this.storage.deleteValue(`A-${srcRecord.id}`);
    }
    this.storage.deleteValue("groupstore");
    this.storage.setValue<number>("storeversion", 1);
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
}
