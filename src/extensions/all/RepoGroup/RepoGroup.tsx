import * as React from "react";
import { Page } from "azure-devops-ui/Page";
import { Card } from "azure-devops-ui/Card";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { IHeaderCommandBarItem } from "azure-devops-ui/HeaderCommandBar";
import { Panel } from "azure-devops-ui/Panel";
import { showRootComponent } from "../../Common";

import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { TextField, TextFieldWidth } from "azure-devops-ui/TextField";
import { FormItem } from "azure-devops-ui/FormItem";

import * as SDK from "azure-devops-extension-sdk";
import { CommonServiceIds, getClient, IProjectPageService, IHostNavigationService } from "azure-devops-extension-api";
import { Animation } from '../images/Animation';

import { GitRestClient } from "azure-devops-extension-api/Git";
import { ExtensionManagementRestClient } from "azure-devops-extension-api/ExtensionManagement";
import { GraphRestClient } from "azure-devops-extension-api/Graph";
import TreeExample from './treeexample';
import RepoTable from './RepoTable';

interface IRepositoryState {
    linkRepoDialogOpen: boolean;
    folderDialogOpen: boolean;
    folderName: string;
    root: any;
    selectedNode: any;
    repos: any[];
    selectedRepos: any[];
    isAdminUser: boolean;
    loading: boolean;
}

let DOC:any = {
    repoLinkDocId: '01a3373b-4d3a-4121-9f07-0f8ec23ab4e4',
    folderDocId: '6ec930d5-d9e9-4279-bf66-0d55fd00f6ca',
    publisher: "MoimHossain",
    extension: "rabox-extension",
    scopeType: "Default",
    scopeValue: "Current",
    collection: "common",
};

class RepositoryHubContent extends React.Component<{}, IRepositoryState> {   

    constructor(props: {}) {
        super(props);
        this.state = {
            root: {
                folders: []
            },
            loading: true,
            repos: [],
            selectedNode: null,
            folderDialogOpen: false,
            linkRepoDialogOpen: false,
            selectedRepos: [],
            isAdminUser: false,
            folderName: ""
        };
    }
    
    private async onNodeClicked(data:any) {
        if(data && data.originalObjectRef && data.originalObjectRef.webUrl) {
            const navService = await SDK.getService<IHostNavigationService>(CommonServiceIds.HostNavigationService);
            navService.navigate(data.originalObjectRef.webUrl);
        }
    }

    public async componentDidMount() {
        await SDK.init();
        await this.loadDataAsync();
    }

    private async saveRepoLinks() {
        this.setState({ loading : true });
        const selectedNode = this.state.selectedNode;
        if(this.state.selectedRepos && this.state.selectedRepos.length > 0
            && selectedNode && selectedNode.originalObjectRef) {
            this.state.selectedRepos.forEach(repo => {
                repo.folder = selectedNode.originalObjectRef.path;
            });


            let documentToUpdate = await this.getRepoLinkDocument();
            documentToUpdate.repos = this.state.repos; 
            await this.updateRepoLinkDocument(documentToUpdate);

            this.setState({ linkRepoDialogOpen: false, selectedRepos: [] });
        }
        this.setState({ loading : false });
    }



    private async updateRepoLinkDocument(documentToUpdate:any) {
        const extensionClient = getClient(ExtensionManagementRestClient);
        const docInfo = await extensionClient.setDocumentByName(documentToUpdate, DOC.publisher, DOC.extension, DOC.scopeType, DOC.scopeValue, DOC.collection);
        console.log("Document updated")
        console.log(docInfo)
    }

    private async getRepoLinkDocument() {
        const extensionClient = getClient(ExtensionManagementRestClient);
        let doc: any;
        try {
            doc = await extensionClient.getDocumentByName(DOC.publisher, DOC.extension, DOC.scopeType, DOC.scopeValue, DOC.collection, DOC.repoLinkDocId);
            console.log("Found existing repo link document")
            console.log(doc)
        }
        catch {
            doc = {id : DOC.repoLinkDocId };
            console.log("Creating new repo link document")
            console.log(doc)
        }
        return doc;
    }

    private async updateFolderDocument(documentToUpdate:any) {
        const extensionClient = getClient(ExtensionManagementRestClient);
        const docInfo = await extensionClient.setDocumentByName(documentToUpdate, DOC.publisher, DOC.extension, DOC.scopeType, DOC.scopeValue, DOC.collection);
        console.log("Document updated")
        console.log(docInfo)
    }

    private async getFolderDocument() {
        const extensionClient = getClient(ExtensionManagementRestClient);
        let doc: any;
        try {
            doc = await extensionClient.getDocumentByName(DOC.publisher, DOC.extension, DOC.scopeType, DOC.scopeValue, DOC.collection, DOC.folderDocId);
            console.log("Found existing folder document")
            console.log(doc)
        }
        catch {
            doc = {id : DOC.folderDocId };
            console.log("Creating new folder document")
            console.log(doc)
        }
        return doc;
    }

    private onLinkReposClicked() : void {
        const selectedNode = this.state.selectedNode;
        if(selectedNode && selectedNode.originalObjectRef) {

            this.setState({
                selectedRepos: [],
                linkRepoDialogOpen: true
            });   
        }
    }

    private async saveFolder() {
        this.setState({ loading : true });
        const fName = this.state.folderName;
        const root = this.state.root;
        const selectedNode = this.state.selectedNode;
        if(fName.length > 0) {            
            if(selectedNode && selectedNode.originalObjectRef) {
                selectedNode.originalObjectRef.folders.push({
                    name: fName,
                    path: (selectedNode.originalObjectRef.path + '/' + fName),
                    folders: []
                });
            } else {
                root.folders.push({
                    name: fName,
                    path: ('/' + fName),
                    folders: []
                });    
            }
            

            let documentToUpdate = await this.getFolderDocument();
            documentToUpdate.folderStructure = root;            
            await this.updateFolderDocument(documentToUpdate);

            this.setState({ 
                folderDialogOpen: false,
                folderName: '', 
                root: root
            });
        }        
        this.setState({ loading : false });
    }

    private async deleteFolder(listItem:any) {
        const root = this.state.root;
        this.setState({ loading : true });
        this.deepSearchAndDelete(root, listItem.underlyingItem.originalObjectRef);

        let documentToUpdate = await this.getFolderDocument();
        documentToUpdate.folderStructure = root;            
        await this.updateFolderDocument(documentToUpdate);

        this.setState({ root: root, loading : false });        
    }

    private deepSearchAndDelete(folderObject:any, itemToDelete:any) {        
        if(folderObject
            && folderObject.folders
            && folderObject.folders.length > 0 ) {
                var findex = folderObject.folders.indexOf(itemToDelete);
                if(findex > -1) {
                    console.log("Deleting item on index: " + findex);
                    folderObject.folders.splice(findex, 1);
                } else {
                    folderObject.folders.forEach((ch:any) => {
                        this.deepSearchAndDelete(ch, itemToDelete);
                    });
                }
            }
    }

    private onNewSubFolderClicked() : void {
        this.setState({
            folderDialogOpen: true
        });
    }



    private onNodeSelected(data:any) {
        if(data) {
            this.setState({
                selectedNode: data 
            });
        }
    }

    private onRepoSelected(selectedRepos: any[]) {
        if(selectedRepos && selectedRepos.length > 0) {
            this.setState({
                selectedRepos: selectedRepos
            });

            console.log(selectedRepos);
        }
    }

    public render(): JSX.Element {


        return (
            <Page className="sample-hub flex-grow">

                <Header title="Tribe Repos"
                    commandBarItems={this.getCommandBarItems()}
                    description="List of Repositories in tribe"
                    titleSize={TitleSize.Large} />

                {
                    this.state.linkRepoDialogOpen === true && 
                    <Panel
                        onDismiss={()=> this.setState({ linkRepoDialogOpen: false }) }
                        footerButtonProps={this.getRepoFooterButtons()}
                        description={ "Folder: " +  this.state.selectedNode.originalObjectRef.path}
                        titleProps={{  text: "Link Repositories" }}>
                            <RepoTable repos={this.state.repos} onRepoSelected={this.onRepoSelected.bind(this)} />
                    </Panel>
                }

                {
                    this.state.folderDialogOpen === true &&
                    <Panel
                        onDismiss={() => this.setState({ folderDialogOpen: false })}
                        footerButtonProps={this.getButtons()}
                        titleProps={{ text: "New folder" }} >

                        <FormItem label="Folder Name:">
                            <TextField
                                value={this.state.folderName}
                                readOnly={false}
                                spellCheck={false}
                                required={true}
                                onChange={(e, newValue) => {
                                    this.setState({ folderName: newValue });
                                }}
                                placeholder="Folder Name"
                                width={TextFieldWidth.standard}
                            />
                        </FormItem>

                    </Panel>
                }

                <div className="page-content page-content-top flex-column rhythm-vertical-16">
                    <Card
                        className="flex-grow bolt-card-no-vertical-padding bolt-table-card"
                        contentProps={{ contentPadding: false }}
                    >
                        { this.state.loading === true && <Animation /> }
                        <TreeExample 
                            isAdminUser={this.state.isAdminUser}
                            root={this.state.root} 
                            repos={this.state.repos}
                            deleteFolder={this.deleteFolder.bind(this)}
                            onLinkReposClicked={this.onLinkReposClicked.bind(this)}
                            onNewSubFolderClicked={this.onNewSubFolderClicked.bind(this)}
                            onNodeClicked={this.onNodeClicked.bind(this)}
                            onNodeSelected={this.onNodeSelected.bind(this)} />
                        
                    </Card>
                </div>
            </Page>
        );
    }

    private getRepoFooterButtons() {
        const items = [];
        items.push({ text: "Cancel", onClick: () => this.setState({ linkRepoDialogOpen: false }) });
        if (this.state.selectedRepos.length > 0) {
            items.push({ text: "Save", onClick: async () => await this.saveRepoLinks() });
        }
        return items;        
    }

    private getButtons() {
        const items = [];
        items.push({ text: "Cancel", onClick: () => this.setState({ folderDialogOpen: false }) });
        if (this.state.folderName.length > 0) {
            items.push({ text: "Save", onClick: async () => await this.saveFolder() });
        }
        return items;
    }

    private getCommandBarItems(): IHeaderCommandBarItem[] {
        const items = [];
        items.push({
            id: "panel",
            text: "Folder",
            onActivate: () => { this.setState({ folderDialogOpen: true, selectedNode: null }) },
            iconProps: {
                iconName: 'Add'
            },
            isPrimary: true,
            tooltipProps: {
                text: "Create a root level folder"
            }
        });
        return items;
    }

    private getMappedFolderFromRepo(mapDoc:any, repoID:any):any {
        var mappedFolder = '';
        if(mapDoc && mapDoc.repos && mapDoc.repos.length) {
            mapDoc.repos.forEach((mapRepo:any) => {
                if(mapRepo.id === repoID) {
                    mappedFolder = mapRepo.folder;
                }                
            });
        }
        return mappedFolder;
    }

    private async loadDataAsync(): Promise<void> {
        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project = await projectService.getProject();
        if (project) {

            const currentUser = SDK.getUser();            
            const graphClient = getClient(GraphRestClient);                        
            const memberships = await graphClient.listMemberships(currentUser.descriptor);            
            const sds: any[] = [];
            memberships.forEach(member=> {
                sds.push({ descriptor: member.containerDescriptor });
            });
            const groups = await graphClient.lookupSubjects({ lookupKeys: sds });
            const targetDomain = "vstfs:///Classification/TeamProject/" + project.id;
            for (var key in groups) {
                const gp = groups[key] as any;
                if(gp.domain === targetDomain && gp.displayName === "Project Administrators") {
                    this.setState({ isAdminUser : true });
                    console.log("Following user is member of following admin group: ");
                    console.log(currentUser);
                    console.log(gp);
                }
            }


            DOC.repoLinkDocId = "REPOLINK-" + project.id;
            DOC.folderDocId = "FOLDERSTR-" + project.id;
            const client = getClient(GitRestClient);
            const repositories = await client.getRepositories(project.id);
            const repos: any[] = [];
            const repoWithFolderLinks = await this.getRepoLinkDocument();
            if(repositories && repositories.length > 0) {
                repositories.forEach(repo => {
                    repos.push({
                        id: repo.id,
                        name: repo.name,
                        webUrl: repo.webUrl,
                        folder: this.getMappedFolderFromRepo(repoWithFolderLinks, repo.id)
                    });
                });
            }
            this.setState({ repos: repos });
            let folderDoc = await this.getFolderDocument();
            if(folderDoc.__etag) {
                this.setState({ root: folderDoc.folderStructure });
            }
        }
        this.setState({ loading : false });
    }
}
showRootComponent(<RepositoryHubContent />);