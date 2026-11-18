import type { ReactNode } from 'react';
import DashboardWorkspace from './DashboardWorkspace';
import './dashboard.css';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dashboard-workspace">
      <DashboardWorkspace>{children}</DashboardWorkspace>
    </div>
  );
}
