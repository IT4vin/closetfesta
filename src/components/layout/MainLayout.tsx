import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import UserProfile from "./UserProfile";

const MainLayout = () => {
  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
