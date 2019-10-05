import React, { Component } from 'react'
import './App.css'
import config from './config'
import { Switch, Route } from 'react-router-dom'
import Header from './components/Header'
import DoughnutRender from './components/DoughnutRender'
import PageTwo from './components/PageTwo'

export default class App extends Component {
  constructor(props){
    super(props)
    this.state = {
      current_temp: '',
      error: null
    }
  }

  componentDidMount(){
    fetch(`http://api.openweathermap.org/data/2.5/forecast?lat=45.5&lon=-122.64&units=imperial&APPID=${config.OPEN_WEATHER_KEY}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(res.status)
        }
        return res.json()
      }).then(res => {
        // console.log(res)
      }).catch(error => {
        console.log(error)
        this.setState({
          error
        })
      })
    fetch(`${config.IOT_ENDPOINT_URL}${config.IOT_KEY}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(res.status)
        }
        return res.json()
      }).then(res => {
        console.log(res)
        this.setState({
          current_temp: res.last_value
        })
      }).catch(error => {
        console.log(error)
        this.setState({
          error
        })
      })
  }

  render() {
    const showError = this.state.error ? <div className="error-msg">{this.state.error.message}</div> : ''
   
    return (
      <>
        <Header />
        <main>
          {showError}
          <h2>{this.state.current_temp}</h2>
          <Switch>
          <Route 
              path="/page-two"
              component={PageTwo}
            />
          </Switch>
        </main>
      </>
    )
  }
}



