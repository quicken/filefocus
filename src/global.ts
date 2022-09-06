import { Group } from "./Group";

export interface FileFocusStorageProvider {
  readonly id: string;
  loadRootNodes(): Promise<Group[]>;
  saveGroup(record: Group): void;
  deleteGroupId(id: string): void;
  reset(): Promise<void>;
}

export type Resource = {
  workspace: string;
  path: string;
};
