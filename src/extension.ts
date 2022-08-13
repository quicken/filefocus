import * as vscode from "vscode";
import { MenuViewController } from "./MenuViewController";
import { FileFocus } from "./FileFocus";
import { StorageService } from "./StorageService";
import {
  FileFocusTreeProvider,
  FocusItem,
  GroupItem,
} from "./FileFocusTreeProvider";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(context.storageUri);
  const fileFocus = new FileFocus(new StorageService(context.workspaceState));
  const menuViewController = new MenuViewController(fileFocus);

  const rootPath =
    vscode.workspace.workspaceFolders &&
    vscode.workspace.workspaceFolders.length > 0
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : "";
  const fileFocusTreeProvider = new FileFocusTreeProvider(rootPath, fileFocus);
  vscode.window.registerTreeDataProvider(
    "fileFocusTree",
    fileFocusTreeProvider
  );

  vscode.commands.registerCommand("fileFocusTree.refreshEntry", () =>
    fileFocusTreeProvider.refresh()
  );
  vscode.commands.registerCommand("menuViewController.addGroup", () => {
    menuViewController.addGroup();
  });

  vscode.commands.registerCommand("menuViewController.removeGroup", () => {
    menuViewController.removeGroup();
  });

  vscode.commands.registerCommand(
    "menuViewController.renameGroup",
    (groupItem: GroupItem) => {
      menuViewController.renameGroup(groupItem.groupId);
    }
  );

  vscode.commands.registerCommand(
    "menuViewController.addGroupResource",
    (path: string) => {
      menuViewController.addGroupResource(path);
    }
  );

  vscode.commands.registerCommand(
    "menuViewController.removeGroupResource",
    (focusItem: FocusItem) => {
      menuViewController.removeGroupResource(focusItem.groupId, focusItem.uri);
    }
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
