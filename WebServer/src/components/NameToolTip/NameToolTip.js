import React, { Component } from "react";
import ReactTooltip from 'react-tooltip'
import '../NameToolTip/NameToolTip.css'

export default class NameToolTip extends Component {

    render(){
        return <ReactTooltip id={this.props.target} place="bottom" effect="float" type='light' globalEventOff='click' border={true} className="NameToolTip_Border">
            <div className="NameToolTip">
                {this.props.content}
            </div>
        </ReactTooltip>
    }
};
