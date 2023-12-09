import { FileFocusStorageProvider } from "../global";
import { Group } from "../Group";

/**
 * Store group definitions in memory. Any group stored inside this
 * construct will be wiped when the extension stops running.
 */
export class EphemeralStorage implements FileFocusStorageProvider {
  id = "ephemeral";
  _store: Map<string, Group> = new Map();

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
