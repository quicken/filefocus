import { StorageService } from "./StorageService";
import { Group } from "./Group";
import { Uri } from "vscode";

export type GroupRecord = {
  id: string;
  label: string;
};

export type GroupStore = {
  [key: string]: GroupRecord;
};

export type GroupNode = {
  [key: string]: Group;
};

export class FileFocus {
  public readonly root: Map<string, Group> = new Map();

  constructor(private storage: StorageService) {
    this.root = this.loadRootNodes();
    if (!this.root) {
      this.root = new Map();
    }
  }

  public addGroup = (group: Group) => {
    this.root.set(group.id, group);
    this.saveGroup(group);
  };

  public removeGroup = (id: string) => {
    this.root.delete(id);
    this.deleteGroupId(id);
  };

  private loadRootNodes() {
    const groupStore = this.storage.getValue<GroupStore>("groupstore", {});
    const storeMap = new Map(Object.entries(groupStore));

    const groupMap: Map<string, Group> = new Map();
    for (const [id, record] of storeMap) {
      const group = this.loadGroupNode(id);
      if (group) {
        groupMap.set(group.id, group);
      }
    }

    return groupMap;
  }

  private loadGroupNode(id: string) {
    const groupStore = this.storage.getValue<GroupStore>("groupstore", {});
    const groupMap = new Map(Object.entries(groupStore));
    const groupRecord = groupMap.get(id);
    if (groupRecord) {
      const group = new Group(groupRecord.id);
      group.name = groupRecord.label;
      const paths = this.storage.getValue<string[]>(`A-${group.id}`, []);
      for (const path of paths) {
        group.addResource(Uri.parse(path));
      }
      return group;
    }
  }

  public saveGroup(group: Group) {
    let groupStore = this.storage.getValue<GroupStore>("groupstore", {});
    const storeMap = new Map(Object.entries(groupStore));
    storeMap.set(group.id, { id: group.id, label: group.name });
    groupStore = Object.fromEntries(storeMap.entries());
    this.storage.setValue<GroupStore>("groupstore", groupStore);

    const paths = group.resources.map((uri) => uri.toString());
    this.storage.setValue(`A-${group.id}`, paths);
  }

  private deleteGroupId(id: string) {
    let groupStore = this.storage.getValue<GroupStore>("groupstore", {});
    const storeMap = new Map(Object.entries(groupStore));
    storeMap.delete(id);
    groupStore = Object.fromEntries(storeMap.entries());
    this.storage.setValue<GroupStore>("groupstore", groupStore);
    this.storage.deleteValue(`A-${id}`);
  }
}
