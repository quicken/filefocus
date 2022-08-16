# File Focus

Simplify workspace file and folder navigation. Organise the files and folders related to a specific task inside focus groups for easy access and navigation.

As you work on a project you can add files and folders to one or more “focus groups”. You can then quickly navigate folders or open files within a “focus group”.

Also enables more fine-grained organisation when used with multiple workspace folders.

![Feature add to Focus Group](https://github.com/quicken/filefocus/blob/master/resources/file-focus_demo.gif?raw=true)

If you like this vs-code extension please consider subscribing to my channel.

- https://www.youtube.com/channel/UCaWdpWiu450QyJYb_Hie6lA
- https://www.herdingbits.com

For bug reports and code contributions head on over to:

- https://github.com/quicken/filefocus

## Features

- Folders added to a "focus group" can be browsed.
- Create multiple "focus groups" using the add folder icon.
- Rename a "focus group" with the edit icon.
- Delete a "focus group" with the trash icon. Your files and folders will not be touched.
- Add a file or folder to a focus group from the File Explorer Context Menu.
- Files can also be added to a focus group from the editor context menu.
- "ctrl + shift + 8" will add the file in the active editor to a focus group.
- Drag and Drop root resources between focus groups.
- Pin a focus group to skip the focus group selection dialog. A pinned focus group automatically receives any added resources.

## Getting Started

1. Expand the File Focus Explorer View.
2. Click the Add Icon (see image below). Type a name for your focus group.
3. As you work open the context menu in the file explorer or editor and select: Add to focus group.
4. You can also use "ctrl + shift + 8" to add the file open in the active editor to a focus group.

You can open files directly from a focus group. Folders added to a "focus group" can be navigated like any other folder.

![Adding the first Focus Group](https://github.com/quicken/filefocus/blob/master/resources/started.png?raw=true)

## Extension Settings

Please suggest any settings you would like to tweak.
https://github.com/quicken/filefocus

## Known Issues

- Only one level of "focus groups" can be created.
- Status changes to files in the file explorer might not be reflected in Focus Groups. As a workaround click the refresh icon in the File Focus Pane.
- Drag & Drop support is currently limited to the first level (root) items only.
- A pinned focus group is always shown on the top. This is currently by accident.

## Release Notes

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

---
