
import React, { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import UserProfile from "./UserProfile";

interface MainLayoutProps {
  children?: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default MainLayout;
