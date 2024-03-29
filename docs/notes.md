# Developer Notes

Below is a loose collection of notes related to working with the code base.

## VSCode API Docs

- API Reference: https://code.visualstudio.com/api
- Icon Reference: https://code.visualstudio.com/api/references/icons-in-labels#icon-listing

## To-Do

By default, all root resources are rendered as a flat view. However, it would be good to also
have a feature that automatically organizes root resources as a tree. For example:
given a group "Focus" with the resources: src/tree/Group.ts, docs/readme.md and src/lib/util.ts
the default is to render the resources flat such as:

Group.ts
readme.md
util.ts

With a new option "tree" the extension would render the resources as:

```
{workspacename} |- src
                    |-tree
                         |- Group.ts
                    |-lib
                         |- util.ts
                |-docs
                    |- readme.md
```

For this to work we might need another type of FocusItem, such as "virtualFolder". Or, it may be possible to just render the root of each folder as normal and then filter out any resources that have not been added to the group.

Since resources can only be added to the root of a group folders are already represented as as a tree. Therefore, we only need to consider organizing files added to the root into virtual folders.

One approach may be to iterate over all roots that are files and to extract the 1st path element which would yield: [src, docs]. src and docs would be rendered as virtual folder tree items. Expanding src we would again iterate over all file resources. Any resource matching /src/ would be rendered as a normal root item and our next virtual folders would yield: [src/tree,src/lib]. Expanding src/lib would then just render items.

## About root items files and subfolders

Since groups are virtual they do not have a URI that maps to any filesystem. Also, having the ability to add both files and folders to a group brings about the need to distinguish between files and folders that have been added to a group from those that are within a subfolder. Items that have been added to a group are designated as Root items.

In regards to renaming, renaming files and folders that are within sub folders is straight forward as we can just rename the file/folder in the file system and we are done.

However, renaming root resources is challenging as renaming a resource in the file system will orphan any groups that the item has been added to.

Now, orphans are not necessarily bad and in some cases desirable for example when syncing groups across devices/workspaces you may very well want to have a group that references some common files that may not necessarily exist in all workspaces being worked on.

My current thinking is that renaming a resource in a specific group should not alter mappings in any other group even if it does orphan files.

## Context Ids

One of the challenges is correctly decorating the various tree items with the correct icons and menu context based on the
various types of groups.

As it stands there are the following different permutations.

| Command               | User Group | User File | User Folder | Read Only Group | Read Only File | Read Only Folder |
| --------------------- | ---------- | --------- | ----------- | --------------- | -------------- | ---------------- |
| Open Group            | yes        | no        | no          | yes             | no             | no               |
| Pin Group             | yes        | no        | no          | no              | no             | no               |
| Remove Group          | yes        | no        | no          | no              | no             | no               |
| Rename Group          | yes        | no        | no          | no              | no             | no               |
| Remove Group Resource | yes        | yes       | yes         | no              | no             | no               |
| Create File Folder    | yes        | no        | yes         | no              | no             | no               |
| Rename File Object    | no         | yes       | yes         | no              | no             | no               |

### Notes:

A user can only add files and folders at the root of a focus group. When a folder is added to a focus group the extension enables the user to browse all subfoldes and files within those "real" folders. As such when affording users the option to remove resources we need to be able to distinguish between items in the group root and items
that are nested inside a real folder. Currently, we do this by embedding the keyword Root in the contextid.

| Name            | Description                                                                                                |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| GroupItem       | This item represents a Group. (FileFocus group)                                                            |
| FocusItemRoot   | We do not know if this is a file or folder or a missing resource but the resource is in the Group Root.    |
| FocusItem       | We do not know if this is a file or folder or a missing resource but the resource is inside a real folder. |
| FocusFileRoot   | This is a file in the group root.                                                                          |
| FocusFile       | This is a file inside a real folder.                                                                       |
| FocusFolderRoot | This is a folder in the group root.                                                                        |
| FocusFolder     | This is a folder inside a real folder.                                                                     |
