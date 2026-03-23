import React, { Component } from 'react'


export default class Clock extends Component {
    constructor(props) {
      super(props);
      this.state = { 
        date: new Date()
      };
    }
  
    componentDidMount() {
      this.timerID = setInterval(() => this.tick(), 1000);
    }
  
    componentWillUnmount() {
      clearInterval(this.timerID);
    }
  
    tick() {
      this.setState({
        date: new Date()
      });
    }
  
    render() {
      const {date} = this.state
      const hoursDegrees = date.getHours();
      const minutesDegrees = date.getMinutes();

      const renderHours = hoursDegrees === 0 ? '00' : hoursDegrees
      const renderMinutes = minutesDegrees < 10 ? '0' + minutesDegrees : minutesDegrees

      return(
        <div>{renderHours}:{renderMinutes}</div>
      )
    }
}