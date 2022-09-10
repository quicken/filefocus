import { FileFocusStorageProvider } from "../global";
import { Group } from "../Group";

export class EphemeralStorage implements FileFocusStorageProvider {
  id = "ephemeral";
  _store: Map<string, Group> = new Map();
  constructor() {}

  public async loadRootNodes() {
    return [...this._store].map(([groupId, group]) => group);
  }

  public saveGroup(group: Group) {
    this._store.set(group.id, group);
  }

  public deleteGroupId(id: string) {
    this._store.delete(id);
  }

  public async reset() {
    this._store.clear();
  }
}
