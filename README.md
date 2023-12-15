# File Focus

File Focus provides quick access to frequently accessed source code and configuration files. Multiple files in a focus group can be opened with a single click to quickly resume
working on different issues/tickets.

Organise files in dynamic folders based on glob patterns.

Pin a focus group to automatically maintain a history of open files. With this feature, you can start working on an Issue/Ticket and file focus will automatically keep track
of the files you are working on.

If you like having one project per workspace you can group files and folders that are commonly used in your language of choice and file focus will automatically make them available from the groups you have defined.

For people who love multi-folder workspaces, you can re-group files and folders across workspace folders. Great for quick navigation where you can’t remember the file name or when working on big projects to avoid long scrolling through the file explorer.

If you want to share or highlight commonly used files and folders with your team you can store a configuration file along with your source code to make groups automatically available to all people working on the project.

![Feature added to Focus Group](https://github.com/quicken/filefocus/blob/master/resources/file-focus_demo.gif?raw=true)

Like this vs-code extension? Please consider subscribing to my channel and sharing the extension with your friends and colleagues.

- https://www.youtube.com/channel/UCaWdpWiu450QyJYb_Hie6lA
- https://www.herdingbits.com

For bug reports and code contributions head on over to:

- https://github.com/quicken/filefocus

## Features

- Define dynamic folders based on glob patterns.
- Show files & folders excluded by vscode.
- Open all files in a group with one click.
- Define groups for all Project Team Members.
- Maintains the same icon and git status as the file explorer.
- Sync groups between devices.

## What is New

- Define dynamic folders that are automatically populated based on glob patterns.
- Display files and folders excluded by vscode inside an "Excluded" folder.
- Automatically add a resource to a new focus group.
- Experimental: Add some limited file management capability. We don't want to replicate the explorer but
  some basic functionality is handy.

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

By default, focus groups are stored in your workspace allowing you to define a different set of focus groups per workspace.

Focus Groups are NOT transferred between global and workspace storage.

### Sort Key

Choose how resources are sorted.

Basename, sort resources only by the file name.

Path, sort resources by the full path. Handy when grouping resources from multiple projects and you want to still keep project files together.

### Show Project Groups

Enables project group. When enabled the extension looks for focus groups defined in a .filefocus file in the root of a workspace folder.

This allows for defining project groups that are available to all users of a project.

### Add to pinned group on open

When enabled files are automatically added to a focus group when opened in the editor. This allows automatic tracking of files you are currently working on.

### Show excluded files group.

When enabled a dynamic group is shown that will contain all files and folders that match what has been defined inside the vscode exclude file.

Enabling this option may require a restart to pick up changes.

## Creating Dynamic Folders with Glob Patterns

Glob groups are shown inside "File Focus" as folders that are automatically populated with files that match a specific glob pattern.

The following example configures a folder named "Hidden Files" that automatically shows all hidden files inside workspaces but
excludes any hidden files inside any "node_modules" folder.

Open the Vscode settings file and search for the property filefocus.globgroup then add the following item to the "globgroup" array:

```json
globgroup:[
  {
    "name":"Hidden Files",
    "include":"**/.*",
    "exclude":"**/node_modules/**"
  }
]
```

Note: It is possible to define multiple glob groups with different patterns for each group. Simply, add more items to the globgroup array with your configuration.

## Using Project-Specific Focus Groups.

Focus groups can be made available to all users of a project by manually creating a **.filefocus.json** file in the root of your workspace folders.

File Focus will merge the focus definition in all configuration files with the personally defined focus groups. The file focus extension does not write to this file. Therefore, any changes made to project focus groups will be lost after VS Code exits.

Currently, it is required that this file be manually created and populated.

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
- Some settings might require restarting vscode to be picked up.
