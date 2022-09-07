import { Uri, workspace, WorkspaceFolder } from "vscode";
import { Resource } from "./global";

export class FocusUtil {
  public static arrayToUriList(value: string[]) {
    return value.reduce((previous, current, i, input) => {
      return previous + (input.length === i ? "" : "\r\n") + current;
    });
  }

  public static uriListToArray(value: string) {
    const regex = /\r/g;
    const tmp = value.replace(regex, "");
    return tmp.split("\n");
  }

  public static uriToResource(uri: Uri) {
    let resource: Resource;
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
