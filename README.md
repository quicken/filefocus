# File Focus

File Focus affords you the ability to re-organise frequently used files and folders in virtual groups while keeping your project structure intact.

Focus Groups can be defined globally so that they sync across all your devices or are defined specifically for a workspace.

If you like having one project per workspace you can group files and folders that are commonly used in your language of choice and file focus will automatically make them available from the groups you have defined.

For people that love multi-folder workspaces, you can re-group files and folders across workspace folders. Great for quick navigation where you can’t remember the file name or when working on big projects to avoid long scrolling through the file explorer.

If you want to share or highlight commonly used files and folders with your team you can store a configuration file along with your source code to make groups automatically available to all people working on the project.

![Feature add to Focus Group](https://github.com/quicken/filefocus/blob/master/resources/file-focus_demo.gif?raw=true)

Like this vs-code extension? Please consider subscribing to my channel and sharing the extension with your friends and colleagues.

- https://www.youtube.com/channel/UCaWdpWiu450QyJYb_Hie6lA
- https://www.herdingbits.com

For bug reports and code contributions head on over to:

- https://github.com/quicken/filefocus

## What is New

- Added a system setting that allows storing focus groups in the Global State instead of within the Workspace State.
- When storing focus groups in global storage groups will sync between devices.
- Resources are now stored relative to workspace folders to support syncing focus groups between different operating systems.
- Focus groups can now also be defined inside of a filefocus.json file stored inside of a project root folder. This allows sharing a set of focus groups between team members.

## Features

- Maintains the same icon and git status as the file explorer.
- Full Drag & Drop Support
- Sort by File Name or File Path
- Sync Groups across devices, Share Groups with Project Users.
- Use the keyboard, Drag & Drop or Context Menu to Add Resources.
- Hover over a resource to see the full path.

## Getting Started

1. Expand the File Focus Explorer View.
2. Click the Add Icon (see image below). Type a name for your focus group.
3. As you work open the context menu in the file explorer or editor and select: Add to focus group.
4. You can also use "ctrl + shift + 8" to add the file open in the active editor to a focus group.

You can open files directly from a focus group. Folders added to a "focus group" can be navigated like any other folder.

![Adding the first Focus Group](https://github.com/quicken/filefocus/blob/master/resources/started.png?raw=true)

### Tips & Tricks

- Drag the File-Focus Tree above the File Explorer for a better experience as Focus Groups should only contain a few items.
- Alternatively, drag the File Focus Tree on to Left Hand Tab Bar.
- Pin a focus group to skip choosing a group when adding focus groups.

## Extension Settings

### Use Global Storage

File focus groups are stored globally, available in workspaces and synced to all your devices.

By default, focus groups are stored with your workspace allowing you to define a different set of focus groups per workspace.

Changing this setting requires restarting the extension. Focus Groups are NOT transferred between global and workspace storage.

### Sort Key

Choose how resources are sorted.

Basename, sort resources only by the file name.

Path, sort resources by the full path. Handy when grouping resources from multiple projects and you want to still keep project files together.

Changing this setting requires restarting the extension.

## Using Project Specific Focus Groups.

Focus groups can be made available to all users of a project by manually creating a **.filefocus.json** file in the root of your workspace folders.

File Focus will merge the focus definition in all configuration files with the used personal defined focus groups. The file focus extension does not write to this file. Therefore, any changes made to project focus groups will be lost after VS Code exits.

Currently, it is required that this file is manually created and populated.

The file has the following format:

### Example Configuration File

**.filefocus.json**

This extension expects to find this file in the root of the workspace folder.

```json
{
  "store": [
    {
      "name": "Config",
      "path": ["package.json", ".gitignore", "tsconfig.json"]
    },
    {
      "name": "Entry Points",
      "path": ["src/extension.ts", "test/suite/index.ts"]
    }
  ]
}
```

Each item of the "store" array defines a focus group.

The name property of a focus group defines the name that is shown in the user interface for that group.

The path array defines the resources that are shown when the group is expanded. Each path is a string that contains the relative path to the resources.

## Known Issues

- Only one level of "focus groups" can be created.
- Status changes and Changes to the workspace might not be automatically reflected. Click the refresh icon in the File Focus Pane to reload focus groups.
- A pinned focus group is always shown on the top. This is currently by accident.
- Switching between global and local workspace storage does not transfer any focus groups.
- A project configuration file must be in the workspace root.
- The project configuration file must be created and edited manually.

### Windows Subsystem for Linux (WSL)

Drag to open only works for files that have been added to a "focus group" by drag & drop from the file explorer. Items added to a focus group
through any other means can not be opened by dragging. This appears to be due to a limitation in the way the vscode SDK operates.

If anyone knows how to determine the base path for a WSL remote inside of an extension or how to convert file paths to vscode remote paths please
share and I can resolve this issue.
