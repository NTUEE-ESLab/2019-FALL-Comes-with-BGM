import { ButtonDropdown, DropdownToggle, DropdownMenu, DropdownItem, Input } from 'reactstrap';
import { Switch, Route, Redirect, Link } from "react-router-dom";
import { Nav, NavItem, NavLink, Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import React, { Component } from "react";
import { FormattedMessage  } from 'react-intl';
import anime from 'animejs/lib/anime.es.js';

import  { SERVER_URL } from '../../constants/ServerInfo'
import ReviewList from "./ReviewList/ReviewList";
import Results from "./Results/Results";
import list_icon from '../../assets/lightbulb.png'
import result_icon from '../../assets/music-player.png'
import AlertModal from '../../components/AlertModal/AlertModal'

import './Blog.css';
import ToastModal from '../../components/ToastModal/ToastModal';
class Iframe extends Component{     
    render() {
      return(         
        <div>          
          <iframe src={this.props.src} height={this.props.height} width={this.props.width} title="iframe"/>         
        </div>
      )
    }
}

export default class Blog extends Component {
    constructor(props) {
        super(props);

        // path check to focus right nav
        let path = window.location.pathname;
        let nav_focus_result = false;
        if( path.startsWith("/results") )
            nav_focus_result = true;


        this.state = {
            dropdownOpen: false,
            is_login: false,
            username: "Not Logined.", 
            confirmModal : false,
            not_send_num : 0,
            not_read_review : false,
            toastModal : false,
            architectureModal : false,
            nav_focus_result : nav_focus_result,
            focus_marginTop : 0,
            bug_input : "",
            architectureTrim : 0,
            img_src : "https://image.flaticon.com/icons/png/512/97/97895.png"
        };

        // Get the user info like username & user_image by server's check.
        fetch(SERVER_URL + "/get_user_info", {
            method: 'GET',
            credentials: 'include'})
            .then((res)=>{
                return res.json();
            }).then((reply)=>{

                let data = reply.data;
                
                if(reply['status'] === 'ok'){
                    this.setState({
                        is_login : true, 
                        username : data['username'],
                    })
                    if(data['img_src']){
                        this.setState({img_src : data['img_src']})
                    }
                }else{
                    window.location.replace('/login');
                }

            }).catch(function(err){
                console.log('get_user error');
            });

        // first update
        this.update_overall_status();

        this.focus_delta_y = 64;
    }
    componentDidMount = () => {
        if(this.state.nav_focus_result){
            this.setState({focus_marginTop: this.focus_delta_y});
        }
    } 

    update_overall_status = () => {

        // Get overall status
        fetch(SERVER_URL + "/get_overall_status", {
            method: 'GET',
            credentials: 'include'})
            .then((res)=>{
                return res.json();
            }).then((reply)=>{
                if(reply['status'] === 'ok'){
                    this.setState({
                        not_send_num : reply.not_send_num, 
                        not_read_review : reply.not_read_review,
                    })
                    // if ok, restart update 5s later,
                    setTimeout(this.update_overall_status, 5000);
                    this.setState({alertModal: false, to_login: false})
                }else{
                    this.setState({alertModal: true, to_login: true})
                }
            }).catch((err)=>{
                console.log('get_overall_status error', err);
                this.setState({alertModal: true, to_login: false})
                setTimeout(this.update_overall_status, 5000);
            });
    }
    change_nav_focus = (focus_results) => {

        if(this.state.nav_focus_result !== focus_results){
            if(!this.state.nav_focus_result){
                let prop = { v: 0 };
                anime({
                    targets: prop,
                    v : this.focus_delta_y,
                    duration: 500,
                    easing: 'easeOutSine',
                    update: (anim) => {this.setState({focus_marginTop:prop.v})}
                });
            }else{
                let prop = { v: this.state.focus_marginTop };
                anime({
                    targets: prop,
                    v : 0,
                    duration: 500,
                    easing: 'easeOutSine',
                    update: (anim) => {this.setState({focus_marginTop:prop.v})}
                });
            }
            this.setState({nav_focus_result:focus_results});
        }

    }
    logout = () => {

        // Tell server to unregister token in the cookie
        fetch(SERVER_URL + "/logout", {credentials: 'include'})
            .then((res)=>{
                return res.json();
            }).finally(()=>{
                // No matter what, just redirect to login page.
                window.location.replace('/login');
            });    
    }

    // Control the dropdown button's toggle.
    dropdownToggleHandler = () => {
        this.setState({
            dropdownOpen: !this.state.dropdownOpen
        });
    }
    confirmModalToggle = () => {
        this.setState( prevState => ({
            confirmModal : !prevState.confirmModal
        }));
    }
    bugModalToggle = () => {
        this.setState( prevState => ({
            bugModal : !prevState.bugModal
        }))
    }
    toastModalToggle = () => {
        this.setState( prevState => ({
            toastModal : !prevState.toastModal
        }))
    }
    architectureModalToggle = () => {
        this.setState( prevState => ({
            architectureModal : !prevState.architectureModal
        }))
    }
    architectureTrimToggle = () => {
        console.log('trim!');
        console.log(this.state.architectureTrim);
        this.setState( prevState => ({
            architectureTrim : 1-prevState.architectureTrim
        }))
    }

    submit_bug_report = () => {
        this.bugModalToggle();
        // Get overall status
        fetch(SERVER_URL + "/bug_report", {
            method: 'POST',
            body: this.state.bug_input,
            credentials: 'include'})
            .then((res)=>{
                return res.json();
            }).then((reply)=>{
                console.log(reply);
                if(reply['status'] === 'ok'){
                    this.toastModalToggle();
                    setTimeout(()=>{this.setState({toastModal:false})},1500);
                }
            
            }).catch((err)=>{

            })
    }
    
    render() {

        return (
            <div className="flex">
            	<div className="topDiv">
                    <div className="topBar">
                        <NavLink id="performance360" href="/review_list/posts">
	                        <span>
                                <FormattedMessage id="performance360" />
                            </span>
                        </NavLink>

                        <button className={this.props.getLanguage() === 'en' ? "LanguageButton leftb langfocus" : "LanguageButton leftb"} onClick={() => {this.props.changeLanguage('en')}}>
                           English
                        </button>
                        <span className="vline">｜</span>
                        <button className={this.props.getLanguage() === 'zh' ? "LanguageButton rightb langfocus" : "LanguageButton rightb"} onClick={() => {this.props.changeLanguage('zh')}}>
                            中文
                        </button>
                        

                        <ButtonDropdown isOpen={this.state.dropdownOpen} toggle={this.dropdownToggleHandler} id="userinfo">

                            <DropdownToggle caret className="usermenu">
                                <img alt={this.state.username} src={this.state.img_src} className="userimg" />
                                {this.state.username}
                            </DropdownToggle>

                            <DropdownMenu>
                                <DropdownItem header>
                                    <FormattedMessage id="user_info" />
                                </DropdownItem>
                                    {
                                    !this.state.is_login ?
                                        (<NavLink href="/login"> 
                                            <FormattedMessage id="login" /> 
                                        </NavLink>) : 
                                        (<DropdownItem onClick={this.confirmModalToggle}>
                                            <FormattedMessage id="logout" />
                                        </DropdownItem>)
                                    }
                                
                                <DropdownItem divider />
                            
                                <DropdownItem header>
                                    <FormattedMessage id="bug_report" />
                                </DropdownItem>
                                <DropdownItem onClick={this.bugModalToggle}>
                                    <FormattedMessage id="tell_us" />
                                </DropdownItem>                                
                            </DropdownMenu>
                        </ButtonDropdown>
                    </div>
	            </div>

                <div className="downDiv downBar">
                    <div className="leftdownDiv">
	                    <Nav vertical>
                            <div className="downcirclebar" style={{position:"absolute", marginTop:this.state.focus_marginTop}} />
	                        <Link to="/review_list/posts" onClick={()=>this.change_nav_focus(false)} style={{ textDecoration: 'none' }}>
	                            <NavItem className={this.state.nav_focus_result? "ListItem" : "ListItemSelect"}>
                                    <img src={list_icon} alt="list_icon" className="list_icon"/>
                                    <FormattedMessage id="review_list" className="ListsubItem"/>
	                            </NavItem>
                            </Link>
	                        <Link to="/results" onClick={()=>this.change_nav_focus(true)} style={{ textDecoration: 'none' }}>
	                            <NavItem className={!this.state.nav_focus_result? "ListItem" : "ListItemSelect"}>
                                    <img src={result_icon} alt="result_icon" className="result_icon"/>
                                    <FormattedMessage id="results" className="ListsubItem"/>
                                    {(()=>{
                                        if(this.state.not_read_review)
                                            return <span className="dot"></span>
                                    })()}
	                            </NavItem>
                            </Link>
                            
	                    </Nav>
                    </div>

                    <div className="rightdownDiv">
                        <div className="ReviewList">
                        <Switch>
                            <Redirect exact path="/" to="/review_list"/>
                            <Route path="/review_list" component={ReviewList}/>
                            <Route path="/results" component={Results} />
                            <Redirect from="/home" to="/" />
                        </Switch>
                        </div>
                    </div>
                </div>

                <Modal isOpen={this.state.confirmModal} toggle={this.confirmModalToggle} className="Log_Out">
                    <ModalHeader className="logout_title">
                        <FormattedMessage id="logout" />
                    </ModalHeader>

                    <ModalBody className="logout_msg">
                        <FormattedMessage id="logout_alert" />
                    </ModalBody>

                    <ModalFooter className="logout_btn">

                        <Button color="danger" onClick={this.logout} className="logout_button_modal">
                            <FormattedMessage id="logout" />
                        </Button>
                        <Button color="primary" outline onClick={this.confirmModalToggle} className="cancel_button_modal">
                            <FormattedMessage id="cancel" />
                        </Button>
                        

                    </ModalFooter>

                </Modal>
               
                <Modal isOpen={this.state.bugModal} toggle={this.bugModalToggle}>
                    <ModalHeader>Bug Report!</ModalHeader>

                    <ModalBody>
                        <Input style={{height:"300px"}} type="textarea" 
                            value={this.bug_input} 
                            onChange={(e)=>{this.setState({bug_input:e.target.value})}} />
                    </ModalBody>

                    <ModalFooter>

                        <Button color="secondary" onClick={this.bugModalToggle}>
                            <FormattedMessage id="cancel" />
                        </Button>
                        {' '}
                        <Button color="primary" onClick={this.submit_bug_report}>
                            <FormattedMessage id="submit" />
                        </Button>

                    </ModalFooter>

                </Modal>

                <Modal size="xl" isOpen={this.state.architectureModal} toggle={this.architectureModalToggle}>
                    <ModalHeader>
                        Architecture Graph 
                    </ModalHeader>

                    <ModalBody>
                        <Iframe height="640px" width="800px" title="architecture_graph" 
                            src={SERVER_URL + "/architecture?trim=" + this.state.architectureTrim} />
                    </ModalBody>
                    <ModalFooter>
                        <Button onClick={this.architectureTrimToggle} color="primary"> 
                            {this.state.architectureTrim?"Change to All":"Change to trim"}
                        </Button>
                    
                    </ModalFooter>
                </Modal>
                <AlertModal isOpen={this.state.alertModal} to_login={this.state.to_login}/>
                <ToastModal isOpen={this.state.toastModal} toggle={this.toastModalToggle} />
            </div>
        );
    }
}
