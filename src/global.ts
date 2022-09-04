import { Group } from "./Group";

export interface FileFocusStorageProvider {
  readonly id: string;
  loadRootNodes(): Group[];
  saveGroup(record: Group): void;
  deleteGroupId(id: string): void;
}
