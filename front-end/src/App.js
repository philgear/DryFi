import React, { Component } from 'react'
import './App.css'
import config from './config'
// import { Switch, Route } from 'react-router-dom'
import Header from './components/Header'
import CardContainer from './components/CardContainer'
// import PageTwo from './components/PageTwo'

export default class App extends Component {
  constructor(props){
    super(props)
    this.state = {
      current_rm_temp: {
        metric: null,
        metric_qualifier: '\u00b0 F',
        name:"Current Room Temperature"
      },
      current_rm_humidity: {
        metric: null,
        metric_qualifier: '%',
        name:"Current Humidity"
      },
      current_ext_temp:  {
        metric: null,
        metric_qualifier: '\u00b0 F',
        name:"Current External Temperature"
      },
      current_ext_humidity:  {
        metric: null,
        metric_qualifier: '%',
        name:"Current External Humidity"
      },
      current_wind:  {
        metric: null,
        metric_qualifier: 'm/s',
        name:"Current Wind Speed"
      },
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
        const { current_ext_humidity, current_ext_temp, current_wind } = this.state
        const ext_humidity = Number(res.list[0].main.humidity).toFixed(1)
        const ext_temp = Number(res.list[0].main.temp).toFixed(1)
        const wind = Number(res.list[0].wind.speed).toFixed(1)
        this.setState({ 
          current_ext_humidity: {name: current_ext_humidity.name, metric_qualifier: current_ext_humidity.metric_qualifier, metric: ext_humidity},
          current_ext_temp: {name: current_ext_temp.name, metric_qualifier: current_ext_temp.metric_qualifier, metric: ext_temp},
          current_wind: {name: current_wind.name, metric: wind, metric_qualifier: current_wind.metric_qualifier}
        })
      }).catch(error => {
        console.log(error)
        this.setState({
          error
        })
      })
    fetch(`${config.IOT_ENDPOINT_URL}/temperature?x-aio-key=${config.IOT_KEY}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(res.status)
        }
        return res.json()
      }).then(res => {
        // console.log(res)
        const rm_temp = Number(res.last_value).toFixed(1)
        const { current_rm_temp } = this.state
        this.setState({
          current_rm_temp:{name: current_rm_temp.name, metric_qualifier: current_rm_temp.metric_qualifier, metric: rm_temp }
        })
      }).catch(error => {
        console.log(error)
        this.setState({
          error
        })
      })
      fetch(`${config.IOT_ENDPOINT_URL}/humidity?x-aio-key=${config.IOT_KEY}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(res.status)
        }
        return res.json()
      }).then(res => {
        // console.log(res)
        const rm_humidity = Number(res.last_value).toFixed(1)
        const { current_rm_humidity } = this.state
        this.setState({
          current_rm_humidity: {name: current_rm_humidity.name, metric_qualifier: current_rm_humidity.metric_qualifier, metric: rm_humidity}
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
    const { current_ext_temp, current_rm_temp, current_ext_humidity, current_rm_humidity,  current_wind } = this.state
    const insideData = [ current_rm_temp, current_rm_humidity  ]
    const outsideData=[current_ext_temp, current_ext_humidity, current_wind]
   
    return (
      <>
        <Header />
        <main className="main-container">
          {showError}
          <CardContainer 
            insideData={insideData}
            outsideData={outsideData}
          />
          {/* <Switch>
          <Route 
              path="/page-two"
              component={PageTwo}
            />
          </Switch> */}
        </main>
      </>
    );
  }
}



