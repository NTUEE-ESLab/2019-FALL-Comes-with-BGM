import React, { Component } from "react";

import { SERVER_URL } from '../../../../constants/ServerInfo'
import { Button } from 'reactstrap';


import 'bootstrap/dist/css/bootstrap.css';
import './EmployeeView.css'

import music_canvas from '../../../../assets/music.jpg'
import axios from 'axios'

export default class EmployeeView extends Component {

    constructor(props) {
        
        super(props);
        this.state = {
            img_src : "",
            songName: ''
        };
        this.updateData = function(){
            // console.log('call')
            fetch(SERVER_URL + "/get_user_wordcloud", {
                method: 'GET',
                credentials: 'include'})
                .then((res)=>{
                    return res.json();
                }).then((reply)=>{
                    let img_src = reply.img_src;
                    if(reply['status'] === 'ok'){
                        this.setState({img_src:img_src})
                    }
                }).catch(function(err){
                    console.log('get_user error');
                });
            fetch(SERVER_URL + "/readCurrentPlay", {
                method: 'GET',
                credentials: 'include'})
                .then((res)=>{
                    return res.json();
                }).then((reply)=>{
                    let songName = reply['data'];
                    if(reply['status'] === 'ok'){
                        this.setState({songName:songName})
                    }
                }).catch(function(err){
                    console.log(err)
                    console.log('get_user error');
                });
        }
        this.interval = setInterval(this.updateData.bind(this), 1000)


    }
    componentDidMount(){
        this.updateData()
    }
    onStatusChange(status){
        axios.post(SERVER_URL + '/statusChange', {'status': status}).then((res) => {
            console.log(res)
        })
    }
    onVolumeChange(status){
        axios.post(SERVER_URL + '/volumeChange', {'volume': status}).then((res) => {
            console.log(res)
        })
    }
    render() {
        // console.log(this.state)
        return (
            <div className="nowplaying">
                <div className="Song_title">
                    {this.state.songName}
                </div>
                <img alt="user textcloud" src={music_canvas} id="image"></img>
                <div className="toolbar">
                    <Button color="outline-primary" className="play-music-button" onClick={this.onStatusChange.bind(this, 'play')}>
                        <i className="fas fa-play"></i>
                    </Button>
                    <Button color="outline-primary" className="play-music-button" onClick={this.onStatusChange.bind(this, 'pause')}>
                        <i className="fas fa-pause"></i>
                    </Button>
                    <Button color="outline-primary" className="volume-button" onClick={this.onVolumeChange.bind(this, 'down')}>
                        <i className="fas fa-minus"></i>
                    </Button>
                    <i className="fas fa-volume-up volume-icon" style={{fontSize:'20px'}}></i>
                    <Button color="outline-primary" className="volume-button" onClick={this.onVolumeChange.bind(this, 'up')}>
                        <i className="fas fa-plus"></i>
                    </Button>
                </div>
            </div>
        );
    }
}
