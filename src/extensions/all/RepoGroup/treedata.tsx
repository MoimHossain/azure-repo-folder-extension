import { ISimpleListCell } from "azure-devops-ui/List";
import { MenuItemType } from "azure-devops-ui/Menu";
import { ColumnMore, ISimpleTableCell } from "azure-devops-ui/Table";

import {
    ITreeItem,
    ITreeItemProvider,
    TreeItemProvider,
} from "azure-devops-ui/Utilities/TreeItemProvider";

export interface ILocationTableItem extends ISimpleTableCell {
    details: ISimpleListCell
}



function getRepoNodes(repos:any, path:any, repoRender:any) : Array<ITreeItem<ILocationTableItem>> {
    const repoNodes: Array<ITreeItem<ILocationTableItem>> = [];

    if(repos && repos.length > 0) {
        repos.forEach((repo:any)  => {
            
            if(repo.folder === path) {
                const repoNode = {
                    data: {
                        details: { text: repo.name, iconProps: { render: repoRender } }
                    },
                    originalObjectRef: repo,
                    childItems: [],
                    expanded: true
                };
                repoNodes.push(repoNode);
            }
            
        });
    }

    return repoNodes;
}

function getChildNodes(folders:any, repos: any, repoRender:any, renderFolder:any): Array<ITreeItem<ILocationTableItem>> {
    const folderNodes: Array<ITreeItem<ILocationTableItem>> = [];
    if(folders && folders.length > 0) {
        folders.forEach((folder: any) => {

            let childFolderNodes = getChildNodes(folder.folders, repos, repoRender, renderFolder);

            getRepoNodes(repos, folder.path, repoRender).forEach(rNode => childFolderNodes.push(rNode) );

            const folderNode = {
                data: {
                    details: { text: folder.name, iconProps: { render: renderFolder } }
                },
                originalObjectRef: folder,
                childItems: childFolderNodes,
                expanded: true
            };
            folderNodes.push(folderNode);

        });
    }
    return folderNodes;
}

export function getItemProvider(root: any, repos: any, repoRender:any, renderFolder:any): ITreeItemProvider<ILocationTableItem> {
    let rootItems: Array<ITreeItem<ILocationTableItem>> = [];

    if(root && root.folders && root.folders.length > 0) {
        rootItems = getChildNodes(root.folders, repos, repoRender, renderFolder);
    }

    return new TreeItemProvider<ILocationTableItem>(rootItems);
}
