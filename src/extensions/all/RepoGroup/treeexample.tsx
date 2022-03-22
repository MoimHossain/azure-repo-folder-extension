import * as React from "react";
import { getItemProvider, ILocationTableItem } from "./TreeData";
import { Card } from "azure-devops-ui/Card";
import { ITreeColumn, ITreeRow, Tree } from "azure-devops-ui/TreeEx";
import { ITreeItemEx } from "azure-devops-ui/Utilities/TreeItemProvider";
import { renderExpandableTreeCell, renderTreeCell } from "azure-devops-ui/TreeEx";
import { ColumnMore } from "azure-devops-ui/Table";
import { MenuItemType } from "azure-devops-ui/Menu";
import { Images } from './../images/Images';

const folderIcon = (new Images()).getFolderIcon();
const repoIcon = (new Images()).getRepositoryIcon();

interface ITreeProps {
    root: any;
    repos: any;
    isAdminUser: boolean;
    onNodeSelected: any;
    onNodeClicked: any;
    onNewSubFolderClicked: any;
    onLinkReposClicked: any;
    deleteFolder: any
}


export default class TreeExample extends React.Component<ITreeProps> {
    constructor(props: ITreeProps) {
        super(props);
    }

    private getColumns() : any[] {
        const nameColumn = {
            id: "details",
            name: "Folder",
            renderCell: renderExpandableTreeCell,
            width: -100,
            minWidth: 400,
        };


        const moreColumn = new ColumnMore((listItem) => {            
            var menuItems:any[] = [
                { id: "newSubFolder", text: "New child folder" }
            ];
            if(listItem.underlyingItem 
                && listItem.underlyingItem.originalObjectRef
                && listItem.underlyingItem.originalObjectRef.path
                && listItem.underlyingItem.originalObjectRef.path.length > 0) {
                    menuItems.push({ id: "deleteFolder", text: "Delete" });
                }
            menuItems.push({ id: "divider", itemType: MenuItemType.Divider });
            menuItems.push({ id: "mapRepo", text: "Link Repos" });
            return {
                id: "sub-menu",
                onActivate: (menuItem, e) => {
                    if(menuItem.id === "newSubFolder") {
                        this.props.onNewSubFolderClicked();
                    } else if(menuItem.id === "mapRepo") {
                        this.props.onLinkReposClicked();
                    } else if(menuItem.id === "deleteFolder") {
                        this.props.deleteFolder(listItem);
                    }
                },
                items: menuItems
            };
        }, (listItem:any) => {
            if(this.props.isAdminUser === false) {
                return false;
            }
            if(listItem.underlyingItem 
                && listItem.underlyingItem.originalObjectRef 
                && listItem.underlyingItem.originalObjectRef.webUrl
                && listItem.underlyingItem.originalObjectRef.webUrl.length > 0) {
                    return false;
                }
            return true;
        });
        return [nameColumn, moreColumn];
    }

    private renderRepository() {
        return <img alt="" style={{ width: 24, height: 24}} src={repoIcon} />;
    }

    private renderFolder() {
        return <img alt="" style={{ width: 24, height: 24}} src={folderIcon} />;
    }

    public render(): JSX.Element {
        const itemProvider = getItemProvider(this.props.root, this.props.repos, this.renderRepository, this.renderFolder);
        return (
            <Card
                className="flex-grow bolt-card-no-vertical-padding bolt-table-card"
                contentProps={{ contentPadding: false }}
            >
                <Tree<ILocationTableItem>
                    ariaLabel="Basic tree"
                    columns={this.getColumns() as ITreeColumn<ILocationTableItem>[]}
                    itemProvider={itemProvider}
                    onToggle={(event, treeItem: ITreeItemEx<ILocationTableItem>) => {
                        itemProvider.toggle(treeItem.underlyingItem);
                    }}
                    onFocus={(event, treeItem: ITreeRow<ILocationTableItem>) => {
                        this.props.onNodeSelected(treeItem.data.underlyingItem);
                    }}
                    onSelect={(event, treeItem: ITreeRow<ILocationTableItem>) => {
                        this.props.onNodeClicked(treeItem.data.underlyingItem);
                    }}
                    scrollable={true}
                />
            </Card>
        );
    }
}

