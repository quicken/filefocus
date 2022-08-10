type ItemNode = {
  id: string;
  type: "group" | "folder" | "file";
  label: string;
  ref: string;
  children: ItemNode[];
};

/*
Each container is its own file. The idea is to reduce the total size of each file.
1) This should speed up working with a specific context.
2) Reduce the amount of data that needs to be synced.
3) Provides a clear indication of the root.

In version one there is no option to nest groups. Mainly because then we need the ability to drag and drop
to organise groups. Also, this avoids the challenge of working out which sub group to add new files to.

In other words the root structure represents a flat list of context files.
The + button in the tree root - creates an empty context file.

To avoid needing to open each file. The config file name is what is used as the label for the root
context.
*/

const config_example = {
  container: [
    {
      type: "group",
      ref: "E-Commerce",
      children: [
        {
          type: "file",
          ref: "/some/file/path.js",
        },
        {
          type: "file",
          ref: "/some/another/file/path/yawl.js",
        },
        {
          type: "folder",
          ref: "/some/another/path",
        },
      ],
    },
    {
      type: "folder",
      ref: "/some/path",
    },
    {
      type: "folder",
      ref: "/some/path/foo",
    },
  ],
};
