import React, { Component } from 'react'
import { Bar } from 'react-chartjs-2'

export default class DoughnutRender extends Component {
    render() {
        return (
            <Bar
        
                width={100}
                height={50}
                options={{ maintainAspectRatio: false }}
            />
        )
    }
}
