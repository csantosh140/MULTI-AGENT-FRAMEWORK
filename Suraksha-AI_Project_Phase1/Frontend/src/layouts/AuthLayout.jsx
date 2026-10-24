import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen w-full bg-bg-custom text-text-custom flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      {/* Dynamic Cyber Security Background Grid Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-accent-custom/5 via-transparent to-transparent pointer-events-none blur-3xl" />
      
      <div className="relative z-10 w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
