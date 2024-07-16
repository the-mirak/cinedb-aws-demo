import React from 'react';
import { Search, User, LogIn } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="bg-gray-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-yellow-400">MovieDB</span>
          </div>
          <div className="flex items-center">
            <div className="relative mx-4">
              <input
                type="text"
                placeholder="Search movies..."
                className="bg-gray-800 text-white rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <button className="p-2 rounded-full text-gray-300 hover:text-white">
              <User className="h-6 w-6" />
            </button>
            <button className="ml-4 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-yellow-400 hover:bg-yellow-500">
              <LogIn className="h-5 w-5 mr-2" />
              Login
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;