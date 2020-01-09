import ReactTooltip from 'react-tooltip'
import React, { Component } from "react";
import { FormattedMessage  } from 'react-intl';
import { Breadcrumb, BreadcrumbItem, Progress } from 'reactstrap';
import { Button, Label, Input } from 'reactstrap';
import { NavLink } from "react-router-dom";
import anime from 'animejs/lib/anime.es.js';

import  { SERVER_URL } from '../../constants/ServerInfo'
import Review from '../Review/Review'
import ToastModal from '../ToastModal/ToastModal'

import './Post.css'

export default class Post extends Component {
    
    constructor(props) {

        super(props);

        let form_default_value = {};
        this.form_key = [];
        for(let i = 0 ; i < 6 ; i++){
            form_default_value["range" + i] = 0;
            this.form_key.push("range"+i);
        }
        for(let i = 0 ; i < 3 ; i++){
            form_default_value["textarea" + i] = ""
            this.form_key.push("textarea"+i);
        }
        this.state = {
            comment : "", 
            is_404 : false, 
            underline_x : 0,
            underline_width : 80,
            part1_focus : true,
            confirm_focus : false,
            part_opacity : 1,
            confirm_opacity : 0,
            part1_opacity : 1,
            part2_opacity : 0,
            finishModalToggleOpen: false, 
            username : "Username",
            ...form_default_value
        }
        // Fetch : initialization fetch last record 
        fetch(SERVER_URL + "/provide", {credentials: "include"})
        .then((res)=>{
            return res.json()
        }).then((reply)=>{

            if(reply['status'] === 'ok'){
                
                let data = reply.data
                let name = reply.name
                try{
                    this.setState(data);
                }catch{
                    console.log("I can't tell the data is.")
                }
                this.setState({username: name});
            }

        }).catch((err) => {
            // Parse error -> 404
            this.setState({is_404 : true});
        });

        // create ref to get x
        this.part1_ref = React.createRef();
        this.part2_ref = React.createRef();
    }

    calculate_underline_offset = () => {

        let part1_rect = this.part1_ref.current.getBoundingClientRect();
        let part2_rect = this.part2_ref.current.getBoundingClientRect();
        this.start_w = part1_rect.width * 0.7;
        this.end_w = part2_rect.width * 0.7;
        this.start_x = part1_rect.x + (part1_rect.width - this.start_w)/2;
        this.end_x = part2_rect.x + (part2_rect.width - this.end_w)/2;
    }

    set_part1_focus = (part1_focus) => {
    
        if(this.state.part1_focus !== part1_focus){
            if(this.state.part1_focus){
                this.set_anime_underline(this.end_x,this.end_w);
                this.set_anime_part_opacity(false);
            }else{
                this.set_anime_underline(this.start_x,this.start_w);
                this.set_anime_part_opacity(true);
            }
            this.setState({part1_focus:part1_focus})
        }
    }
 
    click_prev = () => {

        if(this.state.confirm_focus){
            this.set_anime_part_opacity_without_intersection(false);
            this.setState({confirm_focus : false})

        }else{
            if(!this.state.part1_focus){
                this.set_part1_focus(true);
            }
        }
    }

    click_next = () => {

        if(this.state.confirm_focus){
            this.submit(false);
        }else{
            if(this.state.part1_focus){

                this.set_part1_focus(false);
            }else{
                this.set_anime_part_opacity_without_intersection(true);
                this.setState({confirm_focus : true})
            }
        }
    }

    componentDidMount(){
        // calculate_props
        this.calculate_underline_offset();
        this.setState({underline_x : this.start_x , underline_width: this.start_w});
        this.isMount = true;
    }
    
    componentWillUnmount(){
        this.isMount = false;
    }

    calculate_completeness(){
        let numerator = 0;
        let denominator = 8;
        for(let i = 0 ; i < 6 ; i++){
            if(Number(this.state["range" + i]))
                numerator += 1
        }
        for(let i = 0 ; i < 3 ; i++){
            if(this.state["textarea" + i])
                numerator += 1
        }
        return numerator / denominator;
    }

    set_anime_underline = (end_x, end_w) => {
        let prop = { x: this.state.underline_x , w: this.state.underline_width };
        anime({
            targets: prop,
            x : end_x,
            w : end_w,
            duration: 500,
            easing: 'spring(1, 30, 10, 0)',
            update: () => {
                if(!this.isMount)
                    return;
                this.setState({
                    underline_x: prop.x, 
                    underline_width: prop.w
                });
            }
        });
    }

    set_anime_part_opacity = (part1_focus) => {
        let prop = { p1: this.state.part1_opacity , p2: this.state.part2_opacity };
        let tartget_part1 = part1_focus ? 1 : 0;
        let tartget_part2 = part1_focus ? 0 : 1;
        anime({
            targets: prop,
            p1 : tartget_part1,
            p2 : tartget_part2,
            duration: 500,
            easing: 'cubicBezier(.5, .05, .1, .3)',
            update: () => {
                if(!this.isMount)
                    return;
                this.setState({
                    part1_opacity: prop.p1, 
                    part2_opacity: prop.p2
                });
            }
        });
    }

    set_anime_part_opacity_without_intersection = (confirm_focus) => {
        let prop = { part_opacity: this.state.part_opacity , confirm_opacity: this.state.confirm_opacity };
        let easeout_name = confirm_focus ? 'part_opacity' : 'confirm_opacity';
        let easein_name = confirm_focus ? 'confirm_opacity' : 'part_opacity';
        anime({
            targets: prop,
            [easeout_name] : 0,
            duration: 500,
            easing: 'cubicBezier(.5, .05, .1, .3)',
            update: () => {
                if(!this.isMount)
                    return;
                this.setState({
                    [easeout_name] : prop[easeout_name]
                });
            },
            complete: () => {
                anime({
                    targets: prop,
                    [easein_name] : 1,
                    duration: 500,
                    easing: 'cubicBezier(.5, .05, .1, .3)',
                    update: () => {
                        if(!this.isMount)
                            return;
                        this.setState({
                            [easein_name] : prop[easein_name]
                        });
                    }
                });
            }
        });
    }

    submit = (only_save) => {
        // only_save : true -> save / false -> submit
        
        // comment pack
        let submit_data = Object.keys(this.state)
            .filter(key => this.form_key.includes(key))
            .reduce((obj, key) => {
                return {
                  ...obj,
                  [key]: this.state[key]
                };
            }, {});

            fetch(SERVER_URL + "/provide", {
            body: JSON.stringify({
                data : submit_data,
                only_save : only_save}),
            method: 'POST',
            credentials: "include"})

            .then((res)=>{
                return res.json();

            }).then((reply)=>{

                if(reply['status'] === 'ok'){

                    this.finishModalToggle();
                    setTimeout(() => {
                        this.finishModalToggle(true);
                        if(!only_save)
                            window.location.replace('/review_list');
                    },1500);            
                }
            }).catch(function(err){
                console.log(err);
            });
    }

    finishModalToggle = (turnFalse) => {
        // toggle for ok modal.

        if(turnFalse === true){
            this.setState({finishModalToggleOpen: false});
        }else{
            this.setState(prevState => ({
                finishModalToggleOpen: !prevState.finishModalToggleOpen
            }));
        }
    }

    range_input_component = (i) => {
        return  <div key={"range_input" + i}>
                    <div className="poll_question_text">
                        <FormattedMessage id={"question_range"+i} />
                    </div>
                    <div className="poll_digit_text">
                        <div className="range-dots">
                            <li></li>
                            <li></li>
                            <li></li>
                            <li></li>
                            <li></li>
                            <li></li>
                        </div>
                        <div className="range-labels">
                            <span className={this.state['range'+i]==='0' ? "active-text" : "inactive-text-0"}>0</span>
                            <span className={this.state['range'+i]==='1' ? "active-text" : "inactive-text"}>1</span>
                            <span className={this.state['range'+i]==='2' ? "active-text" : "inactive-text"}>2</span>
                            <span className={this.state['range'+i]==='3' ? "active-text" : "inactive-text"}>3</span>
                            <span className={this.state['range'+i]==='4' ? "active-text" : "inactive-text"}>4</span>
                            <span className={this.state['range'+i]==='5' ? "active-text" : "inactive-text-0"}>5</span>
                        </div>
                        <input type="range" min="0" max="5" value={this.state['range'+i]} 
                            onChange={e =>{ this.setState({['range'+i]:e.target.value})}} className="score_slider"/>
                    </div>
                </div>
    }
    
    range_textarea_component = (i) => {
        
        return  <div key={"textarea_input" + i}>
                    <div className="poll_question_text">
                        <FormattedMessage id={"question_textarea"+i} />
                    </div>
                    <div className="poll_answer_text">    
                        <Input type="textarea" name="text" className="text_area" id="scrollbar" placeholder="Type something!"
                                value={this.state['textarea'+i]} 
                                onChange={(e) => {this.setState({['textarea'+i]: e.target.value})} }/>
                    </div>
                </div>
    }

    render(){
        if(this.state.is_404){

            return (
                <div>
                    <h3>
                        <FormattedMessage id="page404" />
                    </h3>
                </div>
            )

        }else{

            return (
                <div className="UserPost">
                    <Breadcrumb tag="nav" listTag="div" className="top-bread">
                        <BreadcrumbItem> 
                            <NavLink to="/review_list/posts" onClick={()=>{this.props.set_bar_hidden(false);}} className="root_item"> 
                                <FormattedMessage id="provide_feedback" />
                            </NavLink>
                            <i className="fas fa-caret-right" aria_hidden="true"></i>
                        </BreadcrumbItem>
                        <BreadcrumbItem active tag="span" className="child_item"> {this.state.username} </BreadcrumbItem>
                    </Breadcrumb> 

                    <Label for="comment" className='Feedback_to'>
                        <FormattedMessage id="feedback_for" values={{name:this.state.username}}/>
                    </Label>
                    <div className="progress_bar_div">
                        <Progress value={this.calculate_completeness()*100} className="progress_bar"/>
                    </div>
                    <div className="poll" id="scrollbar">
                        <div style={{
                                display: this.state.part_opacity === 0 ? "none" : "block",
                                pointerEvents: this.state.part_opacity === 1 ? "auto" : "none",
                                opacity: this.state.part_opacity
                            }}>
                            <div className="partBar">
                                <div className="partBar-text">
                                    <div onClick={()=>{this.set_part1_focus(true)}} style={{ textDecoration: 'none' }}>
                                        <div className={!this.state.part1_focus? "tabItem lefttab" : "tabSelectItem lefttab"}>
                                            <div ref={this.part1_ref}>
                                                <span>PART 1</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div onClick={()=>{this.set_part1_focus(false)}} style={{ textDecoration: 'none' }}>
                                        <div className={this.state.part1_focus? "tabItem" : "tabSelectItem"}>
                                            <div ref={this.part2_ref}>
                                                <span>PART 2</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="underlineparent">
                                    <div style={{
                                        position: "absolute", 
                                        left: this.state.underline_x,
                                        margin: "0px", 
                                        width: this.state.underline_width+"px"}} 
                                        hidden={this.state.navbar_hidden} className="barunderline" />
                                </div>
                            </div>
                            <div>
                                <div style={{position:"absolute", pointerEvents: this.state.part1_opacity === 1 ? "auto" : "none", opacity: this.state.part1_opacity}}>
                                    {[...Array(5).keys()].map((i)=>(this.range_input_component(i)))}
                                </div>
                                <div style={{position:"absolute", pointerEvents: this.state.part2_opacity === 1 ? "auto" : "none", opacity: this.state.part2_opacity}}>
                                    {[...Array(2).keys()].map((i)=>(this.range_textarea_component(i)))}  
                                    {this.range_input_component(5)}
                                </div> 
                            </div>
                        </div>
                        <div style={{opacity: this.state.confirm_opacity, display: this.state.confirm_opacity === 0 ? "none" : "block"}}>
                            <Review noTitle {...this.state} />                    
                        </div>
                    </div>
                    <div className="ThreeButton">

                        <NavLink to="/review_list/posts" style={{display: !this.state.confirm_focus && this.state.part1_focus ? "inline" : "none"}}>
                            <Button color="primary" outline className="cancel-button" onClick={()=>{this.props.set_bar_hidden(false);}}>
                                <FormattedMessage id="cancel" /> 
                            </Button>
                        </NavLink>
                        <Button color="primary" outline className="cancel-button" onClick={this.click_prev}
                            style={{display: this.state.confirm_focus || !this.state.part1_focus ? "inline" : "none"}}>
                            <FormattedMessage id="back" />
                        </Button>
                        
                        <Button color="primary" outline className="save-button" onClick={()=>{this.submit(true)}}>
                            <FormattedMessage id="save" />
                        </Button>
                        <Button color="primary" className="next-button" onClick={this.click_next}
                            style={{display: !this.state.confirm_focus ? "inline" : "none"}}>
                            <FormattedMessage id="next_page" />
                        </Button>
                        
                        <Button color="primary" className="next-button" onClick={this.click_next}
                            style={{display: this.state.confirm_focus  ? "inline" : "none"}}>
                            <FormattedMessage id="submit" />
                        </Button>
                        {/* For further using */}
                        <ReactTooltip id="submit" effect="float" type='light' globalEventOff='click' border={true} className="NameToolTip_Border">
                            Huh?
                        </ReactTooltip>
                    </div>

                    {/* finish Modal*/}
                    <ToastModal isOpen={this.state.finishModalToggleOpen} toggle={this.finishModalToggle} />

                </div>
            );
        }
    }
};
