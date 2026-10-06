import React, { useState } from 'react';
import { NavigationTab, UserProfile } from '../types';
import {
  Menu,
  Sparkles,
  Plus,
  RotateCcw,
  Database,
  Search,
  Mic,
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  User,
  Settings,
  Shield,
  LogOut,
  ChevronDown,
  ExternalLink,
  Layers,
  Briefcase,
} from 'lucide-react';

interface TopBarProps {
  currentTab: NavigationTab;
  onOpenMobile: () => void;
  onQuickAction: (action: 'client' | 'project' | 'task' | 'invoice') => void;
  onToggleSampleData: () => void;
  isSampleData: boolean;
  onAskAuraQuick: () => void;
  onOpenVoiceModal?: () => void;
  onOpenQuickAdd?: () => void;
  onOpenFeatureCenter?: () => void;
  onOpenGlobalSearch?: () => void;
  onOpenClientIntake?: () => void;
  onNavigate?: (tab: NavigationTab) => void;
  user?: UserProfile;
  onSignOut?: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

interface SmartNotification {
  id: string;
  type: 'HIGH_PRIORITY' | 'DEADLINE' | 'OVERDUE' | 'CLIENT_FOLLOW_UP' | 'AI_RECOMMENDATION' | 'BLOCKED_TASK';
  title: string;
  description: string;
  time: string;
  targetTab: NavigationTab;
  actionText: string;
}

const INITIAL_NOTIFICATIONS: SmartNotification[] = [
  {
    id: 'notif_1',
    type: 'HIGH_PRIORITY',
    title: 'High Priority Client Proposal',
    description: 'Enterprise contract proposal for Vertex AI is marked High Priority and due today.',
    time: '10m ago',
    targetTab: 'tasks',
    actionText: 'Review Task',
  },
  {
    id: 'notif_2',
    type: 'DEADLINE',
    title: 'Upcoming Delivery Tomorrow',
    description: 'Website frontend deliverables for Horizon Labs scheduled for delivery in <24h.',
    time: '45m ago',
    targetTab: 'projects',
    actionText: 'View Project',
  },
  {
    id: 'notif_3',
    type: 'CLIENT_FOLLOW_UP',
    title: 'Client Follow-Up Suggested',
    description: 'AURA detected no reply from Apex Dynamics regarding retainer scope after 3 days.',
    time: '2h ago',
    targetTab: 'clients',
    actionText: 'Open Client',
  },
  {
    id: 'notif_4',
    type: 'AI_RECOMMENDATION',
    title: 'AURA Autonomous Sprint Plan',
    description: 'AURA generated your recommended daily work order based on deadlines and revenue impact.',
    time: '3h ago',
    targetTab: 'ai-insights',
    actionText: 'Explore Insights',
  },
];

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onOpenMobile,
  onQuickAction,
  onToggleSampleData,
  isSampleData,
  onAskAuraQuick,
  onOpenVoiceModal,
  onOpenQuickAdd,
  onOpenFeatureCenter,
  onOpenGlobalSearch,
  onOpenClientIntake,
  onNavigate,
  user,
  onSignOut,
  searchQuery,
  setSearchQuery,
}) => {
  const [notifications, setNotifications] = useState<SmartNotification[]>(INITIAL_NOTIFICATIONS);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const getTabTitle = (tab: NavigationTab) => {
    switch (tab) {
      case 'overview':
        return 'AURA Command Center';
      case 'features':
        return 'AURA Freelance & Business Workspace';
      case 'clients':
        return 'Client Relationships';
      case 'projects':
        return 'Active Project Pipelines';
      case 'tasks':
        return 'Task Matrix';
      case 'calendar':
        return 'Deliverable Timelines & Calendar';
      case 'finance':
        return 'Finance & Cashflow';
      case 'invoices':
        return 'Invoices & Billing Ledger';
      case 'analytics':
        return 'Workspace Analytics';
      case 'ask-aura':
        return 'Ask AURA Intelligence';
      case 'ai-insights':
        return 'Executive AI Insights';
      case 'approvals':
        return 'AI Approval Center';
      case 'automations':
        return 'Automation Engine';
      case 'connected-accounts':
        return 'Connected Accounts & Integrations';
      case 'settings':
        return 'Workspace Settings & Policies';
      default:
        return 'AURA Workspace';
    }
  };

  const handleDismissNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const displayName = user?.name || 'Noor Fatima';
  const displayRole = user?.workspaceType || user?.accountType || user?.role || 'Pro Workspace';
  const displayEmail = user?.email || 'workingbynoor@gmail.com';

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header
      id="aura-topbar"
      className="sticky top-0 z-30 h-16 bg-[#05070D]/90 backdrop-blur-md border-b border-white/5 px-4 lg:px-8 flex items-center justify-between"
    >
      {/* Left: Mobile trigger & view title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#111827] cursor-pointer"
          title="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-sm sm:text-base font-display font-bold text-white tracking-tight flex items-center space-x-2">
            <span>{getTabTitle(currentTab)}</span>
          </h1>
        </div>
      </div>

      {/* Middle: Global Search trigger with Ctrl+K / Cmd+K */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
        <div
          onClick={onOpenGlobalSearch}
          className="relative w-full cursor-pointer group"
          title="Global Search (Ctrl + K / Cmd + K)"
        >
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 group-hover:text-cyan-400 transition-colors" />
          <input
            type="text"
            readOnly
            value={searchQuery}
            placeholder="Search tasks, projects, clients, work vault, or features..."
            className="w-full bg-[#0D1220] border border-white/10 group-hover:border-cyan-500/40 rounded-xl py-1.5 pl-9 pr-14 text-xs text-gray-200 placeholder-gray-400 cursor-pointer focus:outline-none transition-colors"
          />
          <kbd className="absolute right-2.5 top-2 px-1.5 py-0.5 text-[10px] font-mono font-medium text-gray-400 bg-white/5 border border-white/10 rounded pointer-events-none group-hover:border-cyan-500/40 group-hover:text-cyan-300 transition-colors">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Actions, Notifications, and User Profile */}
      <div className="flex items-center space-x-2 sm:space-x-2.5">
        {/* Dataset Toggle (Clean vs Populated) */}
        <button
          id="btn-toggle-dataset"
          onClick={onToggleSampleData}
          title={
            isSampleData
              ? 'Click to switch to Pure Clean Slate (0 Clients, 0 Projects, $0)'
              : 'Click to populate Active Business Pipeline data for testing'
          }
          className={`hidden xl:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            isSampleData
              ? 'bg-indigo-950/40 border-indigo-500/40 text-cyan-300 hover:bg-indigo-900/50'
              : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span className="hidden 2xl:inline">
            {isSampleData ? 'Active Business' : 'Clean Slate'}
          </span>
          <RotateCcw className="w-3 h-3 ml-0.5 opacity-70" />
        </button>

        {/* Explore AURA Product Guide trigger */}
        {onOpenFeatureCenter && (
          <button
            id="btn-product-guide-topbar"
            data-testid="btn-feature-center-topbar"
            onClick={onOpenFeatureCenter}
            title="AURA Product Guide"
            className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border border-cyan-500/30 bg-[#0D1220] text-cyan-300 hover:border-cyan-400 hover:text-white text-xs font-semibold transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Product Guide</span>
          </button>
        )}

        {/* Voice Companion trigger button */}
        {onOpenVoiceModal && (
          <button
            id="btn-voice-companion-topbar"
            onClick={onOpenVoiceModal}
            title="Talk to AURA (Voice + Chat, Cmd/Ctrl + Shift + K)"
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/50 to-indigo-950/40 text-cyan-300 hover:from-cyan-900/50 hover:to-indigo-900/50 text-xs font-semibold shadow-sm shadow-cyan-900/20 transition-all cursor-pointer group"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <Mic className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Voice</span>
            <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono font-medium text-cyan-300/90 bg-[#070B14] border border-cyan-500/30 rounded shadow-inner ml-0.5">
              ⌘⇧K
            </kbd>
          </button>
        )}

        {/* Global Quick Add (Tasks & Leads) */}
        {onOpenQuickAdd && (
          <button
            id="btn-quick-add-topbar"
            onClick={onOpenQuickAdd}
            title="Quick Add (Tasks & Leads, Cmd/Ctrl + Shift + A)"
            className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border border-cyan-500/30 bg-[#0D1220] hover:border-cyan-400 text-cyan-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Quick Add</span>
          </button>
        )}

        {/* Smart Notifications Bell with Dropdown */}
        <div className="relative">
          <button
            id="btn-notifications-bell"
            onClick={() => {
              setIsNotificationsOpen((prev) => !prev);
              setIsProfileMenuOpen(false);
            }}
            title="Smart Notifications"
            className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-cyan-500 text-black text-[9px] font-extrabold flex items-center justify-center animate-pulse">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Notifications Popover */}
          {isNotificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsNotificationsOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#090D18] border border-cyan-500/40 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-[#0B0F1E]">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white tracking-wide uppercase">
                      Smart Notifications
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                      {notifications.length}
                    </span>
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={() => setNotifications([])}
                      className="text-[10px] text-gray-400 hover:text-white cursor-pointer"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto p-2 space-y-2">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-500">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400/60 mx-auto mb-1" />
                      <p>All caught up! No pending alerts.</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          if (onNavigate) onNavigate(notif.targetTab);
                          setIsNotificationsOpen(false);
                        }}
                        className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-cyan-500/30 transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-1.5">
                            {notif.type === 'HIGH_PRIORITY' || notif.type === 'OVERDUE' ? (
                              <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            ) : notif.type === 'DEADLINE' ? (
                              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            )}
                            <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                              {notif.title}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-500 font-mono shrink-0">
                            {notif.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                          {notif.description}
                        </p>
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5 text-[10px]">
                          <span className="text-cyan-400 font-medium group-hover:underline">
                            {notif.actionText} →
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleDismissNotification(notif.id, e)}
                            className="text-gray-500 hover:text-white"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile Area in Top-Right */}
        <div className="relative pl-1">
          <button
            id="btn-user-profile-topbar"
            onClick={() => {
              setIsProfileMenuOpen((prev) => !prev);
              setIsNotificationsOpen(false);
            }}
            title="User Profile & Workspace Preferences"
            className="flex items-center space-x-2.5 p-1 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors cursor-pointer group"
          >
            {/* Polished Circular Avatar */}
            <div className="relative shrink-0">
              {user?.avatarUrl || user?.photoUrl ? (
                <img
                  src={user.avatarUrl || user.photoUrl}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover border border-cyan-500/40"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 border border-cyan-400/40 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {getInitials(displayName)}
                </div>
              )}
              {/* Online emerald status indicator */}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#05070D]" />
            </div>

            {/* User name & workspace plan */}
            <div className="hidden sm:block text-left pr-1">
              <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors leading-tight">
                {displayName}
              </div>
              <div className="text-[10px] text-gray-400 leading-tight">
                {displayRole}
              </div>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors hidden sm:block" />
          </button>

          {/* User Profile Dropdown Menu */}
          {isProfileMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsProfileMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#090D18] border border-cyan-500/40 shadow-2xl z-50 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* User card info */}
                <div className="p-3 border-b border-white/10 bg-[#0B0F1E] rounded-xl mb-1.5">
                  <div className="text-xs font-bold text-white truncate">
                    {displayName}
                  </div>
                  <div className="text-[11px] text-gray-400 truncate mt-0.5">
                    {displayEmail}
                  </div>
                  <div className="mt-2 inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>{displayRole}</span>
                  </div>
                </div>

                {/* Menu items */}
                <div className="space-y-0.5 text-xs font-medium text-gray-300">
                  <button
                    onClick={() => {
                      if (onNavigate) onNavigate('settings');
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl hover:bg-white/5 hover:text-white text-left transition-colors cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span>Profile Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      if (onOpenClientIntake) onOpenClientIntake();
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl hover:bg-cyan-950/40 text-cyan-300 hover:text-cyan-200 text-left transition-colors cursor-pointer"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Discuss Your Project Form</span>
                  </button>

                  <button
                    onClick={() => {
                      if (onNavigate) onNavigate('overview');
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl hover:bg-white/5 hover:text-white text-left transition-colors cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-gray-400" />
                    <span>AURA Workspace</span>
                  </button>

                  <button
                    onClick={() => {
                      if (onNavigate) onNavigate('settings');
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl hover:bg-white/5 hover:text-white text-left transition-colors cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-gray-400" />
                    <span>Preferences & Policies</span>
                  </button>

                  <button
                    onClick={() => {
                      if (onNavigate) onNavigate('connected-accounts');
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl hover:bg-white/5 hover:text-white text-left transition-colors cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-gray-400" />
                    <span>Security & Connected Accounts</span>
                  </button>

                  {onSignOut && (
                    <div className="pt-1 mt-1 border-t border-white/5">
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onSignOut();
                        }}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/30 text-left transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
