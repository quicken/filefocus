# Change Log

All notable changes to the "file-focus" extension will be documented in this file.

Please submit any issues you find to Git-Hub or better yet submit a pull request.

https://github.com/quicken/filefocus

### 1.5.0

- Usage of Project Groups can now be turned off in settings.
- Add a setting that automatically adds opened files to the pinned focus group.
- Add experimental setting that shows all known editors in special "Editors" group.
- All settings changes are now applied without requiring a restart of VSCode.

### 1.4.2

- Fix bug preventing resources from being removed.
- Fix bug preventing drag & drop between focus groups.
- Fix bug preventing drag to open when working inside of WSL.
- Do not show edit controls for read only groups.
- Prevent adding/removing resources from read only groups.

### 1.4.1

- Files are now stored relative to the workspace folder path.
- Add a setting that allows choosing between storing focus groups globally or specific to a workspace (default).
- When using global storage focus groups will sync between devices.
- Fix an issue where renaming a focus group would loose all resources.
- On first loading migrate any existing storage groups to the new storage format.
- Project specific focus groups can now be defined inside of a .filefocus.json file that is stored in the root of a workspace folder.
- Project specific focus groups have a visual indicator and will not show up in the Group Picker.
- The Reload Icon now reloads focus groups from all storage locations. Useful when building a file focus project file or adding/removing workspace folders.
- Add a setting that allows sorting resources by the full path instead of just the filename. Changing this setting requires restarting VSCode.
- Support mono and multi folder workspaces. Within a mono folder workspace the extension tries to map resources. This allows defining a focus group with files commonly
  used in your language of choice.

### 1.3.0

- Drag any file from a focus group into an editor to open the file. Handy for opening files side by side.
- Drag a file from a focus group sub-folder into another focus group.
- Drag and Drop files and folders from the file explorer into a focus group.

### 1.2.1

- Fix bug, causing a focus group to crash when a resource was deleted from the file system. Now shows a warning marker next to non-existing resources.

### 1.2.0

- Fix bug, the same resource could be added multiple times.
- A focus group can now be pinned. When a focus group is pinned it automatically receives any added resources.

### 1.1.0

- Show a hint of the folder location for root items. Handy where multiple root items might have the same name.
- Drag & Drop Support for Root Items between focus groups.

### 1.0.1

- Add keyboard extension: "ctrl+shift+8" to add the file in the active editor to a focus group.
- Improve language used in dialogs.
- Ask for confirmation before deleting a focus group.
- When there is only one defined focus group, skip showing the focus group quick picker.
- When there are no defined focus groups the add resource action will show a dialog and function as an "add focus group" action.

### 0.0.3

Initial release:

- Add, Rename, Delete Focus Groups.
- Use context menus to Add Files or Folders to a Focus Group.
- Support navigating folders that are added to a Focus Group.
- Maintain File Icons
