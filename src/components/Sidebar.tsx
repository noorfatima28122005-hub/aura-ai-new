import React from 'react';
import { NavigationTab, UserProfile } from '../types';
import { AuraOrb } from './AuraOrb';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CheckSquare,
  Calendar,
  DollarSign,
  FileText,
  Target,
  BarChart3,
  Bot,
  Sparkles,
  Brain,
  Inbox,
  Mail,
  Clock,
  FileSpreadsheet,
  FileCheck2,
  Package,
  Award,
  Zap,
  ShieldAlert,
  Link2,
  History,
  FolderKanban,
  Settings,
  LogOut,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  user: UserProfile;
  onSignOut: () => void;
  pendingApprovalsCount: number;
  unreadMessagesCount?: number;
  pendingFollowUpsCount?: number;
  newLeadsCount?: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  user,
  onSignOut,
  pendingApprovalsCount,
  unreadMessagesCount = 0,
  pendingFollowUpsCount = 0,
  newLeadsCount = 0,
  mobileOpen,
  onCloseMobile,
}) => {
  const navSections = [
    {
      group: 'WORKSPACE',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'clients', label: 'Clients', icon: Users },
        { id: 'projects', label: 'Projects', icon: Briefcase },
        { id: 'tasks', label: 'Tasks', icon: CheckSquare },
        { id: 'calendar', label: 'Calendar', icon: Calendar },
      ],
    },
    {
      group: 'BUSINESS',
      items: [
        { id: 'finance', label: 'Finance', icon: DollarSign },
        { id: 'invoices', label: 'Invoices', icon: FileText },
        {
          id: 'leads',
          label: 'Leads',
          icon: Target,
          badge: newLeadsCount > 0 ? newLeadsCount : undefined,
        },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      ],
    },
    {
      group: 'AI INTELLIGENCE',
      items: [
        { id: 'ask-aura', label: 'Ask AURA', icon: Bot, isAi: true },
        { id: 'ai-insights', label: 'AI Insights', icon: Sparkles, isAi: true },
        { id: 'business-brain', label: 'Business Brain', icon: Brain, isAi: true },
      ],
    },
    {
      group: 'COMMUNICATION',
      items: [
        {
          id: 'unified-inbox',
          label: 'Unified Inbox',
          icon: Inbox,
          badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
        },
        { id: 'email', label: 'Email', icon: Mail },
        {
          id: 'follow-ups',
          label: 'Follow-ups',
          icon: Clock,
          badge: pendingFollowUpsCount > 0 ? pendingFollowUpsCount : undefined,
        },
      ],
    },
    {
      group: 'GROWTH',
      items: [
        { id: 'proposals', label: 'Proposals', icon: FileSpreadsheet },
        { id: 'contracts', label: 'Contracts', icon: FileCheck2 },
        { id: 'services', label: 'Services', icon: Package },
        { id: 'portfolio', label: 'Portfolio / Brand', icon: Award },
        { id: 'documents', label: 'Documents / Files', icon: FolderKanban },
      ],
    },
    {
      group: 'AUTOMATION & CONTROL',
      items: [
        { id: 'automations', label: 'Automations', icon: Zap },
        {
          id: 'approvals',
          label: 'Approval Center',
          icon: ShieldAlert,
          badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
        },
        { id: 'connected-accounts', label: 'Connected Accounts', icon: Link2 },
        { id: 'activity-log', label: 'Activity / Audit Log', icon: History },
      ],
    },
    {
      group: 'PRODUCT GUIDE',
      items: [
        { id: 'features', label: 'Feature Center', icon: Sparkles },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        id="aura-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#080B14] border-r border-white/5 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div>
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div
              onClick={() => {
                onSelectTab('overview');
                onCloseMobile();
              }}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              <AuraOrb size="sm" />
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-display font-bold text-lg text-white tracking-tight">
                    AURA
                  </span>
                  <span className="text-cyan-400 font-semibold text-sm">AI</span>
                </div>
                <p className="text-[9px] text-cyan-400/90 font-semibold tracking-wider uppercase">
                  FREELANCE & BUSINESS OS
                </p>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              className="lg:hidden text-gray-400 hover:text-white p-1 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="p-3 overflow-y-auto max-h-[calc(100vh-160px)] space-y-5">
            {navSections.map((sec) => (
              <div key={sec.group} className="space-y-1">
                <div className="px-3 text-[11px] font-bold text-gray-300 tracking-wider">
                  {sec.group}
                </div>
                <div className="space-y-0.5">
                  {sec.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        id={`nav-${item.id}`}
                        onClick={() => {
                          onSelectTab(item.id as NavigationTab);
                          onCloseMobile();
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          isActive
                            ? 'bg-gradient-to-r from-cyan-500/15 via-indigo-500/20 to-purple-500/15 border border-cyan-500/35 text-white shadow-sm shadow-cyan-950/40 font-semibold'
                            : 'text-gray-400 hover:text-gray-100 hover:bg-[#111827]/60'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Icon
                            className={`w-4 h-4 ${
                              isActive
                                ? 'text-cyan-400'
                                : 'text-gray-400'
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>

                        {item.badge !== undefined && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-300 animate-pulse">
                            {item.badge}
                          </span>
                        )}

                        {item.isAi && !item.badge && (
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 shadow-sm shadow-cyan-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User profile & sign out */}
        <div className="p-3 border-t border-white/5 bg-[#05070D]">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#0D1220] border border-white/5">
            <div
              onClick={() => {
                onSelectTab('settings');
                onCloseMobile();
              }}
              title="Open Profile & Workspace Settings"
              className="flex items-center space-x-2.5 overflow-hidden flex-1 cursor-pointer group"
            >
              {user.avatarUrl || user.photoUrl ? (
                <img
                  src={user.avatarUrl || user.photoUrl}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover border border-cyan-500/40 flex-shrink-0 group-hover:border-cyan-300 transition-colors"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 flex items-center justify-center font-bold text-xs text-white flex-shrink-0 shadow-sm border border-cyan-400/30 group-hover:border-cyan-300 transition-colors">
                  {user.name
                    ? user.name
                        .trim()
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : 'A'}
                </div>
              )}
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">
                  {user.name}
                </p>
                <p className="text-[10px] text-gray-400 truncate">
                  {user.workspaceType || user.accountType
                    ? `${user.workspaceType || user.accountType} · ${user.companyName}`
                    : user.companyName}
                </p>
              </div>
            </div>

            <button
              id="btn-signout"
              onClick={onSignOut}
              title="Sign Out / Switch"
              className="text-gray-400 hover:text-pink-400 p-1.5 rounded-lg hover:bg-[#151B2B] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
