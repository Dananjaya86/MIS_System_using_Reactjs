import React from 'react'
import './menubar.css'
import { NavLink } from 'react-router-dom'

export default function 
()



{
  return (
    <div>
       

<div className="sidebar">
      <h2><NavLink to="/Dashboard">Dashboard</NavLink></h2>
      <ul>
        <li><NavLink to="/CustomerDetails">Customer Details</NavLink></li>
        <li><NavLink to="/SupplierDetails">Supplier Details</NavLink></li>
        <li><NavLink to="/ProductDetails">Product Details</NavLink></li>
        <li><NavLink to="/Production">Production</NavLink></li>
        <li><NavLink to="/GRN">GRN</NavLink></li>
        <li><NavLink to="/Sales">Sales</NavLink></li>
        <li><NavLink to="/Reports">Reports</NavLink></li>
        <li><NavLink to="/Admin">Admin</NavLink></li>
        <li id="logout"><NavLink to="/">Logout</NavLink></li>
      </ul>
    </div>

    </div>
  )
}
