# Developer Notes

Below is a loose collection of notes related to working with the code base.

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

A user can only add files and folders at the root of a focus group. When a folder is added to a focus group the extension enables the user to browse all subfoldes and files within those "real" folders. As such when affording user the option to remove resources we need to be able to distinguish between items in the group root and items
that are nested inside a real folder. Currently, we do this by embedding the keyword Root in the context id.

| Name            | Description                                                                                                |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| GroupItem       | This item represents a Group. (FileFocus group)                                                            |
| FocusItemRoot   | We do not know if this is a file or folder or a missing resource but the resource is in the Group Root.    |
| FocusItem       | We do not know if this is a file or folder or a missing resource but the resource is inside a real folder. |
| FocusFileRoot   | This is a file in the group root.                                                                          |
| FocusFile       | This is a file inside a real folder.                                                                       |
| FocusFolderRoot | This is a folder in the group root.                                                                        |
| FocusFolder     | This is a folder inside a real folder.                                                                     |
