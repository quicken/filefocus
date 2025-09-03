import * as vscode from "vscode";
import { GroupFacade } from "./GroupFacade";
import { GroupManager } from "./GroupManager";
import { Group } from "./Group";
import { StorageService } from "./storage/StorageService";
import { FileFocusTreeProvider } from "./tree/FileFocusTreeProvider";
import { GroupItem } from "./tree/GroupItem";
import { FocusItem } from "./tree/FocusItem";
import { StateStorage } from "./storage/StateStorage";
import { FileStorage } from "./storage/FileStorage";
import { DynamicStorage } from "./storage/DynamicStorage";
import { FileFacade } from "./FileFacade";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated

  context.globalState.setKeysForSync(["groupmap"]);

  const groupManager = new GroupManager();

  applyDynamicGroupConfiguration(groupManager);
  applyStateGroupConfiguration(groupManager, context);
  applyProjectGroupConfiguration(groupManager);

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
// export function deactivate() {}

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

function applyDynamicGroupConfiguration(groupManager: GroupManager) {
  const showExcluded = vscode.workspace
    .getConfiguration("filefocus")
    .get("showExcludedGroup") as boolean;
  groupManager.addStorageProvider(new DynamicStorage(showExcluded));
}

function applySortKeyConfiguration(
  fileFocusTreeProvider: FileFocusTreeProvider
) {
  fileFocusTreeProvider.sortkey = vscode.workspace
    .getConfiguration("filefocus")
    .get("sortKey") as "path" | "basename";
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
        groupManager.saveGroup(group);
      }
    }

    await fileFocusTreeProvider.refresh();
  });

  vscode.workspace.onDidCloseTextDocument(async (document) => {
    if (document.uri.scheme !== "file") {
      return;
    }

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
  vscode.commands.registerCommand(
    "fileFocusExtension.addGroup",
    (path?: string) => {
      groupFacade.addGroup(path);
    }
  );

  vscode.commands.registerCommand(
    "fileFocusExtension.pinGroup",
    (groupItem: GroupItem) => {
      const group = groupManager.root.get(groupItem.groupId);
      if (group && group.readonly) {
        vscode.window.showInformationMessage(
          `Cannot pin "${group.name}" - groups from .filefocus.json cannot be pinned. Only user-created groups can be pinned.`
        );
        return;
      }
      groupFacade.pinGroup(groupItem.groupId);
    }
  );

  vscode.commands.registerCommand(
    "fileFocusExtension.openGroup",
    (groupItem: GroupItem) => {
      groupFacade.openGroup(groupItem.groupId);
    }
  );

  vscode.commands.registerCommand(
    "fileFocusExtension.renameGroup",
    (groupItem: GroupItem) => {
      const group = groupManager.root.get(groupItem.groupId);
      if (group && group.readonly) {
        vscode.window.showInformationMessage(
          `Cannot rename "${group.name}" - groups from .filefocus.json are read-only. Edit the .filefocus.json file instead.`
        );
        return;
      }
      groupFacade.renameGroup(groupItem.groupId);
    }
  );

  vscode.commands.registerCommand(
    "fileFocusExtension.removeGroup",
    (groupItem: GroupItem) => {
      const group = groupManager.root.get(groupItem.groupId);
      if (group && group.readonly) {
        vscode.window.showInformationMessage(
          `Cannot remove "${group.name}" - groups from .filefocus.json are read-only. Edit the .filefocus.json file instead.`
        );
        return;
      }
      groupFacade.removeGroup(groupItem.groupId);
    }
  );

  vscode.commands.registerCommand(
    "fileFocusExtension.addGroupResource",
    (...args: any[]) => {
      console.log('🔍 addGroupResource command called with args:', args);
      
      let path: string | undefined;
      
      // Check if first argument is a URI object
      if (args[0] && typeof args[0] === 'object' && args[0].toString) {
        path = args[0].toString();
        console.log('🔍 extracted path from URI object:', path);
      } else if (typeof args[0] === 'string') {
        path = args[0];
        console.log('🔍 using string path:', path);
      } else {
        path = vscode.window.activeTextEditor?.document.uri.toString();
        console.log('🔍 using active editor path:', path);
      }

      vscode.window.showInformationMessage(`Final path: ${path}`);

      if (path) {
        console.log('🔍 calling groupFacade.addGroupResource');
        groupFacade.addGroupResource(path);
      } else {
        console.log('❌ no path available');
        vscode.window.showErrorMessage('No file path available to add to focus group');
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

  vscode.commands.registerCommand(
    "fileFocusExtension.renameFileObject",
    async (focusItem: FocusItem) => {
      const group = groupManager.root.get(focusItem.groupId);
      if (group) {
        await FileFacade.renameFocusItem(group, focusItem);
        groupManager.saveGroup(group);
        fileFocusTreeProvider.refresh();
      }
    }
  );

  vscode.commands.registerCommand(
    "fileFocusExtension.createFileFolder",
    async (focusItem: FocusItem) => {
      const group = groupManager.root.get(focusItem.groupId);
      if (group) {
        await FileFacade.createFolder(group, focusItem);
        fileFocusTreeProvider.refresh();
      }
    }
  );

  vscode.commands.registerCommand(
    "fileFocusExtension.createFile",
    async (focusItem: FocusItem) => {
      const group = groupManager.root.get(focusItem.groupId);
      if (group) {
        await FileFacade.createFile(group, focusItem);
        fileFocusTreeProvider.refresh();
      }
    }
  );

  // New commands for nested groups
  vscode.commands.registerCommand(
    "fileFocusExtension.addNestedGroup",
    (groupItem: GroupItem) => {
      const group = groupManager.root.get(groupItem.groupId);
      if (group && group.readonly) {
        vscode.window.showInformationMessage(
          `Cannot add nested groups to "${group.name}" - groups from .filefocus.json are read-only. Edit the .filefocus.json file instead.`
        );
        return;
      }
      groupFacade.addNestedGroup(groupItem.groupId);
    }
  );

  vscode.commands.registerCommand(
    "fileFocusExtension.moveGroupToRoot",
    (groupItem: GroupItem) => {
      const group = groupManager.root.get(groupItem.groupId);
      if (group && group.readonly) {
        vscode.window.showInformationMessage(
          `Cannot move "${group.name}" - groups from .filefocus.json are read-only. Edit the .filefocus.json file instead.`
        );
        return;
      }
      groupFacade.moveGroupToRoot(groupItem.groupId);
    }
  );

  vscode.commands.registerCommand(
    "fileFocusExtension.moveGroupToParent",
    async (groupItem: GroupItem) => {
      const group = groupManager.root.get(groupItem.groupId);
      if (group && group.readonly) {
        vscode.window.showInformationMessage(
          `Cannot move "${group.name}" - groups from .filefocus.json are read-only. Edit the .filefocus.json file instead.`
        );
        return;
      }

      const currentGroup = groupManager.root.get(groupItem.groupId);
      if (!currentGroup) {
        vscode.window.showErrorMessage("Group not found.");
        return;
      }

      // Get all possible parent groups (excluding the current group and its descendants)
      const allRootGroups = Array.from(groupManager.rootGroups.values());
      const allGroups = Array.from(groupManager.root.values());
      
      // Filter out the current group and its descendants to prevent circular references
      const descendantIds = new Set([currentGroup.id, ...currentGroup.getAllChildGroups().map(g => g.id)]);
      const availableGroups = allGroups.filter(group => !descendantIds.has(group.id));
      
      // Create options with clear hierarchy indication
      const options: { label: string; groupId: string | null; description?: string }[] = [
        { label: "Root Level", groupId: null, description: "Move to top level" }
      ];
      
      // Add root groups
      for (const group of availableGroups.filter(g => g.isRootGroup)) {
        options.push({ 
          label: group.name, 
          groupId: group.id,
          description: "Root group"
        });
      }
      
      // Add nested groups with indentation to show hierarchy
      for (const group of availableGroups.filter(g => !g.isRootGroup)) {
        const depth = getGroupDepth(group);
        const indent = "  ".repeat(depth);
        options.push({ 
          label: `${indent}${group.name}`, 
          groupId: group.id,
          description: `Nested group (level ${depth + 1})`
        });
      }
      
      if (options.length === 1) {
        vscode.window.showInformationMessage("No available parent groups found.");
        return;
      }

      const selectedOption = await vscode.window.showQuickPick(
        options.map(opt => ({
          label: opt.label,
          description: opt.description,
          target: opt
        })),
        {
          canPickMany: false,
          placeHolder: "Select where to move this group"
        }
      );

      if (selectedOption) {
        if (selectedOption.target.groupId === null) {
          // Move to root level
          groupFacade.moveGroupToRoot(groupItem.groupId);
        } else {
          // Move to selected parent group
          groupFacade.moveGroupToParent(groupItem.groupId, selectedOption.target.groupId);
        }
      }
    }
  );

  // Helper function to calculate group depth
  function getGroupDepth(group: Group): number {
    let depth = 0;
    let current = group.parentGroup;
    while (current) {
      depth++;
      current = current.parentGroup;
    }
    return depth;
  }
}
