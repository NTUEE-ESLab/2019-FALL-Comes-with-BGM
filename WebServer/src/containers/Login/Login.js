import React, { Component } from "react";
import { Alert, Form, FormGroup} from 'reactstrap';

import  { SERVER_URL } from '../../constants/ServerInfo'
import "./Login.css"
import mainLogo from '../../assets/log in image@3x.png'

export default class Login extends Component {

    constructor(props) {
        super(props);
        this.state = {
            alert_visible : false, 
            server_message : "NO",
            email_input_focus : false,
            pass_input_focus : false,
        }
    }

    submit = (event) => {

        event.preventDefault();
        const data = new FormData(event.target);
        
        fetch(SERVER_URL + "/login", {
            body: JSON.stringify({
                username: data.get('username'), 
                password: data.get('password')}),
            method: 'POST', credentials:"include" })
            .then((res)=>{
                return res.json();
            }).then((server_reply)=>{
                
                if(server_reply['status'] === 'ok'){
                    // If login success, redirect to review_list
                    window.location.replace('/review_list');
                }else{
                    // There's some alert from server.
                    this.setState({
                        alert_visible : true, 
                        server_message : server_reply['alert_message']
                    });
                }

            }).catch((err)=>{
                console.log(err)
                this.setState({
                    alert_visible : true, 
                    server_message : "Server is unreachable now, please try again later."
                });
            });        
    }

    render() {

        return (
            <div className="Main">
                <div className="LeftDiv">
                    <span id="Peer">
                        Automatic BGM
                    </span>
                    <img src={mainLogo} alt="mainLogo" className="mainLogo"/>
                </div>
                <div className="RightDiv">
                    <span id="Login">
                        Log In
                    </span>
                    <Form className="loginForm" onSubmit={this.submit}>
                        <FormGroup style={{textAlign: "left"}}>
                            <div className="form-group">
                                <input type="text" id="username" name="username" className="form-control" required autoComplete="off"/>
                                <label className="form-control-placeholder" htmlFor="username">EMAIL</label>
                            </div>
                            <div className="form-group">
                                <input type="password" id="password" name="password" className="form-control" required autoComplete="off"/>
                                <label className="form-control-placeholder" htmlFor="password">PASSWORD</label>
                            </div>
                        </FormGroup>

                        <Alert isOpen={this.state.alert_visible} color="danger">
                            {this.state.server_message}
                        </Alert>
                        <button className="login-button">
                            <span id="login-button-text">
                                LOG IN
                            </span>
                        </button>
                    </Form>
                </div>
            </div>
        );
    }
}
