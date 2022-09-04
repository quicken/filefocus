import { StorageService } from "../StorageService";
import { FileFocusStorageProvider } from "../global";
import { Group } from "../Group";
import { Uri } from "vscode";

export type GroupRecord = {
  id: string;
  label: string;
};

export type GroupResource = {
  workspace: string;
  path: string;
};

export type GroupStore = {
  [key: string]: GroupRecord;
};

export type GroupNode = {
  [key: string]: Group;
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
        groups.push(group);
      }
    }

    return groups;
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

  public deleteGroupId(id: string) {
    let groupStore = this.storage.getValue<GroupStore>("groupstore", {});
    const storeMap = new Map(Object.entries(groupStore));
    storeMap.delete(id);
    groupStore = Object.fromEntries(storeMap.entries());
    this.storage.setValue<GroupStore>("groupstore", groupStore);
    this.storage.deleteValue(`A-${id}`);
  }
}
