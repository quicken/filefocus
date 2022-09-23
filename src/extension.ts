import * as vscode from "vscode";
import { GroupFacade } from "./GroupFacade";
import { GroupManager } from "./GroupManager";
import { StorageService } from "./storage/StorageService";
import { FileFocusTreeProvider } from "./tree/FileFocusTreeProvider";
import { GroupItem } from "./tree/GroupItem";
import { FocusItem } from "./tree/FocusItem";
import { StateStorage } from "./storage/StateStorage";
import { FileStorage } from "./storage/FileStorage";
import { TabGroupStorage } from "./storage/TabGroupStorage";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated

  context.globalState.setKeysForSync(["groupmap"]);

  const groupManager = new GroupManager();

  applyStateGroupConfiguration(groupManager, context);
  applyProjectGroupConfiguration(groupManager);
  applyKnownEditorGroupConfiguration(groupManager);

  await groupManager.loadAll();

  const fileFocusTreeProvider = new FileFocusTreeProvider(
    context,
    groupManager
  );

  applySortKeyConfiguration(fileFocusTreeProvider);

  registerEvents(groupManager, fileFocusTreeProvider, context);
  registerCommands(groupManager, fileFocusTreeProvider);
}

// this method is called when your extension is deactivated
export function deactivate() {}

function applyStateGroupConfiguration(
  groupManager: GroupManager,
  context: vscode.ExtensionContext
) {
  const useGlobalStorage = vscode.workspace
    .getConfiguration("filefocus")
    .get("useGlobalStorage") as boolean;

  groupManager.removeStorageProvider("statestorage");

  if (useGlobalStorage) {
    groupManager.addStorageProvider(
      new StateStorage(new StorageService(context.globalState))
    );
  } else {
    groupManager.addStorageProvider(
      new StateStorage(new StorageService(context.workspaceState))
    );
  }
}

function applyProjectGroupConfiguration(groupManager: GroupManager) {
  const showProjectGroups = vscode.workspace
    .getConfiguration("filefocus")
    .get("showProjectGroups") as boolean;

  if (showProjectGroups) {
    groupManager.addStorageProvider(new FileStorage());
  } else {
    groupManager.removeStorageProvider("filestorage");
  }
}

function applyKnownEditorGroupConfiguration(groupManager: GroupManager) {
  const showKnownEditors = vscode.workspace
    .getConfiguration("filefocus")
    .get("showKnownEditors") as boolean;

  if (showKnownEditors) {
    groupManager.addStorageProvider(new TabGroupStorage());
  } else {
    groupManager.removeStorageProvider("tabgroup");
  }
}

function applySortKeyConfiguration(
  fileFocusTreeProvider: FileFocusTreeProvider
) {
  fileFocusTreeProvider.sortkey = vscode.workspace
    .getConfiguration("filefocus")
    .get("sortkey") as "path" | "basename";
}

function registerEvents(
  groupManager: GroupManager,
  fileFocusTreeProvider: FileFocusTreeProvider,
  context: vscode.ExtensionContext
) {
  vscode.workspace.onDidChangeConfiguration(async (e) => {
    if (e.affectsConfiguration("filefocus")) {
      applyStateGroupConfiguration(groupManager, context);
      applyProjectGroupConfiguration(groupManager);
      applyKnownEditorGroupConfiguration(groupManager);
      applySortKeyConfiguration(fileFocusTreeProvider);
      await groupManager.loadAll();
      await fileFocusTreeProvider.refresh();
    }
  });

  /**
   * Automatically add opened resources to a pinned group.
   */
  vscode.workspace.onDidOpenTextDocument(async (document) => {
    if (document.uri.scheme !== "file") {
      return;
    }

    const addToPinnedGroupOnOpen = vscode.workspace
      .getConfiguration("filefocus")
      .get("addToPinnedGroupOnOpen") as boolean;

    if (addToPinnedGroupOnOpen) {
      const group = groupManager.root.get(groupManager.pinnedGroupId);
      if (group) {
        group.addResource(document.uri);
        await groupManager.saveGroup(group);
      }
    }

    await groupManager.reloadProvider("tabgroup");
    await fileFocusTreeProvider.refresh();
  });

  vscode.workspace.onDidCloseTextDocument(async (document) => {
    if (document.uri.scheme !== "file") {
      return;
    }

    await groupManager.reloadProvider("tabgroup");
    await fileFocusTreeProvider.refresh();
  });
}

function registerCommands(
  groupManager: GroupManager,
  fileFocusTreeProvider: FileFocusTreeProvider
) {
  const groupFacade = new GroupFacade(groupManager);

  vscode.commands.registerCommand("fileFocusTree.refreshEntry", () =>
    fileFocusTreeProvider.refresh()
  );
  vscode.commands.registerCommand("fileFocusExtension.addGroup", () => {
    groupFacade.addGroup();
  });

  vscode.commands.registerCommand(
    "fileFocusExtension.pinGroup",
    (groupItem: GroupItem) => {
      groupFacade.pinGroup(groupItem.groupId);
    }
  );

  vscode.commands.registerCommand(
    "fileFocusExtension.renameGroup",
    (groupItem: GroupItem) => {
      groupFacade.renameGroup(groupItem.groupId);
    }
  );

  vscode.commands.registerCommand(
    "fileFocusExtension.removeGroup",
    (groupItem: GroupItem) => {
      groupFacade.removeGroup(groupItem.groupId);
    }
  );

  vscode.commands.registerCommand(
    "fileFocusExtension.addGroupResource",
    (path: string | undefined) => {
      if (path === undefined) {
        path = vscode.window.activeTextEditor?.document.uri.toString();
      }

      if (path) {
        groupFacade.addGroupResource(path);
      }
    }
  );

  vscode.commands.registerCommand(
    "fileFocusExtension.removeGroupResource",
    (focusItem: FocusItem) => {
      groupFacade.removeGroupResource(focusItem.groupId, focusItem.uri);
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
