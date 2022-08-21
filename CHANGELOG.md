# Change Log

All notable changes to the "file-focus" extension will be documented in this file.

Please submit any issues you find to Git-Hub or better yet submit a pull request.

https://github.com/quicken/filefocus

### 0.0.3

Initial release:

- Add, Rename, Delete Focus Groups.
- Use context menus to Add Files or Folders to a Focus Group.
- Support navigating folders that are added to a Focus Group.
- Maintain File Icons

### 1.0.1

- Add keyboard extension: "ctrl+shift+8" to add the file in the active editor to a focus group.
- Improve language used in dialogs.
- Ask for confirmation before deleting a focus group.
- When there is only one defined focus group, skip showing the focus group quick picker.
- When there are no defined focus groups the add resource action will show a dialog and function as an "add focus group" action.

### 1.1.0

- Show a hint of the folder location for root items. Handy where multiple root items might have the same name.
- Drag & Drop Support for Root Items between focus groups.

### 1.2.0

- Fix bug, the same resource could be added multiple times.
- A focus group can now be pinned. When a focus group is pinned it automatically receives any added resources.

### 1.2.1

- Fix bug, causing a focus group to crash when a resource was deleted from the file system. Now shows a warning marker next to non-existing resources.

### 1.3.0

- Drag any file from a focus group into an editor to open the file. Handy for opening files side by side.
- Drag a file from a focus group sub-folder into another focus group.
- Drag and Drop files and folders from the file explorer into a focus group.
