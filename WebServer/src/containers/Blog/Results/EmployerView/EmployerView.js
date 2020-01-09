import React, { Component } from "react";
import { FormattedMessage } from 'react-intl';
import { ListGroup, ListGroupItem, Button } from 'reactstrap';

import  { SERVER_URL } from '../../../../constants/ServerInfo'
import axios from 'axios'

import 'bootstrap/dist/css/bootstrap.css';
import './EmployerView.css'

export default class Posts extends Component {

    constructor(props) {

        super(props);
                
        this.state = {
            reviewId : [],
        }; 

        // Fetch : initialization all candidated & selected
        fetch(SERVER_URL + "/get_song_list", {credentials: 'include'})
            .then((res)=>{

                return res.json();

            }).then((reply)=>{
                
                if(reply['status'] === 'ok'){
                
                    let data = reply.data
                    this.setState({reviewId : data});
                
                }else{
                }

            }).catch(function(err){
                console.log(err);
            });
    }

    play_song = (song_name) => {
        console.log(song_name)
        axios.post(SERVER_URL + "/playListChange", {'songName': song_name},
            ).then(res => {
                console.log(res.data)
            })
        let recipesCopy = JSON.parse(JSON.stringify(this.state.reviewId))
        let prev_id = 0;
        let new_id = 0;
        for(let i=0;i<=this.state['reviewId'].length-1;i++){
            if(this.state['reviewId'][i]['song_name'] === song_name){
                new_id = i;
            }else{
                if(this.state['reviewId'][i]['is_playing'] === true)
                prev_id = i;
            }
        }
        recipesCopy[prev_id].is_playing = false;
        recipesCopy[new_id].is_playing = true;
        let new_song_list = [];
        new_song_list.push(recipesCopy[new_id])
        for(let i=0;i<=this.state['reviewId'].length-1;i++){
            if(i !== new_id){
                new_song_list.push(recipesCopy[i]);
            }
        }
        this.setState({reviewId: new_song_list});
    }

    render() {
        const lists = this.state.reviewId.map( ({song_name, length,singer , _id, is_playing}) => (
            
            <ListGroupItem action className="view_listitem" key={"listgroupitem_"+song_name}>
                <div className="to_read_col">
                    {is_playing ?
                         <span className="dot"></span>
                        :<span className="no-dot"></span>
                    }
                </div>
                <div id={is_playing ? "to_read_name" : "not_read_name"}>
                    {song_name}
                </div>
                <div className="singer">
                    {singer}
                </div>

                <span className="Feedbacknum"> 
                    {length}
                </span>

                <Button color="outline-primary" className="play-button" onClick={this.play_song.bind(this, song_name)}>
                    <i className="fas fa-play" style={{fontSize:'12px'}}></i>
                </Button>

            </ListGroupItem>
        
        ));
        if (lists.length === 0){
            return  <div className="no_request">
                        <span>
                            <FormattedMessage id="no_permission" />
                        </span>
                    </div>
        }
        return (
            <div className="EmployerList" id="scrollbar">
                <ListGroup>
                    {lists}
                </ListGroup>
            </div>
        );
    }
}
