# File Focus

File Focus facilitates a streamlined workflow by allowing you to reorganize mono repos or other big projects virtually.

Files and folders can be grouped dynamically using glob patterns or organized manually into virtual folders best suited to your workflow.

A pinned virtual folder automatically keeps track of files you are working on so you can quickly pick up where you left off when working on multiple issues/tickets.

If you want to share or highlight commonly used files and folders with your team you can store a configuration file along with your source code to make groups automatically available to all people working on the project.

![Feature added to Focus Group](https://github.com/quicken/filefocus/blob/master/resources/file-focus_demo.gif?raw=true)

Like this vs-code extension? Please consider subscribing to my channel and sharing the extension with your friends and colleagues.

- https://www.youtube.com/channel/UCaWdpWiu450QyJYb_Hie6lA
- https://www.herdingbits.com

For bug reports and code contributions head on over to:

- https://github.com/quicken/filefocus

## Features

- Re-organize frequently accessed and important files in virtual folders.
- Define dynamic folders based on glob patterns.
- Open all files in a group with one click.
- Show files & folders excluded by vscode.
- Groups recently worked on files by issue/ticket.
- Define virtual groups inside your codebase.
- Sync groups between devices (work/home).

## What is new

- Define dynamic folders that are automatically populated based on glob patterns.
- Display files and folders excluded by vscode inside an "Excluded" folder.
- Automatically add a resource to a new focus group.
- Experimental: Add some limited file management capability. We don't want to replicate the explorer but
  some basic functionality is handy.

## Getting started

1. Expand the File Focus Explorer View.
2. Click the Add Icon (see image below). Type a name for your focus group.
3. As you work open the context menu in the file explorer or editor and select: Add to focus group.
4. You can also use "ctrl + shift + 8" to add the file open in the active editor to a focus group.

You can open files directly from a focus group. Folders added to a "focus group" can be navigated like any other folder.

![Adding the first Focus Group](https://github.com/quicken/filefocus/blob/master/resources/started.png?raw=true)

### Tips & Tricks

- Drag the File-Focus Tree above the File Explorer for a better experience as Focus Groups should only contain a few items.
- Alternatively, drag the File Focus Tree on to Left Hand Tab Bar.
- Pin a focus group to skip choosing a group when adding focus groups. For example, create a new group per ticket then pin the current ticket you are working on to automatically track files per ticket.

## Creating dynamic folders with glob patterns

Glob groups are shown inside "File Focus" as folders that are automatically populated with files that match a specific glob pattern.

The following example configures a folder named "Hidden Files" that automatically shows all hidden files inside workspaces but
excludes any hidden files inside any "node_modules" folder as well as the .git ignore folder and any files inside .git ignore.

Open the Vscode settings file and search for the property filefocus.globgroup then add the following item to the "globgroup" array:

```json
globgroup:[
  {
    "name":"Hidden Files",
    "include":["**/.*"],
    "exclude":["**/.git{,/**/*}","**/node_modules/**"],
    "recurse":true
  }
]
```

### Note:

It is possible to define multiple glob groups with different patterns for each group. Simply, add more items to the globgroup array with your configuration.

Also, currently, the extension uses the minimatch npm modules for globbing. Therefore, globbing works slightly differently to vscode globbing. If someone can find a way to use the same globbing as vscode that would be much better.

## Using project-specific focus groups.

Focus groups can be made available to all users of a project by manually creating a **.filefocus.json** file in the root of your workspace folders.

File Focus will merge the focus definition in all configuration files with the personally defined focus groups. The file focus extension does not write to this file. Therefore, any changes made to project focus groups will be lost after VS Code exits.

Currently, it is required that this file be manually created and populated.

The file has the following format:

### Example configuration file

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

### Note

It is possible to ignore groups defined by a .filefocus.json file in settings.

## Extension settings

### Use global storage

When enabled your manually created groups are stored inside the vscodes global storage system. If configured vscode will sync your manual groups to all your devices.

By default (disabled), manually created groups are stored in your workspace allowing you to define a different set of focus groups per workspace.

Toggling this option will NOT transfer groups between global and workspace storage.

### Sort key

Choose how resources are sorted.

| Option   | Description                                                                              |
| -------- | ---------------------------------------------------------------------------------------- |
| Basename | Sort resources only by the file name. Files with the same name will be grouped together. |
| Path     | Sort resources by the full path. Files with same path will be grouped..                  |

Sorting by path can be handy when grouping resources from multiple projects and you want to still keep project files together.

### Show project groups

When enabled the extension looks for a ".filefocus" file in the root of every workspace folder.

See the section: "Using project-specific focus groups." for more information.

### Add to pinned group on open

When enabled files are automatically added to a focus group when opened in the editor. This allows automatic tracking of files you are currently working on.

### Show excluded files group.

When enabled a dynamic group is shown that will contain all files and folders that match what has been defined inside the vscode exclude file.

Enabling this option may require a restart to pick up changes.

## Known issues

- Only one level of "focus groups" can be created.
- Status changes and Changes to the workspace might not be automatically reflected. Click the refresh icon in the File Focus Pane to reload focus groups.
- A pinned focus group is always shown on the top. This is currently by accident.
- Switching between global and local workspace storage does not transfer any focus groups.
- A project configuration file must be in the workspace root.
- The project configuration file must be created and edited manually.
- Some settings might require restarting vscode to be picked up.
- The extension will only work with files that are inside workspace folders.
- The excluded group might not match some items because the extension can't use the same globbing engine as vscode.
