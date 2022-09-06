# Change Log

All notable changes to the "file-focus" extension will be documented in this file.

Please submit any issues you find to Git-Hub or better yet submit a pull request.

https://github.com/quicken/filefocus

### 1.4.1

- Files are now stored relative to the workspace folder path.
- Add a setting that allows choosing between storing focus groups globally or specific to a workspace (default).
- When using global storage focus groups will sync between devices.
- Fix an issue where renaming a focus group would loose all resources.
- On first loading migrate any existing storage groups to the new storage format.
- Project specific focus gruops can now be defined inside of a .filefocus.json file that is stored in the root of a workspace folder.
- The Reload Icon now reloads focus groups from all storage locations. Useful when building a file focus project file or adding/removing workspace folders.

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
