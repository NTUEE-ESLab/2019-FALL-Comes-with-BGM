import React, { Component } from "react";

import  { SERVER_URL } from '../../../../constants/ServerInfo'
import  Review from '../../../../components/Review/Review'

export default class ReviewRender extends Component {
    constructor(props){
        super(props);
        this.state = {}
    
        // Fetch : initialization all candidated & selected
        fetch(SERVER_URL + "/get_review_content/", {credentials: 'include'})
            .then((res)=>{

                return res.json();

            }).then((reply)=>{
                
                if(reply['status'] === 'ok'){
                
                    let data = reply.data
                    this.props.set_username(
                        reply.comment_to, 
                        reply.comment_to_id, 
                        reply.comment_from
                    );
                    this.comment_to = reply.comment_to
                    this.comment_from = reply.comment_from

                    if(typeof data === 'string'){
                        this.setState({data : data});
                    }else{
                        this.setState({...data});
                    }
                
                }
            }).catch(function(err){
                console.log(err);
            });
    }
    render(){
        return <div> 
            <Review comment_to={this.comment_to} comment_from={this.comment_from} {...this.state} />
        </div>
    }
};
