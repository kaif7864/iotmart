import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Navbar from '../components/navigation/Navbar';
import Footer from '../components/navigation/Footer';
import { Scale, X, ArrowRight } from 'lucide-react';

const UserLayout = () => {

  return (
    <div className="min-h-screen bg-app-bg flex flex-col font-sans relative">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />


    </div>
  );
};

export default UserLayout;
