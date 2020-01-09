import React, { Component } from "react";
import { FormattedMessage  } from 'react-intl';
import '../Review/Review.css'

export default class Review extends Component {
    range_input_component = (i) => {
        return  <div key={"range_input" + i}>
                    <div className="question_text">
                        <FormattedMessage id={"question_range"+i} />
                    </div>
                    <div className="digit_text">
                        {this.props['range'+i]} / 5
                    </div>
                </div>
    }
    range_textarea_component = (i) => {
        
        return  <div key={"textarea_input" + i}>
                    <div className="question_text">
                        <FormattedMessage id={"question_textarea"+i} />
                    </div>
                    <div className={i===2 ? "digit_text" : "answer_text"}>
                        {this.props['textarea'+i]}
                    </div>
                </div>
    }
    render(){
        return <div className='poll_review'>
            {(()=>{
                if(!this.props.noTitle)
                    return  <div className='Feedback_from'>
                                <span>
                                    Feedback for {this.props.comment_to} by {this.props.comment_from}
                                </span>
                            </div>
            })()}
            
            <div className='part_num'>
                <span>
                    PART 1
                </span>
            </div>
            <div>
                {[...Array(5).keys()].map((i)=>(this.range_input_component(i)))}
            </div>
            <div className='part_num'>
                <span>
                    PART 2
                </span>
            </div>
            <div>
                {[...Array(2).keys()].map((i)=>(this.range_textarea_component(i)))}  
                {this.range_input_component(5)}                  
            </div> 
        </div>
    }
};
