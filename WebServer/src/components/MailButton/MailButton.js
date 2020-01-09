import { FormattedMessage  } from 'react-intl';
import React, { Component } from "react";
import { Button, Modal } from 'reactstrap';
import { SERVER_URL } from '../../constants/ServerInfo'

export default class MailButton extends Component {

    constructor(props){
        super(props);
        this.state = {
            modal : false
        }
    }
    toggle = () => {
        this.setState(prevState => {this.setState({modal : !prevState.modal})} );
    }
    send_mail = () => {
        // Fetch : initialization all candidated & selected
        fetch(SERVER_URL + "/mail_reminder", {credentials: 'include'})
            .then((res)=>{
                return res.json();
            }).then((reply)=>{
                if(reply['status'] === 'ok'){
                    
                }else{
                    // TODO: show alert
                }
            }).catch(function(err){
                console.log(err);
            });
        this.toggle();
    }

    render(){
        return  <Button color="primary" outline id="ProvideButton" onClick={this.toggle}>
                    <FormattedMessage id="send_email" />
                    <Modal size="sm" isOpen={this.state.modal} toggle={this.toggle}>
                        <Button onClick={this.toggle} color="secondary"> Cancel </Button>
                        <Button onClick={this.send_mail} color="danger"> Send </Button>
                    </Modal>
                </Button>
    }
};
