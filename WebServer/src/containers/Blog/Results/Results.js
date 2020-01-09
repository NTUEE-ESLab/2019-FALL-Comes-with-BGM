import cookie from 'react-cookies'
import React, { Component } from "react";
import { FormattedMessage  } from 'react-intl';
import { Switch, Route, Redirect, Link } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem } from 'reactstrap'
import anime from 'animejs/lib/anime.es.js';

import EmployeeView from "./EmployeeView/EmployeeView.js";
import EmployerView from "./EmployerView/EmployerView.js";
import ResultList from "./EmployerView/ResultList.js";

import './Results.css';
import '../ReviewList/ReviewList.css'
import ReviewRender from "./EmployerView/ReviewRender.js";

export default class Results extends Component {

    constructor(props){
        super(props);
        this.state = {
            me_focus : true,
            navbar_hidden : false,
            underline_x : 0,
            underline_width : 90,
            username : "Unknown",
        };
        // create ref to get x
        this.me_ref = React.createRef();
        this.employee_ref = React.createRef();

        // bind to children
        this.set_username = this.set_username.bind(this);

    }
    
    set_bar_hidden = (is_hidden) =>{
        if(this.isMount)
            this.setState({navbar_hidden : is_hidden})
    }

    path_recheck = () => {

        // update props
        this.calculate_underline_offset();

        // use the path now to determine is the NavBar needed.
        let path = this.props.location.pathname;

        this.setState({underline_x : this.start_x , underline_width: this.start_w});
        if( path === "/results/employeeview" || path === "/results" ){
            this.setState({ me_active : true });
        }else if( path === "/results/employerview"){
            this.set_me_focus(false);
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

    set_me_focus = (me_focus) => {
    
        if(this.state.me_focus !== me_focus){
            if(this.state.me_focus){
                this.set_anime_underline(this.end_x,this.end_w);
            }else{
                this.set_anime_underline(this.start_x,this.start_w);
            }
            this.setState({me_focus:me_focus})
        }
    }

    calculate_underline_offset= () => {

        let me_rect = this.me_ref.current.getBoundingClientRect();
        let employee_rect = this.employee_ref.current.getBoundingClientRect();
        this.start_w = me_rect.width * 0.7;
        this.end_w = employee_rect.width * 0.7;
        this.start_x = me_rect.x + (me_rect.width - this.start_w)/2;
        this.end_x = employee_rect.x + (employee_rect.width - this.end_w)/2;
    }

    componentDidMount(){
        // if component did mount, path check again (For F5 page)

        this.isMount = true;
        this.path_recheck();
    }

    componentDidUpdate(){

        // Exception: update check path
        let path = this.props.location.pathname;
        if( path === "/results" ){
            this.set_bar_hidden(false); 
            this.set_me_focus(true);
        }

        let sw = this.start_w, ew = this.end_w;
        this.calculate_underline_offset();
        if(this.start_w !== sw || this.end_w !== ew){
            this.set_anime_underline(
                this.state.me_focus ? this.start_x:this.end_x,
                this.state.me_focus ? this.start_w:this.end_w
            );
        }
    }

    componentWillUnmount(){
        this.isMount = false;
    }

    set_username = (username, username_id, username2) => {
        this.setState({
            username: username, 
            username2: username2, 
            username_id: username_id
        })
    }

    render() {
        return (
            <div>
                <div hidden={this.state.navbar_hidden} className="NavBar">
                    <Link to="/results/employeeview" onClick={()=>{this.set_me_focus(true)}} style={{ textDecoration: 'none' }}>
                        <div className={!this.state.me_focus? "tabItem lefttab" : "tabSelectItem lefttab"}>
                            <div ref={this.me_ref}>
                                <FormattedMessage id="feedback_for_me" />
                            </div>
                        </div>
                    </Link>
                    <Link to="/results/employerview" onClick={()=>{this.set_me_focus(false)}} style={{ textDecoration: 'none' }}>
                        <div className={this.state.me_focus? "tabItem" : "tabSelectItem"}>
                            <div ref={this.employee_ref}>
                                <FormattedMessage id="feedback_for_employees" />
                            </div>
                        </div>
                    </Link>
                </div>
                <div className="underlineparent">
                    <div style={{position:"absolute" , left: this.state.underline_x, margin:"0px", width:this.state.underline_width+"px"}}hidden={this.state.navbar_hidden} className="barunderline" />
                </div>
                <Breadcrumb tag="nav" listTag="div" className="top-bread" hidden={!this.state.navbar_hidden}>
                    <BreadcrumbItem>
                        <Link to="/results/employerview" onClick={()=>{this.setState({navbar_hidden:false})}} className="root_item">
                            <FormattedMessage id="feedback_for_employees" />
                        </Link>
                        <i className="fas fa-caret-right" aria_hidden="true"></i>
                    </BreadcrumbItem>
                    { this.state.username_id ?
                        <BreadcrumbItem>
                            <Link to="/results/reviewlist" onClick={()=>{cookie.save('param', this.state.username_id, { path: '/' })}} className="root_item">
                                {this.state.username} 
                            </Link>
                            <i class="fas fa-caret-right" aria_hidden="true"></i>
                        </BreadcrumbItem>
                            :
                        <BreadcrumbItem>
                            <span className="child_item">
                                {this.state.username}
                            </span>
                        </BreadcrumbItem>
                    }
                    {(()=>{
                        if(this.state.username2){
                            return  <BreadcrumbItem active tag="span" >
                                        {this.state.username2} 
                                    </BreadcrumbItem>
                        }
                    })()}

                </Breadcrumb> 

                <div>
                    <div className="context">
                    <Switch>
                        <Redirect exact from="/results" to="/results/employeeview" />
                        <Route exact path="/results/employeeview" component={EmployeeView} />
                        <Route exact path="/results/employerview" render={
                            props => (<EmployerView set_bar_hidden={this.set_bar_hidden} />)}/>
                        <Route path="/results/reviewlist/" render={ 
                            props => (<ResultList {...props} set_username={this.set_username} />)}/>
                        <Route path="/results/review/" render={ 
                            props => (<ReviewRender {...props} set_username={this.set_username} />)}/>

                    </Switch>
                    </div>
                </div>
            </div>
        );
    }
}
