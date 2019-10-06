import React from 'react'
import './Header.css'
import Clock from './Clock'

export default function Header() {
    const user = "User"
    return (
        <div className="app-header">
            Hello {user} 
            <Clock />
        </div>
    )
}
