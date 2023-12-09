import { Memento } from "vscode";

/**
 * The storage service provide an abstraction to a VSCode memento object
 * which is used to optimise working with the built in VSCode mechanism
 * for storing settings.
 */
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
