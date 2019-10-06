import React, { Component } from 'react'
import './CardContainer.css'
import Environment from './Environment.js'

export default class CardContainer extends Component {
	constructor() {
		super()
		this.state = {
			insideTemp: null,
			insideHumidity: null,
			outsideTemp: null,
			outsideHumidity: null,
			windSpeed: null,
		}
	}
	componentWillReceiveProps(nextProps) {
		if (this.props !== nextProps) {
			console.log(';')
			this.setState({
				insideTemp: Number(nextProps.insideData[0].metric),
				insideHumidity: Number(nextProps.insideData[1].metric),
				outsideTemp: Number(nextProps.outsideData[0].metric),
				outsideHumidity: Number(nextProps.outsideData[1].metric),
				windSpeed: Number(nextProps.outsideData[2].metric),
			})
		}
	}

	getDryTime = (tempF, humidity, windspeed) => {
		const tempC = ((tempF - 32) * 5) / 9
		const tempK = tempC + 273.15
		const x = 21.07 - 5336 / tempK
		const delta = (Math.exp(x) * 5336) / (tempK * tempK)
		const lambda = 2.501 - 0.002361 * (tempK - 273)
		const gamma = (0.0016286 * 101.3) / lambda
		const d = (1 - humidity) * Math.exp(x)
		const rn = (340 * 30 * 60) / 1000000
		const e =
			(delta * rn + 6.43 * gamma * d * (1 + 0.536 * windspeed)) /
			(lambda * (delta + gamma))
		const rho = 1000
		const rhoe = (e * rho) / (1000 * 60 * 60 * 24)
		const mass = 0.075
		const surfaceArea = 0.75
		const t = mass / (rhoe * surfaceArea * 60)
		const hours = Math.floor(t / 60)
		const minutes = Math.floor(t % 60)
		const time = [hours, minutes]
		return time
	}

	render() {
		const { insideTemp, insideHumidity } = this.state
		const realInsideHumidity = insideHumidity / 100
		const { outsideTemp, outsideHumidity, windSpeed } = this.state
		const realOutsideHumidity = outsideHumidity / 100
		const insideDrytime = this.getDryTime(
			insideTemp,
			realInsideHumidity,
			0,
		)
		const outsideDrytime = this.getDryTime(
			outsideTemp,
			realOutsideHumidity,
			windSpeed,
		)

		// console.log(
		// 	`inside temp`,
		// 	insideTemp,
		// 	`inside humidity`,
		// 	realInsideHumidity,
		// )
		// console.log(`hello drytime`, insideDrytime)
		const insideInfo = this.props.insideData.map((data, i) => {
			return <Environment key={i} name={data.name} metric={data.metric} qualifier={data.metric_qualifier}/>
		})
		const outsideInfo = this.props.outsideData.map((data, i) => {
			return <Environment key={i} name={data.name} metric={data.metric} qualifier={data.metric_qualifier}/>
		})
		return (
			<section className='card-container'>
				<div className='dry-time-card dry-time-card-left'>
					<h2>Inside Drying</h2>
					{insideInfo}
					<div>
						<h3>Time to dry</h3>
						<div className="time-to-dry">
							<span>{insideDrytime[0]} Hours</span>
							<span>{insideDrytime[1]} Minutes</span>
						</div>
					</div>
				</div>
				<div className='dry-time-card dry-time-card-right'>
					<h2>Outside Drying</h2>
					{outsideInfo}
					<div>
						<h3>Time to dry</h3>
						<div className="time-to-dry">
							{outsideDrytime[0] === 0 ? null : (
								<span>
									{outsideDrytime[0]}{' '}
									{outsideDrytime[0] <= 1
										? 'Hour'
										: 'Hours'}
								</span>
							)}
							{outsideDrytime[1] === 0 ? null : (
								<span>
									{outsideDrytime[1]}{' '}
									{outsideDrytime[1] <= 1
										? 'Minute'
										: 'Minutes'}
								</span>
							)}
						</div>
					</div>
				</div>
			</section>
		)
	}
}
