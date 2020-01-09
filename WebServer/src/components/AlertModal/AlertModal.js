import { FormattedMessage  } from 'react-intl';
import React, { Component } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import { Link } from "react-router-dom";

export default class AlertModal extends Component {

    render(){
        if (this.props.to_login)
            return  <Modal isOpen={this.props.isOpen}>
                            <ModalHeader>Expired Token / Not Login</ModalHeader>

                            <ModalBody>
                                Please login.
                            </ModalBody>

                            <ModalFooter>

                                <Link to="/login">
                                    <Button color="danger">
                                        <FormattedMessage id="login" />
                                    </Button>
                                </Link>

                            </ModalFooter>

                    </Modal>
        else return <Modal isOpen={this.props.isOpen}>
                            <ModalHeader>Server is not reachable</ModalHeader>

                            <ModalBody>
                                Our server may be down, please contact us.
                            </ModalBody>

                            <ModalFooter>

                                <Link to="/login">
                                    <Button color="danger">
                                        Refresh
                                    </Button>
                                </Link>

                            </ModalFooter>

                    </Modal>
}
};
