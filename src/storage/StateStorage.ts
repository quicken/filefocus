import { Uri } from "vscode";
import { StorageService } from "./StorageService";
import { FileFocusStorageProvider, Resource } from "../global";
import { Group } from "../Group";
import { FocusUtil } from "../FocusUtil";

type GroupStore = {
  [key: string]: GroupRecord;
};

type GroupRecord = {
  id: string;
  name: string;
  resources: Resource[];
  childGroups?: GroupRecord[]; // Nested child groups
  parentId?: string; // ID of parent group (if nested)
};

type DeprecateGroupStore = {
  [key: string]: DeprecateGroupRecord;
};

type DeprecateGroupRecord = {
  id: string;
  label: string;
};

/**
 * This class implement the funtionality to store group definitions
 * inside of VSCodes built in storage provider.
 */
export class StateStorage implements FileFocusStorageProvider {
  id = "statestorage";

  constructor(private storage: StorageService) {}

  public async loadRootNodes() {
    this.migrateStorageV1();

    const groupStore = this.storage.getValue<GroupStore>("groupmap", {});

    const storeMap = new Map(Object.entries(groupStore));
    const groups: Group[] = [];
    
    // First pass: Create all groups without establishing parent-child relationships
    const allGroups = new Map<string, Group>();
    for (const [groupId, groupRecord] of storeMap) {
      const group = this.createGroupFromRecord(groupRecord);
      allGroups.set(group.id, group);
    }
    
    // Second pass: Establish parent-child relationships and collect root groups
    for (const [groupId, groupRecord] of storeMap) {
      const group = allGroups.get(groupId);
      if (!group) {
        continue;
      }
      
      // If this group has child groups, add them
      if (groupRecord.childGroups) {
        for (const childRecord of groupRecord.childGroups) {
          const childGroup = allGroups.get(childRecord.id);
          if (childGroup) {
            group.addChildGroup(childGroup);
          }
        }
      }
      
      // If this is a root group (no parentId), add it to the result
      if (!groupRecord.parentId) {
        groups.push(group);
      }
    }

    return groups;
  }

  /**
   * Creates a Group object from a GroupRecord, including nested child groups.
   */
  private createGroupFromRecord(groupRecord: GroupRecord): Group {
    const group = new Group(groupRecord.id);
    // Ensure the name is always a string to prevent [object Object] issues
    group.name = typeof groupRecord.name === 'string' ? groupRecord.name : String(groupRecord.name || '');
    
    // Add resources
    for (const resource of groupRecord.resources) {
      const uri = FocusUtil.resourceToUri(resource);
      if (uri) {
        group.addResource(uri);
      }
    }

    return group;
  }

  public saveGroup(group: Group) {
    const groupRecord = this.createGroupRecord(group);

    let groupStore = this.storage.getValue<GroupStore>("groupmap", {});
    const storeMap = new Map(Object.entries(groupStore));
    
    // Save the group and all its descendants
    this.saveGroupRecordRecursive(storeMap, groupRecord);

    groupStore = Object.fromEntries(storeMap.entries());
    this.storage.setValue<GroupStore>("groupmap", groupStore);
  }

  /**
   * Creates a GroupRecord from a Group, including nested child groups.
   */
  private createGroupRecord(group: Group): GroupRecord {
    const childGroupRecords: GroupRecord[] = [];
    for (const childGroup of group.childGroups) {
      childGroupRecords.push(this.createGroupRecord(childGroup));
    }

    return {
      id: group.id,
      name: group.name,
      resources: group.resources.map((uri) => FocusUtil.uriToResource(uri)),
      childGroups: childGroupRecords.length > 0 ? childGroupRecords : undefined,
      parentId: group.parentGroup?.id,
    };
  }

  /**
   * Recursively saves a group record and all its children to the store map.
   */
  private saveGroupRecordRecursive(storeMap: Map<string, GroupRecord>, groupRecord: GroupRecord) {
    storeMap.set(groupRecord.id, groupRecord);
    
    if (groupRecord.childGroups) {
      for (const childRecord of groupRecord.childGroups) {
        this.saveGroupRecordRecursive(storeMap, childRecord);
      }
    }
  }

  public deleteGroupId(id: string) {
    let groupStore = this.storage.getValue<GroupStore>("groupmap", {});
    const storeMap = new Map(Object.entries(groupStore));
    
    // Recursively delete the group and all its children
    this.deleteGroupRecursive(storeMap, id);
    
    groupStore = Object.fromEntries(storeMap.entries());
    this.storage.setValue<GroupStore>("groupmap", groupStore);
  }

  /**
   * Recursively deletes a group and all its child groups from the store map.
   */
  private deleteGroupRecursive(storeMap: Map<string, GroupRecord>, groupId: string) {
    const groupRecord = storeMap.get(groupId);
    if (!groupRecord) {
      return;
    }
    
    // Delete all child groups first
    if (groupRecord.childGroups) {
      for (const childRecord of groupRecord.childGroups) {
        this.deleteGroupRecursive(storeMap, childRecord.id);
      }
    }
    
    // Delete the group itself
    storeMap.delete(groupId);
  }

  public async reset() {
    this.storage.deleteValue("groupmap");
  }

  /**
   * As a consequence of changing format in which data was stored
   * we needed a method for migrating the data of users using a previous
   * version of the extension. In theory we should be able to get rid
   * of this method when we feel like all users should have been upgraded.
   *
   * Without this method users would need to re-create their focus groups.
   *
   * @returns
   */
  migrateStorageV1() {
    const storeversion = this.storage.getValue<number>("storeversion", 0);
    if (storeversion > 0) {
      return;
    }

    let dstStore = this.storage.getValue<GroupStore>("groupmap", {});
    const dstMap = new Map(Object.entries(dstStore));

    const srcStore = this.storage.getValue<DeprecateGroupStore>(
      "groupstore",
      {}
    );
    const srcMap = new Map(Object.entries(srcStore));

    for (const [groupId, srcRecord] of srcMap) {
      const paths = this.storage.getValue<string[]>(`A-${srcRecord.id}`, []);
      const groupRecord: GroupRecord = {
        id: srcRecord.id,
        name: srcRecord.label,
        resources: paths.map((path) => {
          return FocusUtil.uriToResource(Uri.parse(path));
        }),
      };
      dstMap.set(groupRecord.id, groupRecord);
    }

    dstStore = Object.fromEntries(dstMap.entries());
    this.storage.setValue<GroupStore>("groupmap", dstStore);

    /* Now delete old values. */
    for (const [groupId, srcRecord] of srcMap) {
      this.storage.deleteValue(`A-${srcRecord.id}`);
    }
    this.storage.deleteValue("groupstore");
    this.storage.setValue<number>("storeversion", 1);
  }
}
