import { Memento } from "vscode";

export class StorageService {
  constructor(private storage: Memento) {}

  public getValue<T>(key: string, defaultValue: T): T {
    return this.storage.get<T>(key, defaultValue);
  }

  public setValue<T>(key: string, value: T) {
    this.storage.update(key, value);
  }

  public deleteValue(key: string) {
    this.storage.update(key, undefined);
  }
}
