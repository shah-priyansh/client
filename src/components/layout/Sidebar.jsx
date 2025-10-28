import { Home, LogOut, MapPin, MessageCircle, UserCheck, Users, X, Inbox, Package } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { logoutUser } from '../../store/slices/authSlice';
import { Button } from '../ui';

const Sidebar = ({ open, setOpen }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Inquiries', href: '/inquiries', icon: Inbox, adminOnly: true },
    { name: 'Clients', href: '/clients', icon: UserCheck, adminOnly: true },
    { name: 'Employees', href: '/employees', icon: Users, adminOnly: true },
    { name: 'Areas', href: '/areas', icon: MapPin, adminOnly: true },
    { name: 'Products', href: '/products', icon: Package, adminOnly: true },
  ];

  const isActive = (href) => {
    return location.pathname === href;
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      {open && (
        <div className="fixed inset-0 flex z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* Mobile sidebar content */}
            <div className="flex-1 h-0 pt-5 pb-4 flex flex-col">
              <div className="flex-shrink-0 flex items-center justify-center px-4 py-4">
                <img src="/images/logo-1.png" alt="BizKey" className="h-12 w-auto object-contain" />
              </div>
              <nav className="mt-5 px-2 space-y-1 flex-1">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setOpen(false)}
                    className={`group flex items-center px-3 py-2 text-base font-medium rounded-lg transition-all duration-200 ${isActive(item.href)
                        ? 'text-blue-600 border-l-4 border-blue-500'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm'
                      }`}
                  >
                    <item.icon
                      className={`mr-4 h-6 w-6 ${isActive(item.href)
                          ? 'text-blue-600'
                          : 'text-gray-400 group-hover:text-gray-600'
                        }`}
                    />
                    {item.name}
                  </NavLink>
                ))}
              </nav>

              {/* Logout button for mobile */}
              <div className="px-2 pb-4">
                <button
                  onClick={handleLogout}
                  className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 w-full"
                >
                  <LogOut className="mr-4 h-6 w-6 text-red-400 group-hover:text-red-500" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
            <div className="flex-1 flex flex-col pt-5 pb-4">
              <div className="flex items-center justify-center gap-2 py-4 h-[45px] w-[180px]">
                <img src="/images/logo.png" alt="BizKey" className=" w-auto object-contain" />
                {/* <h2 className="text-lg font-semibold text-gray-900">BizKey</h2> */}
              </div>
              <nav className="mt-5 flex-1 px-2 bg-white space-y-1 overflow-y-auto">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isActive(item.href)
                        ? 'text-blue-600 border-l-4 border-blue-500'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm'
                      }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 ${isActive(item.href)
                          ? 'text-blue-600'
                          : 'text-gray-400 group-hover:text-gray-600'
                        }`}
                    />
                    {item.name}
                  </NavLink>
                ))}
              </nav>

              {/* Logout button for desktop */}
              <div className="px-2 pb-4 flex justify-center m-auto w-full max-w-full">
                <Button
                  variant="outline"
                  className="group w-full m-auto flex items-center  border-destructive text-destructive text-sm font-medium rounded-md w-full hover:bg-destructive hover:text-white"
                  size="sm"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-3 h-5 w-5 " />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
