import * as React from "react";
import { ITableColumn, Table } from "azure-devops-ui/Table";
import { ListSelection } from "azure-devops-ui/List";
import {
    ColumnMore,
    ColumnSelect,
    ISimpleTableCell,
    renderSimpleCell,
    TableColumnLayout,
} from "azure-devops-ui/Table";
import { ObservableValue, IObservableArrayEventArgs, ObservableArrayAction } from "azure-devops-ui/Core/Observable";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import { ISimpleListCell } from "azure-devops-ui/List";
import { Images } from '../images/Images';

const repoIcon = (new Images()).getRepositoryIcon();

interface ITableItem extends ISimpleTableCell {
    name: ISimpleListCell;
    originalObjectRef: any
}

interface IRepoTableProps {
    repos: any[];
    onRepoSelected: (selectedRepos: any[]) => void;
}

const checkboxColumns = [
    new ColumnSelect(),
    {
        id: "name",
        name: "Repos",
        readonly: true,
        renderCell: renderSimpleCell,
        width: new ObservableValue(-30),
    }
];

export default class RepoTable extends React.Component<IRepoTableProps> {
    private selection = new ListSelection({ selectOnFocus: false, multiSelect: true });

    constructor(props: IRepoTableProps) {
        super(props);
    }

    private onSelect(event: React.SyntheticEvent<HTMLElement>, tableRow: any):  void {

        if(this.selection.value && this.selection.value.length > 0) {
            const selectedRepos:any[] = [];
            this.selection.value.forEach(range => {
                for(var i = range.beginIndex; i<= range.endIndex; ++i) {
                    selectedRepos.push(this.props.repos[i]);
                }
            });
            this.props.onRepoSelected(selectedRepos);
        }
    }

    private renderRepository() {
        return <img alt="" style={{ width: 24, height: 24}} src={repoIcon} />;
    }

    private getItems() : ArrayItemProvider<ITableItem> {
        const rawTableItems: ITableItem[] = [];
        const renderIcon = this.renderRepository.bind(this);

        if(this.props.repos && this.props.repos.length) {
            this.props.repos.forEach(repo => {
                rawTableItems.push({
                    originalObjectRef: repo,
                    name: { iconProps: { render: renderIcon }, text: repo.name },
                });
            });
        }

        return new ArrayItemProvider<ITableItem>(rawTableItems);
    }

    public render(): JSX.Element {        
        
        return (
            <Table
                ariaLabel="Table with checkboxes"
                className="table-example"
                columns={checkboxColumns as ITableColumn<ISimpleTableCell>[] }
                containerClassName="h-scroll-auto"
                itemProvider={this.getItems()}
                selection={this.selection}
                onSelect={this.onSelect.bind(this)}
                role="table"
            />
        );
    }
}

