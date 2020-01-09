import React, { Component } from "react";
import { FormattedMessage  } from 'react-intl';
import { Switch, Route, Redirect, Link } from "react-router-dom";

import anime from 'animejs/lib/anime.es.js';
import Asks from "./Asks/Asks.js";
import Posts from "./Posts/Posts.js";
import PostRender from "./Posts/PostRender.js";
import './ReviewList.css';

export default class ReviewList extends Component {

    constructor(props){
        super(props);
        this.state = {
            provide_focus : true,
            navbar_hidden : false,
            underline_x : 0,
            underline_width : 90,
        };
        // create ref to get x
        this.provide_ref = React.createRef();
        this.ask_ref = React.createRef();
    }

    set_bar_hidden = (is_hidden) =>{
        if(is_hidden !== this.state.navbar_hidden)
            if(this.isMount)
                this.setState({navbar_hidden : is_hidden})
    }
    
    path_recheck = () => {

        // update props
        this.calculate_underline_offset();

        // use the path now to determine is the NavBar needed.
        let path = this.props.location.pathname;

        this.setState({underline_x : this.start_x , underline_width: this.start_w});
        if( path === "/review_list/posts" || path === "/review_list" ){
            this.setState({ provide_focus : true });
        }else if( path === "/review_list/asks"){
            // this.setState({ provide_focus : false, underline_x: this.start_x})
            this.set_provide_focus(false);
            this.set_bar_hidden(false);
        }else{
            this.set_bar_hidden(true);
        }

    }
    set_anime_underline = (end_x, end_w) => {
        let prop = { x: this.state.underline_x , w: this.state.underline_width };
        anime({
            targets: prop,
            x : end_x,
            w : end_w,
            duration: 500,
            easing: 'spring(1, 30, 10, 0)',
            update: () => {
                if(!this.isMount)
                    return;
                this.setState({
                    underline_x: prop.x, 
                    underline_width: prop.w
                });
            }
        });
    }
    set_provide_focus = (provide_focus) => {
    
        if(this.state.provide_focus !== provide_focus){
            if(this.state.provide_focus){
                this.set_anime_underline(this.end_x,this.end_w);
            }else{
                this.set_anime_underline(this.start_x,this.start_w);
            }
            this.setState({provide_focus:provide_focus})
        }
    }

    calculate_underline_offset= () => {

        let provide_rect = this.provide_ref.current.getBoundingClientRect();
        let ask_rect = this.ask_ref.current.getBoundingClientRect();
        this.start_w = provide_rect.width * 0.7;
        this.end_w = ask_rect.width * 0.7;
        this.start_x = provide_rect.x + (provide_rect.width - this.start_w)/2;
        this.end_x = ask_rect.x + (ask_rect.width - this.end_w)/2;
    }

    componentDidMount(){
        // if component did mount, path check again (For F5 page)

        this.isMount = true;
        this.path_recheck();

    }
    componentWillUnmount(){
        this.isMount = false;
    }
    componentDidUpdate(){
        
        // Exception: update check path
        let path = this.props.location.pathname;
        if( path === "/review_list/posts" ){
            this.set_bar_hidden(false); 
            this.set_provide_focus(true);
        }

        let sw = this.start_w, ew = this.end_w;
        this.calculate_underline_offset();
        if(this.start_w !== sw || this.end_w !== ew){
            this.set_anime_underline(
                this.state.provide_focus ? this.start_x:this.end_x,
                this.state.provide_focus ? this.start_w:this.end_w
            );
        }
    }

    render() {
        return (
            <div className="Review_List">
                <div hidden={this.state.navbar_hidden} className="NavBar">
                    <Link to="/review_list/posts" onClick={()=>{this.set_provide_focus(true)}} style={{ textDecoration: 'none' }}>
                        <div className={!this.state.provide_focus? "tabItem lefttab" : "tabSelectItem lefttab"}>
                            <div ref={this.provide_ref}>
                                <FormattedMessage id="provide_feedback" />
                            </div>
                        </div>
                    </Link>
                    <Link to="/review_list/asks" onClick={()=>{this.set_provide_focus(false)}} style={{ textDecoration: 'none' }}>
                        <div className={this.state.provide_focus? "tabItem" : "tabSelectItem"}>
                            <div ref={this.ask_ref}>
                                <FormattedMessage id="ask_for_feedback" />
                            </div>
                        </div>
                    </Link>
                </div>
                <div className="underlineparent">
                    <div style={{position:"absolute" , left: this.state.underline_x, margin:"0px", width:this.state.underline_width+"px"}}hidden={this.state.navbar_hidden} className="barunderline" />
                </div>
                <div>
                    <div>
                    <Switch>

                        <Redirect exact from="/review_list" to="/review_list/posts" />
                        <Route exact path="/review_list/asks" component={Asks} />
                        <Route exact path="/review_list/posts" render={
                            () => <Posts set_bar_hidden={this.set_bar_hidden} />} />
                        <Route path="/review_list/provide/" render={
                            (props) => <PostRender {...props} set_bar_hidden={this.set_bar_hidden} />} />                            
                   
                    </Switch>
                    </div>
                </div>
            </div>
        );
    }
}
