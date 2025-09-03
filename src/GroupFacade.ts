import * as vscode from "vscode";
import { GroupManager } from "./GroupManager";
import { Group } from "./Group";

/**
 * The GroupFacade provides an abstraction between the vscode UI and the underlying business logic that
 * manages File Focus Groups.
 *
 * Note: In FileFocus a folder is an actual resources like a directory while a Group is a logical (virtual)
 * folder for arbitraily organising actual resources.
 */
export class GroupFacade {
  constructor(private groupManager: GroupManager) {}

  /**
   * Adds a new Group to which resources can be added.
   * @param path Optional path that is immediatly added to the group on creation.
   * @param parentGroupId Optional ID of parent group to create nested group.
   */
  async addGroup(path?: string, parentGroupId?: string): Promise<void> {
    const groupName = await vscode.window.showInputBox({
      placeHolder: vscode.l10n.t("Enter a name for the focus group"),
    });

    if (!groupName || groupName.trim() === "") {
      return;
    }

    const groupId = GroupManager.makeGroupId(groupName);
    if (this.groupManager.root.has(groupId)) {
      await vscode.window.showErrorMessage(
        vscode.l10n.t("A focus group with this name already exists.")
      );
      return;
    }

    const group = new Group(groupId);
    group.name = groupName;
    this.groupManager.addGroup(group, "statestorage", parentGroupId);
    if (path && typeof path === 'string' && path.trim() !== '') {
      await this.addGroupResource(path);
      return;
    }
    vscode.commands.executeCommand("fileFocusTree.refreshEntry");
  }

  /**
   * Pins a FocusGroup. Resources are automatically added to the currently pinned resource
   * group.
   * @param groupId The ID of the group that should be pinned.
   */
  pinGroup(groupId: string): void {
    this.groupManager.pinnedGroupId =
      this.groupManager.pinnedGroupId === groupId ? "" : groupId;
    vscode.commands.executeCommand("fileFocusTree.refreshEntry");
  }

  /**
   * Opens all file resources in the vscode editor that are in the root of a group.
   * Recursively opens files from all nested child groups as well.
   * @param groupId The ID of the group whos root resources are to be opened.
   */
  async openGroup(groupId: string): Promise<void> {
    const group = this.groupManager.root.get(groupId);
    if (group) {
      // Get all resources recursively (includes files from nested groups)
      const allResources = group.getAllResources();
      
      let i = 1;
      for (const resource of allResources) {
        await vscode.commands.executeCommand(
          "vscode.open",
          resource,
          {
            viewColumn: vscode.ViewColumn.Active,
            preview: false,
            preserveFocus: true,
          },
          group.name
        );
      }
    }
  }

  /**
   * Initiates the workflow for removing a group.
   * @param groupId The ID of the group that should be removed.
   */
  async removeGroup(groupId: string): Promise<void> {
    const action = await vscode.window.showInformationMessage(
      vscode.l10n.t("Discard this focus group?"),
      { modal: true },
      "Discard"
    );
    if (action === "Discard") {
      this.groupManager.removeGroup(groupId);
      vscode.commands.executeCommand("fileFocusTree.refreshEntry");
    }
  }

  /**
   * Initiates the workflow for renaming a FileFocus Group
   * @param srcGroupId
   * @returns
   */
  async renameGroup(srcGroupId: string): Promise<void> {
    const group = this.groupManager.root.get(srcGroupId);
    if (group) {
      const groupName = await vscode.window.showInputBox({
        placeHolder: vscode.l10n.t("Enter a name for the focus group"),
        value: group.name,
      });

      if (
        !groupName ||
        groupName.trim() === group.name ||
        groupName.trim() === ""
      ) {
        return;
      }

      const destinationId = GroupManager.makeGroupId(groupName);
      if (this.groupManager.root.has(destinationId)) {
        await vscode.window.showErrorMessage(
          vscode.l10n.t("A focus group with this name already exists.")
        );
        return;
      }

      this.groupManager.renameGroup(srcGroupId, groupName);
      vscode.commands.executeCommand("fileFocusTree.refreshEntry");
    }
  }

  /**
   * Initates the workflow for adding a new resource to a focus group.
   * @param path The path of the resource that should be added to some group.
   * @returns
   */
  async addGroupResource(path: string): Promise<void> {
    console.log('🔍 GroupFacade.addGroupResource called with:', path, 'type:', typeof path);
    vscode.window.showInformationMessage(`GroupFacade received: ${path}`);
    
    // Validate that path is a non-empty string
    console.log('🔍 Validating path:', {
      path: path,
      type: typeof path,
      isString: typeof path === 'string',
      length: path?.length,
      trimmed: path?.trim(),
      trimmedLength: path?.trim()?.length
    });
    
    if (!path || typeof path !== 'string' || path.trim() === '') {
      console.log('❌ invalid path, returning');
      vscode.window.showErrorMessage('Invalid path provided');
      return;
    }

    console.log('✅ path validation passed');
    vscode.window.showInformationMessage('Path validation passed');

    /* If no writable focus group as been defined define a focus group. */
    if (this.groupManager.writableGroupNames.length === 0) {
      console.log('🔍 No writable groups found, creating new group');
      vscode.window.showInformationMessage('No groups exist, creating new one...');
      
      // Create a new group and add the resource to it
      const groupName = await vscode.window.showInputBox({
        placeHolder: vscode.l10n.t("Enter a name for the focus group"),
      });

      console.log('🔍 User entered group name:', groupName);

      if (!groupName || groupName.trim() === "") {
        console.log('❌ User cancelled group creation');
        vscode.window.showInformationMessage('Group creation cancelled');
        return;
      }

      const groupId = GroupManager.makeGroupId(groupName);
      if (this.groupManager.root.has(groupId)) {
        await vscode.window.showErrorMessage(
          vscode.l10n.t("A focus group with this name already exists.")
        );
        return;
      }

      const group = new Group(groupId);
      group.name = groupName;
      this.groupManager.addGroup(group, "statestorage");
      
      // Now add the resource to the newly created group
      const uri = vscode.Uri.parse(path);
      try {
        await vscode.workspace.fs.stat(uri);
        group.addResource(uri);
        this.groupManager.saveGroup(group);
        vscode.commands.executeCommand("fileFocusTree.refreshEntry");
      } catch (err) {
        vscode.window.showErrorMessage(
          vscode.l10n.t("Can't find resource in workspace.")
        );
      }
      return;
    }

    const groupName = await this.selectTargetGroup();
    console.log('🔍 Selected target group:', groupName);
    vscode.window.showInformationMessage(`Selected group: ${groupName || 'none'}`);
    
    if (groupName) {
      const groupId = GroupManager.makeGroupId(groupName);
      if (this.groupManager.root.has(groupId)) {
        const group = this.groupManager.root.get(groupId);
        if (group && !group.readonly) {
          const uri = vscode.Uri.parse(path);
          try {
            await vscode.workspace.fs.stat(uri);
            group.addResource(uri);
            this.groupManager.saveGroup(group);
            vscode.commands.executeCommand("fileFocusTree.refreshEntry");
          } catch (err) {
            vscode.window.showErrorMessage(
              vscode.l10n.t("Can't find resource in workspace.")
            );
          }
        }
      }
    }
  }

  private async selectTargetGroup() {
    let groupName;
    /* Skip showing the quick picker if there is only one focus group to choose. from. */
    if (this.groupManager.writableGroupNames.length === 1) {
      groupName = this.groupManager.writableGroupNames[0];
    } else if (
      this.groupManager.pinnedGroupId &&
      this.groupManager.root.has(this.groupManager.pinnedGroupId)
    ) {
      groupName = this.groupManager.root.get(
        this.groupManager.pinnedGroupId
      )?.name;
    } else {
      groupName = await vscode.window.showQuickPick(
        this.groupManager.writableGroupNames,
        {
          canPickMany: false,
          placeHolder: vscode.l10n.t(
            "Select the focus group for this resource."
          ),
        }
      );
    }

    return groupName;
  }

  /**
   * Initiates the workflow for removing a resource from a Group. This action does NOT
   * actually delete the resource, it just removes the resource from a group.
   * @param groupId The ID of the group from which a resource should be remove.
   * @param uri The uri of the resource that should be removed.
   */
  async removeGroupResource(groupId: string, uri: vscode.Uri): Promise<void> {
    const group = this.groupManager.root.get(groupId);
    if (group && !group.readonly) {
      group.removeResource(uri);
      this.groupManager.saveGroup(group);
      vscode.commands.executeCommand("fileFocusTree.refreshEntry");
    }
  }

  /**
   * Adds a nested group to an existing group.
   * @param parentGroupId The ID of the parent group.
   */
  async addNestedGroup(parentGroupId: string): Promise<void> {
    await this.addGroup(undefined, parentGroupId);
  }

  /**
   * Moves a group to be nested under another group.
   * @param groupId The ID of the group to move.
   * @param newParentId The ID of the new parent group.
   */
  async moveGroupToParent(groupId: string, newParentId: string): Promise<void> {
    const success = this.groupManager.moveGroup(groupId, newParentId);
    if (success) {
      vscode.commands.executeCommand("fileFocusTree.refreshEntry");
    } else {
      await vscode.window.showErrorMessage(
        vscode.l10n.t("Failed to move group. Group or parent not found.")
      );
    }
  }

  /**
   * Moves a group to be a root-level group.
   * @param groupId The ID of the group to move to root level.
   */
  async moveGroupToRoot(groupId: string): Promise<void> {
    const success = this.groupManager.moveGroup(groupId, null);
    if (success) {
      vscode.commands.executeCommand("fileFocusTree.refreshEntry");
    } else {
      await vscode.window.showErrorMessage(
        vscode.l10n.t("Failed to move group to root level.")
      );
    }
  }
}
