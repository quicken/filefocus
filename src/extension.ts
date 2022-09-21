import * as vscode from "vscode";
import { MenuViewController } from "./MenuViewController";
import { GroupManager } from "./GroupManager";
import { StorageService } from "./storage/StorageService";
import { FileFocusTreeProvider } from "./tree/FileFocusTreeProvider";
import { GroupItem } from "./tree/GroupItem";
import { FocusItem } from "./tree/FocusItem";
import { StateStorage } from "./storage/StateStorage";
import { FileStorage } from "./storage/FileStorage";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated

  const useGlobalStorage = vscode.workspace
    .getConfiguration("filefocus")
    .get("useGlobalStorage");

  const groupManager = new GroupManager();
  if (useGlobalStorage) {
    context.globalState.setKeysForSync(["groupmap"]);
    groupManager.addStorageProvider(
      new StateStorage(new StorageService(context.globalState))
    );
  } else {
    groupManager.addStorageProvider(
      new StateStorage(new StorageService(context.workspaceState))
    );
  }

  groupManager.addStorageProvider(new FileStorage());

  await groupManager.loadAll();

  const menuViewController = new MenuViewController(groupManager);

  const fileFocusTreeProvider = new FileFocusTreeProvider(
    context,
    groupManager
  );

  fileFocusTreeProvider.sortkey = vscode.workspace
    .getConfiguration("filefocus")
    .get("sortkey") as "path" | "basename";

  vscode.commands.registerCommand("fileFocusTree.refreshEntry", () =>
    fileFocusTreeProvider.refresh()
  );
  vscode.commands.registerCommand("fileFocusExtension.addGroup", () => {
    menuViewController.addGroup();
  });

  vscode.commands.registerCommand(
    "fileFocusExtension.pinGroup",
    (groupItem: GroupItem) => {
      menuViewController.pinGroup(groupItem.groupId);
    }
  );

  vscode.commands.registerCommand(
    "fileFocusExtension.renameGroup",
    (groupItem: GroupItem) => {
      menuViewController.renameGroup(groupItem.groupId);
    }
  );

  vscode.commands.registerCommand(
    "fileFocusExtension.removeGroup",
    (groupItem: GroupItem) => {
      menuViewController.removeGroup(groupItem.groupId);
    }
  );

  vscode.commands.registerCommand(
    "fileFocusExtension.addGroupResource",
    (path: string | undefined) => {
      if (path === undefined) {
        path = vscode.window.activeTextEditor?.document.uri.toString();
      }

      if (path) {
        menuViewController.addGroupResource(path);
      }
    }
  );

  vscode.commands.registerCommand(
    "fileFocusExtension.removeGroupResource",
    (focusItem: FocusItem) => {
      menuViewController.removeGroupResource(focusItem.groupId, focusItem.uri);
    }
  );

  vscode.commands.registerCommand(
    "fileFocusExtension.resetStorage",
    async () => {
      await groupManager.resetStorage();
      fileFocusTreeProvider.refresh();
    }
  );

  vscode.commands.registerCommand(
    "fileFocusExtension.reloadStorage",
    async () => {
      await groupManager.loadAll();
      fileFocusTreeProvider.refresh();
    }
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
