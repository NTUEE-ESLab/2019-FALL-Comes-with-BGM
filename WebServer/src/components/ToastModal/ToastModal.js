import React, { Component } from "react";
import { Modal, ModalBody, ModalFooter } from 'reactstrap';
import successLogo from '../../assets/success.png';
import '../ToastModal/ToastModal.css'

export default class ToastModal extends Component {
    render(){
        return (
            <Modal isOpen={this.props.isOpen} toggle={this.props.toggle} className="toastmodal">
                <ModalBody className="modal_logo">
                    <img src={successLogo} alt="successLogo" className="successLogo"/>
                </ModalBody>
                <ModalBody className="success_text">
                    {this.props.is_asks? "Request Sent" :"Feedback Sent"}
                </ModalBody>
                <ModalFooter className="info_text_border">
                    <div className="info_text">
                        {this.props.is_asks? "Your request has been sent" : "Your feedback has been sent"}
                    </div>
                </ModalFooter>
            </Modal>
        );
    }
};
