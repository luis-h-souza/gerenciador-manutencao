// src/components/layout/AsideMenu/NavItem.jsx
import React from 'react';
import { NavLink } from "react-router-dom";

export default function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
      style={{ whiteSpace: "nowrap" }}
    >
      <Icon size={17} className="nav-icon shrink-0" />
      <span>{label}</span>
    </NavLink>
  );
}
