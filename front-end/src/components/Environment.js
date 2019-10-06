import React from 'react'

export default function Environment(props) {
    return (
        <div className="environment-card">
           <div className="name">{props.name}</div> 
           <div className="metric">{props.metric}<span>{props.qualifier}</span></div>
        </div>
    )
}
