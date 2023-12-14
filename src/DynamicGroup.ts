import { Uri } from "vscode";
import { Group } from "./Group";

type ResourceProvider = () => Promise<Uri[]>;

/**
 * A DynamicGroup is a collection of resources that are dynamically
 * calculated based on some rules.
 */
export class DynamicGroup extends Group {
  private _resourceProvider: ResourceProvider;

  /**
   * @param id The identifier for this group.
   * @param resourceProvider A function that returns the resources for this group.
   */
  constructor(public readonly id: string, resourceProvider: ResourceProvider) {
    super(id);
    this.readonly = true;
    this._resourceProvider = resourceProvider;
  }

  /**
   * Refreshes the resources inside the group.
   */
  public async refresh() {
    const foundResources = await this._resourceProvider();
    this.clearResources();
    for (const uri of foundResources) {
      this.addResource(uri);
    }
  }
}
