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
- Pin a focus group to skip the focus group selection dialogue. A pinned focus group automatically receives any added resources.
- Drag items from the file explorer into a focus group.
- Drag a file from a focus group to the editor window to open a file.
- Drag files in a focus group subfolder to another focus group.

## Getting Started

1. Expand the File Focus Explorer View.
2. Click the Add Icon (see image below). Type a name for your focus group.
3. As you work open the context menu in the file explorer or editor and select: Add to focus group.
4. You can also use "ctrl + shift + 8" to add the file open in the active editor to a focus group.

You can open files directly from a focus group. Folders added to a "focus group" can be navigated like any other folder.

![Adding the first Focus Group](https://github.com/quicken/filefocus/blob/master/resources/started.png?raw=true)

## What is New

- Added a system setting that allows storing focus groups in the Global State instead of within the Workspace State.
- When storing focus groups in global storage groups will sync between devices.
- Resources are now stored relative to workspace folders to support syncing focus groups between different operating systems.
- Focus groups can now also be defined inside of a filefocus.json file stored inside of a project root folder. This allows sharing a set of focus groups between team members.

## Extension Settings

Please suggest any settings you would like to tweak.
https://github.com/quicken/filefocus

## Known Issues

- Only one level of "focus groups" can be created.
- Status changes to files in the file explorer might not be reflected in Focus Groups. As a workaround click the refresh icon in the File Focus Pane.
- A pinned focus group is always shown on the top. This is currently by accident.
- Switching between global and local workspace storage does not transfer any focus groups.
- A project configuration file must be in the workspace root.

### Windows Subsystem for Linux (WSL)

Drag to open only works for files that have been added to a "focus group" by drag & drop from the file explorer. Items added to a focus group
through any other means can not be opened by dragging. This appears to be due to a limitation in the way the vscode SDK operates.

If anyone knows how to determine the base path for a WSL remote inside of an extension or how to convert file paths to vscode remote paths please
share and I can resolve this issue.

## Project Specific Focus Groups.

Focus groups can be made available to all users of a project. When the extension is loaded it will search in the root of all workspace folders for a configuration file named: **.filefocus.json**.

File Focus will merge the focus definition in all configuration files with the used personal defined focus groups. The file focus extension does not write to this file. Therefore, any changes
made to project focus groups will be lost after VS Code exits.

### Example Configuration File

**.filefocus.json**

This extension expects to find this file in the root of the workspace folder.

```json
// ATTENTION: Be sure to remove all comments, otherwise this will not be a valid JSON file!

{
  "store": [
    // Each item defines a focus group. (root folder)
    {
      "name": "Config", // The name of the focus group.
      "path": ["package.json", ".gitignore", "tsconfig.json"] // The relative paths from the project root to the resource.
    },
    {
      "name": "Entry Points",
      "path": ["src/extension.ts", "test/suite/index.ts"]
    }
  ]
}
```
