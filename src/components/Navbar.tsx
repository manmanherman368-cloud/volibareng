import React, { useState } from 'react';
import {
  Calendar,
  Users,
  Bell,
  User,
  ChevronDown,
  Plus,
  KeyRound,
  Shield,
  Wallet
} from 'lucide-react';
import { Team, UserProfile, UserRole } from '../types';

interface NavbarProps {
  currentTab: 'jadwal' | 'kas' | 'anggota' | 'notifikasi' | 'profil';
  setCurrentTab: (tab: 'jadwal' | 'kas' | 'anggota' | 'notifikasi' | 'profil') => void;
  teams: Team[];
  activeTeam: Team | null;
  onSelectTeam: (team: Team) => void;
  currentUser: UserProfile;
  currentRole: UserRole | null;
  unreadCount: number;
  onOpenCreateTeam: () => void;
  onOpenJoinTeam: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  teams,
  activeTeam,
  onSelectTeam,
  currentUser,
  currentRole,
  unreadCount,
  onOpenCreateTeam,
  onOpenJoinTeam,
}) => {
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);

  return (
    <>
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/20 text-slate-950">
              <span className="text-xl">🏐</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-400 bg-clip-text text-transparent">
                  VoliBareng
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  MVP
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Jadwal & Kehadiran Tim Voli
              </p>
            </div>
          </div>

          {/* Active Team Dropdown */}
          <div className="relative">
            <button
              onClick={() => setTeamDropdownOpen(!teamDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 transition shadow-sm"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="max-w-[130px] sm:max-w-[180px] truncate text-left">
                {activeTeam ? activeTeam.name : 'Pilih Tim'}
              </span>
              {currentRole === 'admin' && (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                  Admin
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {teamDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setTeamDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 text-xs text-slate-200">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800/80 mb-1">
                    Daftar Tim Kamu
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {teams.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          onSelectTeam(t);
                          setTeamDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition ${
                          activeTeam?.id === t.id
                            ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="truncate">
                          <p className="truncate font-semibold">{t.name}</p>
                          <p className="text-[10px] text-slate-400 font-normal">
                            Kode: {t.code} • {t.memberCount || 1} Anggota
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 mt-1 border-t border-slate-800 space-y-1">
                    <button
                      onClick={() => {
                        setTeamDropdownOpen(false);
                        onOpenJoinTeam();
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-sky-400" />
                      <span>Gabung Tim dengan Kode</span>
                    </button>
                    <button
                      onClick={() => {
                        setTeamDropdownOpen(false);
                        onOpenCreateTeam();
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-amber-400 font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Buat Komunitas/Tim Baru</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setCurrentTab('jadwal')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                currentTab === 'jadwal'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Jadwal Main</span>
            </button>

            <button
              onClick={() => setCurrentTab('kas')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                currentTab === 'kas'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Uang Kas</span>
            </button>

            <button
              onClick={() => setCurrentTab('anggota')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                currentTab === 'anggota'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Anggota Tim</span>
            </button>

            <button
              onClick={() => setCurrentTab('notifikasi')}
              className={`relative flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                currentTab === 'notifikasi'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Pengingat & Log</span>
              {unreadCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-extrabold animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab('profil')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                currentTab === 'profil'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <span className="text-sm">{currentUser.avatar || '🏐'}</span>
              <span>{currentUser.displayName.split(' ')[0]}</span>
            </button>
          </nav>

        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 py-1.5 px-2">
        <div className="grid grid-cols-5 gap-0.5 text-center">
          <button
            onClick={() => setCurrentTab('jadwal')}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition ${
              currentTab === 'jadwal'
                ? 'text-amber-400 font-bold bg-amber-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Jadwal</span>
          </button>

          <button
            onClick={() => setCurrentTab('kas')}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition ${
              currentTab === 'kas'
                ? 'text-amber-400 font-bold bg-amber-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wallet className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Kas</span>
          </button>

          <button
            onClick={() => setCurrentTab('anggota')}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition ${
              currentTab === 'anggota'
                ? 'text-amber-400 font-bold bg-amber-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Anggota</span>
          </button>

          <button
            onClick={() => setCurrentTab('notifikasi')}
            className={`relative flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition ${
              currentTab === 'notifikasi'
                ? 'text-amber-400 font-bold bg-amber-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Pengingat</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-2 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('profil')}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition ${
              currentTab === 'profil'
                ? 'text-amber-400 font-bold bg-amber-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Profil</span>
          </button>
        </div>
      </div>
    </>
  );
};
