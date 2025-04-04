import React from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

const Layout = ({ children }) => {
  return (
    <div>
      <Navbar />
      <div className="d-flex">
        <Sidebar />
        <div className="flex-grow-1 p-4">{children}</div>
      </div>
    </div>
  );
};

export default Layout;
