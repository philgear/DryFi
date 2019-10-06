import React from 'react'
import './DataCard.css'

export default function DataCard(props) {
    console.log(props.content)
    return (
        <section className="card">
            <div className="card-metric">{props.metric}</div>
            <div className="card-name">{props.name}</div>
        </section>
    )
}
