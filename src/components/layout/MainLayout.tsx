
import React from "react";
import Sidebar from "./Sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        <div className="page-container">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
