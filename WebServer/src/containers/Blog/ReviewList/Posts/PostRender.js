import React, { Component } from "react";
import Post from "../../../../components/Post/Post";

export default class PostRender extends Component {
    
    render() {
        const id = this.props.match.params.id;
        return <Post {...this.props} id={id} />
    }
}
