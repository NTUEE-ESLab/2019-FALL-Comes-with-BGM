import cookie from 'react-cookies'
import React, { Component } from 'react';
import { BrowserRouter } from 'react-router-dom'
import { Switch, Route, Redirect } from "react-router-dom";
import {addLocaleData, IntlProvider} from 'react-intl';

import Blog from './containers/Blog/Blog'
import Login from './containers/Login/Login'
import en from 'react-intl/locale-data/en';
import zh from 'react-intl/locale-data/zh';

import "./App.css"


import zh_CN from './locale/zh-CN.js'; 
import en_US from './locale/en-US.js';
addLocaleData([...en, ...zh]);

class App extends Component {
	
	constructor(props){
		super(props);

		this.state={ lang : cookie.load('lang') || "en" }
		this.changeLanguage = this.changeLanguage.bind(this)
		this.getLanguage = this.getLanguage.bind(this)
	}

	changeLanguage(lang) {

		cookie.save('lang', lang, { path: '/' })
		this.setState({
			lang: lang
		})

	}

	getLanguage() {

		return this.state.lang;

	}
	render() {
		let messages = {}
		messages['en'] = en_US;
		messages['zh'] = zh_CN;
		return (
			<IntlProvider locale={this.state.lang} messages={messages[this.state.lang]}>
				<BrowserRouter>	
					<div className="App">
					<Switch>
						<Route exact path="/login" component={Login} />
                        <Route path="/" render={() => (
							<Blog changeLanguage={this.changeLanguage} getLanguage={this.getLanguage} />)}/>
						<Redirect from="/home" to="/" />
					</Switch>
					</div>
				</BrowserRouter>
			</IntlProvider>
			
		)
	}
}

export default App