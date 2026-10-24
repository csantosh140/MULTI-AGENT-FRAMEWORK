import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertOctagon, FiTerminal, FiHome } from 'react-icons/fi';
import Button from '../components/Button';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#090d16] text-[#10b981] font-mono flex flex-col items-center justify-center p-4 select-none relative overflow-hidden">
      {/* Background Matrix/Grid Glare */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] pointer-events-none" />
      <div className="absolute inset-0 bg-radial-gradient(circle_at_center,transparent_40%,#000_100%) pointer-events-none" />
      
      <div className="max-w-xl w-full border border-red-500/30 rounded-xl bg-black/85 shadow-2xl shadow-red-500/5 p-6 md:p-8 space-y-6 relative z-10">
        
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-red-500/30 pb-3">
          <div className="flex items-center space-x-2 text-red-500">
            <FiAlertOctagon className="w-5 h-5 animate-pulse" />
            <span className="font-bold text-xs uppercase tracking-wider">Security Interceptor Blocked (404)</span>
          </div>
          <div className="flex space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
          </div>
        </div>

        {/* Code Trace Console */}
        <div className="space-y-3.5 text-xs md:text-sm leading-normal">
          <div className="flex items-center space-x-2 text-red-500">
            <FiTerminal />
            <span>sys_firewall_interceptor.sh --check-status</span>
          </div>
          
          <div className="text-red-500/90 font-bold border-l-2 border-red-500 pl-3 py-1 space-y-1">
            <p>[STATUS] packet_routed_error: 404 NOT FOUND</p>
            <p>[ACTION] access_denied: TARGET NODE UNREACHABLE OR RESTRICTED</p>
          </div>

          <div className="text-text-muted/65 space-y-1 pl-5">
            <p>&gt; Requesting route trace... failed.</p>
            <p>&gt; Checking authorization token... key_expired.</p>
            <p>&gt; Diagnostic log: Endpoint path does not bind to active routes.</p>
            <p>&gt; Firewall security audit status: ACTIVE (Autonomous Containment Mode)</p>
          </div>
        </div>

        {/* Visual Terminal Warnings */}
        <div className="p-4 bg-red-500/5 border border-red-500/25 rounded-lg flex items-start space-x-3 text-red-500 text-xs leading-relaxed">
          <FiAlertOctagon className="w-5 h-5 flex-shrink-0 mt-0.5 animate-bounce" />
          <div>
            <span className="font-bold text-red-400">ACCESS RESTRICTED:</span> The page route parameter you requested does not exist on this security ops dashboard. It may have been blocked or removed by local security rules.
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center border-t border-red-500/20 pt-5">
          <Button
            variant="danger"
            onClick={() => navigate('/dashboard')}
            icon={FiHome}
            className="text-xs font-semibold px-6 py-2.5 font-mono shadow-md shadow-red-500/10 hover:shadow-red-500/30"
          >
            Go Back Home
          </Button>
        </div>

      </div>
    </div>
  );
};

export default NotFound;
