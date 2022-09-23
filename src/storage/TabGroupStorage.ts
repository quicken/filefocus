import { workspace } from "vscode";
import { FileFocusStorageProvider } from "../global";
import { Group } from "../Group";
import { GroupManager } from "../GroupManager";

export class TabGroupStorage implements FileFocusStorageProvider {
  id = "tabgroup";
  _store: Map<string, Group> = new Map();
  constructor() {}

  public async loadRootNodes() {
    const groupId = GroupManager.makeGroupId("ActiveEditors");
    const group = new Group(groupId);
    group.name = "Editors";
    group.readonly = true;
    for (const document of workspace.textDocuments) {
      if (document.uri.scheme === "file") {
        group.addResource(document.uri);
      }
    }
    return [group];
  }

  public saveGroup(group: Group) {
    /* For file storage this is currently a NOOP.*/
  }

  public deleteGroupId(id: string) {
    /* For file storage this is currently a NOOP.*/
  }

  public async reset() {
    /* For file storage this is currently a NOOP.*/
  }
}
