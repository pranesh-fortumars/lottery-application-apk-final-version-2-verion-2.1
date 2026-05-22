import React from 'react';
import PageWrapper from '../components/PageWrapper';
import { Bell, Lock, Shield, User, ChevronRight, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { APP_VERSION, BUILD_VERSION } from '../config';

const UserSettings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const settingsGroups = [
    { icon: <User size={20} />, label: 'Personal Information', desc: 'Update your profile details', onClick: () => navigate('/settings/personal-info') },
    { icon: <Lock size={20} />, label: 'Change Password', desc: 'Secure your account', onClick: () => navigate('/reset-password') },
    { icon: <Bell size={20} />, label: 'Notifications', desc: 'Manage push & email alerts', onClick: () => navigate('/settings/notifications') },
    { icon: <Shield size={20} />, label: 'Privacy & Security', desc: 'Two-factor auth & devices', onClick: () => navigate('/settings/privacy') },
    { icon: <HelpCircle size={20} />, label: 'Help & Support', desc: 'Contact SMS Lottery Secretariat', onClick: () => navigate('/settings/help') }
  ];

  return (
    <PageWrapper title="SETTINGS" showBack={true}>
      <div className="bg-white min-h-screen p-4 flex flex-col items-center">
        {/* Profile Card Summary */}
        <div className="w-full max-w-sm bg-gray-50 rounded-[2.5rem] p-6 mb-8 border border-gray-100 shadow-inner flex items-center gap-4">
           <div className="w-16 h-16 bg-[#ff0033] rounded-2xl flex items-center justify-center text-white text-2xl font-black italic shadow-lg">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
           </div>
           <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Authenticated Account</p>
              <p className="text-sm font-black text-gray-900 truncate">{user?.name || 'Authorized User'}</p>
           </div>
        </div>

        {/* Settings Groups */}
        <div className="w-full max-w-sm space-y-3">
          {settingsGroups.map((group, idx) => (
            <button 
              key={idx}
              onClick={group.onClick}
              className="w-full bg-white border border-gray-100 p-5 rounded-[1.5rem] flex items-center gap-4 hover:bg-gray-50 active:scale-95 transition-all group shadow-sm"
            >
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-[#ff0033] group-hover:bg-red-50 transition-colors shadow-inner">
                 {group.icon}
              </div>
              <div className="text-left flex-1 min-w-0">
                 <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{group.label}</p>
                 <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest truncate">{group.desc}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-[#ff0033] transition-colors" />
            </button>
          ))}
        </div>

        <button 
          onClick={logout}
          className="w-full max-w-sm mt-12 h-14 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-[#ff0033] mb-10"
        >
          Terminate Session
        </button>

        <div className="mt-auto mb-10 text-center opacity-30 space-y-1">
           <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] italic">App Version: {APP_VERSION}</p>
           <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest italic">Build: {BUILD_VERSION}</p>
        </div>
      </div>
    </PageWrapper>
  );
};

export default UserSettings;
