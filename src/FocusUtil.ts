import { Uri, workspace, WorkspaceFolder } from "vscode";
import { Resource } from "./global";

/**
 * A collection of static classes for working with file focus resources.
 */
export class FocusUtil {
  /**
   * Converts an array of file paths to a list of file paths where each path is
   * seperated by \r\n. This is the format in use by the VSCode Drag & Drop mechanism.
   * @param value An array of file paths.
   * @returns A list of file paths seperated by \r\n
   */
  public static arrayToUriList(value: string[]) {
    return value.reduce((previous, current, i, input) => {
      return previous + (input.length === i ? "" : "\r\n") + current;
    });
  }

  /**
   * Converts a list of file paths seperated by \r\n to an array of file paths. The
   * VSCode Drag & Drop mechanism utilises this special list format.
   * @param value A list of file paths seperated by \r\n
   * @returns An array of file paths.
   */
  public static uriListToArray(value: string) {
    const regex = /\r/g;
    const tmp = value.replace(regex, "");
    return tmp.split("\n");
  }

  /**
   * Converts a VSCode Uri to a File Focus Resource.
   *
   * Note: The file focus resource is relative to a workspace. While the URI is an
   * absolute location on the machine.
   *
   * @param uri The uri that should be converted.
   * @returns A file focus resource.
   */
  public static uriToResource(uri: Uri) {
    let resource: Resource;

    /* Convert remote path to file path. This fixes paths inside WSL. */
    if (uri.scheme === "vscode-remote") {
      uri = Uri.file(uri.path);
    }

    const workspaceName = workspace.getWorkspaceFolder(uri)?.name;
    if (workspaceName) {
      resource = {
        workspace: workspaceName,
        path: workspace.asRelativePath(uri, false),
      };
    } else {
      resource = {
        workspace: "",
        path: uri.toString(),
      };
    }

    return resource;
  }

  /**
   * Converts a File Focus Resource to a VSCode Uri.
   *
   * Note: The file focus resource is relative to a workspace. While the URI is an
   * absolute location on the machine.
   *
   * @param resource The file focus resource that should be converted to a URI.
   * @param test? Only for use in unit testing. Allows passing in an array of workspace folder for UNIT Testing.
   *              by default the function utilises the vscode workspace.workspaceFolders property.
   * @returns A vscode URI.
   */
  public static resourceToUri(resource: Resource, test?: WorkspaceFolder[]) {
    if (!resource.workspace) {
      return Uri.parse(resource.path);
    }

    const workspaceFolders = test ? test : workspace.workspaceFolders;

    /*
    For a single folder workspace, the workspace folder name is ignored.
    This allows resources to be resolved accross other single folder workspaces.
    */
    if (workspaceFolders?.length === 1) {
      return Uri.joinPath(workspaceFolders[0].uri, resource.path);
    }

    /*
    For a multi folder workspace, a resource must be matched against a specific workspace.
    this allows focus groups to contain resources from multiple workspaces.
    */
    const workspaceUri = FocusUtil.getWorkspaceUriByName(
      resource.workspace,
      test
    );
    if (workspaceUri) {
      return Uri.joinPath(workspaceUri, resource.path);
    }

    return undefined;
  }

  /**
   * Determines the URI of the given workspaces root folder.
   *
   * @param name The name of the workpace for which the root URI is to be determined.
   * @param test? Only for use in unit testing. Allows passing in an array of workspace folder for UNIT Testing.
   *              by default the function utilises the vscode workspace.workspaceFolders property.
   * @returns The UIR of the workspace root. Returns undefined if the given workspace can not be found.
   */
  public static getWorkspaceUriByName(name: string, test?: WorkspaceFolder[]) {
    const workspaceFolders = test ? test : workspace.workspaceFolders;

    if (workspaceFolders) {
      for (const ws of workspaceFolders) {
        if (ws.name === name) {
          return ws.uri;
        }
      }
    }

    return undefined;
  }
}
