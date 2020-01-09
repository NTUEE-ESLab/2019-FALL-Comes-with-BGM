import cookie from 'react-cookies'
import React, { Component } from "react";
import { FormattedMessage } from 'react-intl';
import { ListGroupItem, ListGroup } from 'reactstrap';
import { Link } from 'react-router-dom'

import  { SERVER_URL } from '../../../../constants/ServerInfo'

import 'bootstrap/dist/css/bootstrap.css';
import './ResultList.css'
import MailButton from '../../../../components/MailButton/MailButton';

export default class ResultList extends Component {

    constructor(props) {

        super(props);
        this.reviewId = [];
        
        this.state = {
            reviewContent : [], 
            viewed: {}, 
            username: "Username"
        }; 

        // Fetch : get all review content
        fetch(SERVER_URL + "/get_result_list/", {credentials: 'include'})
            .then((res)=>{
                return res.json();
            }).then((reply)=>{
                
                if(reply['status'] === 'ok'){

                    let data = reply.data;
                    let mail = reply.account;
                    let name = reply.display_name;
                    let pre_collapse = {};
                    let viewed = {};
                    data.forEach( ({comment_from, is_viewed}) =>{
                        pre_collapse[comment_from] = false;
                        viewed[comment_from] = is_viewed;
                    })
                    this.setState({
                        username : name ,
                        reviewContent : data, 
                        viewed : viewed,
                        mail: mail
                    });
                    this.props.set_username(name)

                }

            }).catch(function(err){
                console.log(err);
            });
        
    }
    
    render() {
        const lists = this.state.reviewContent.map( ({comment_from, submission_time, comment_from_for_display, due_time, has_submitted,not_submit_status, _id}) => (
            <div key={"reviewRender_div_"+comment_from} onClick={()=>{cookie.save('param', _id, { path: '/' })}}>
                <ListGroupItem action className="view_listitem">
                    <Link to={has_submitted?'/results/review/':'/results/reviewlist'} style={{textDecoration: 'none'}} className="item_link">
                        <div className="to_read_col">
                            {!this.state.viewed[comment_from] ?
                                 <span className="dot"></span>
                                :<span className="no-dot"></span>
                            }
                        </div>
                        <div id={!this.state.viewed[comment_from] ? "to_read_name" : "not_read_name"}>
                            {comment_from_for_display}
                        </div>
                        {has_submitted ? 
                            <span>
                            </span>:
                            <span className={not_submit_status==="PENDING" ? "pending_text" : "overdue_text"}> 
                                {not_submit_status}
                            </span>
                            
                        }
                        {has_submitted ? 
                            <span className="submission_time"> 
                                {submission_time}
                            </span> :
                            <div className="reminder_button"> 
                                <MailButton 
                                    comment_from_mail={comment_from} 
                                    comment_from_display_name={comment_from_for_display} 
                                    comment_to={this.state.mail}
                                    comment_to_display_name={this.state.username}
                                />
                            </div>
                        }
                    </Link>
                </ListGroupItem>
            </div>
        ));

        return (
            <div>
                <div className="SentNum">
                    <span className="sent-text">
                        {(() => {

                            let filteredReviewContent = this.state.reviewContent.filter((review)=>(review['has_submitted']));
                            let numbersOfSend = filteredReviewContent.length;
                            let numbersOfAll = this.state.reviewContent.length;
                            let reviewsState = numbersOfSend + "/" + numbersOfAll;
                            return <FormattedMessage id="review_state" values={{num : reviewsState, name:this.state.username}} />;
                        
                        })()}
                    </span>
                </div>
                <div>
                    <div className="feedbackList" id="scrollbar">
                        <ListGroup>
                            {lists}
                        </ListGroup>
                    </div>
                </div>
                
            </div>
        );
    }
}
