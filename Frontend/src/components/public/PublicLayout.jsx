import { Outlet } from 'react-router-dom';
import PublicNavbar from './PublicNavbar';
import PublicFooter from './PublicFooter';
import './PublicComponents.css';

export default function PublicLayout({ children }) {
  return (
    <div className="public-shell">
      <PublicNavbar />
      {children || <Outlet />}
      <PublicFooter />
    </div>
  );
}
