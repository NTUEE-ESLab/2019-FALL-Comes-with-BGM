import React, { Component } from "react";

import { SERVER_URL } from '../../../../constants/ServerInfo'
import CrossfadeImage from 'react-crossfade-image'

import 'bootstrap/dist/css/bootstrap.css';
import './Post.css'

import room0_img from '../../../../assets/room_speaker0.png'
import room1_img from '../../../../assets/room_speaker1.png'

export default class Posts extends Component {

    constructor() {
        
        super();
        this.state = {
          imageIndex: room0_img
        };
        this.interval = setInterval(this.update_room_status, 1000)
        // this.update_room_status();
    }

    update_room_status = () => {

        fetch(SERVER_URL + "/get_user_room", {
            method: 'GET',
            credentials: 'include'})
            .then((res)=>{
                return res.json();
            }).then((reply)=>{
                let room_index = reply.room_index;
                if(reply['status'] === 'ok'){
                    if(room_index === '0'){
                        this.setState({imageIndex:room0_img})
                    }else{
                        this.setState({imageIndex:room1_img})
                    }
                    setTimeout(this.update_room_status, 3000);
                }
            }).catch(function(err){
                console.log('get_user error');
            });

    }
    
    render() {
        return (
            <div className="wordcloud">
                <CrossfadeImage src={this.state.imageIndex} duration={1000} timingFunction={"ease-out"}/>
            </div>
        );
    }
}
