import * as React from "react";

export interface IAnimation {
    imagePath?:string
}

export class Animation extends React.Component<{}, IAnimation> {

    constructor(props: {}) {
        super(props);

        this.state = {
            imagePath: `${this.getBasePath()}/assets/images/loading.gif`
        };
    }

    private getBasePath() {
        const url = window.location.href;
        const baseUrl = url.substr(0, url.indexOf("/dist/"));
        return baseUrl;
    }

    public componentDidMount() {

    }


    public render(): JSX.Element {

        return (
            <img style={{ width: 32, height: 32 }} src={this.state.imagePath} />
        );
    }
}