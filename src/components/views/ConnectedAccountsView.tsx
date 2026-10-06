import React, { useState } from 'react';
import { ConnectedAccount, IntegrationStatus } from '../../types';
import {
  ShieldCheck,
  RefreshCw,
  Link2,
  Unlink,
  CheckCircle2,
  Lock,
  Mail,
  ExternalLink,
  AlertCircle,
  Calendar,
  HardDrive,
  GitBranch,
  CreditCard,
  MessageSquare,
  BookOpen,
  Clock,
  X,
  Check,
  Info,
  ShieldAlert,
  Sparkles,
  AlertTriangle,
  History,
} from 'lucide-react';

interface ConnectedAccountsViewProps {
  accounts: ConnectedAccount[];
  onToggleConnect: (
    accountId: string,
    options?: { permissions?: string[]; accountIdentifier?: string }
  ) => Promise<void> | void;
  onSyncAccount: (accountId: string) => Promise<void> | void;
}

export const ConnectedAccountsView: React.FC<ConnectedAccountsViewProps> = ({
  accounts,
  onToggleConnect,
  onSyncAccount,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'connected' | 'available' | 'config_needed'>('all');
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [connectingModalAccount, setConnectingModalAccount] = useState<ConnectedAccount | null>(null);
  const [disconnectConfirmAccount, setDisconnectConfirmAccount] = useState<ConnectedAccount | null>(null);
  const [historyModalAccount, setHistoryModalAccount] = useState<ConnectedAccount | null>(null);

  // Modal form states
  const [modalPermissions, setModalPermissions] = useState<string[]>([]);
  const [modalIdentifier, setModalIdentifier] = useState<string>('');
  const [isSubmittingConnect, setIsSubmittingConnect] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectSuccess, setConnectSuccess] = useState(false);

  // Open the Connection Modal
  const openConnectModal = (account: ConnectedAccount) => {
    setConnectingModalAccount(account);
    setModalPermissions(account.permissions && account.permissions.length > 0 ? [...account.permissions] : (account.allAvailablePermissions?.slice(0, 3) || []));
    setModalIdentifier(account.accountIdentifier && account.accountIdentifier !== 'Not connected' ? account.accountIdentifier : '');
    setConnectError(null);
    setConnectSuccess(false);
    setIsSubmittingConnect(false);
  };

  const closeConnectModal = () => {
    if (isSubmittingConnect) return;
    setConnectingModalAccount(null);
    setConnectError(null);
    setConnectSuccess(false);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectingModalAccount || isSubmittingConnect) return;

    if (connectingModalAccount.status === 'not_configured') {
      setConnectError(`Provider configuration required: ${connectingModalAccount.requiredConfig || 'Missing server OAuth / API keys'}`);
      return;
    }

    setIsSubmittingConnect(true);
    setConnectError(null);

    try {
      await onToggleConnect(connectingModalAccount.id, {
        permissions: modalPermissions,
        accountIdentifier: modalIdentifier.trim() || undefined,
      });
      setConnectSuccess(true);
      setTimeout(() => {
        setIsSubmittingConnect(false);
        setConnectingModalAccount(null);
        setConnectSuccess(false);
      }, 1000);
    } catch (err: any) {
      setIsSubmittingConnect(false);
      setConnectError(err?.message || 'Connection handshake failed. Please try again.');
    }
  };

  const toggleModalPermission = (perm: string) => {
    if (modalPermissions.includes(perm)) {
      if (modalPermissions.length === 1) return; // Keep at least one
      setModalPermissions(modalPermissions.filter((p) => p !== perm));
    } else {
      setModalPermissions([...modalPermissions, perm]);
    }
  };

  // Sync handler with visual feedback
  const handleSync = async (id: string) => {
    setSyncingId(id);
    try {
      await onSyncAccount(id);
    } finally {
      setTimeout(() => setSyncingId(null), 600);
    }
  };

  // Disconnect confirmation handler
  const confirmDisconnect = async () => {
    if (!disconnectConfirmAccount) return;
    try {
      await onToggleConnect(disconnectConfirmAccount.id);
    } finally {
      setDisconnectConfirmAccount(null);
    }
  };

  const getProviderIcon = (provider: string, category?: string) => {
    switch (provider) {
      case 'fiverr':
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-extrabold text-sm">
            Fi
          </div>
        );
      case 'gmail':
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-950/50 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Mail className="w-5 h-5" />
          </div>
        );
      case 'outlook':
        return (
          <div className="w-10 h-10 rounded-xl bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Mail className="w-5 h-5" />
          </div>
        );
      case 'gcal':
        return (
          <div className="w-10 h-10 rounded-xl bg-amber-950/50 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Calendar className="w-5 h-5" />
          </div>
        );
      case 'gdrive':
        return (
          <div className="w-10 h-10 rounded-xl bg-teal-950/50 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <HardDrive className="w-5 h-5" />
          </div>
        );
      case 'github':
        return (
          <div className="w-10 h-10 rounded-xl bg-purple-950/50 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <GitBranch className="w-5 h-5" />
          </div>
        );
      case 'stripe':
        return (
          <div className="w-10 h-10 rounded-xl bg-indigo-950/50 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <CreditCard className="w-5 h-5" />
          </div>
        );
      case 'slack':
        return (
          <div className="w-10 h-10 rounded-xl bg-rose-950/50 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <MessageSquare className="w-5 h-5" />
          </div>
        );
      case 'notion':
        return (
          <div className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-200">
            <BookOpen className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-300">
            <Link2 className="w-5 h-5" />
          </div>
        );
    }
  };

  const getStatusBadge = (status: IntegrationStatus) => {
    switch (status) {
      case 'connected':
        return (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1.5 bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Connected</span>
          </span>
        );
      case 'syncing':
        return (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1.5 bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
            <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
            <span>Syncing</span>
          </span>
        );
      case 'not_configured':
        return (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1.5 bg-amber-950/40 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>Config Required</span>
          </span>
        );
      case 'reauth_required':
      case 'token_expired':
        return (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1.5 bg-rose-950/60 text-rose-300 border border-rose-500/30">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            <span>Re-auth Required</span>
          </span>
        );
      case 'error':
        return (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1.5 bg-rose-950/60 text-rose-300 border border-rose-500/30">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            <span>Connection Error</span>
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1.5 bg-gray-800 text-gray-400 border border-gray-700">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
            <span>Available</span>
          </span>
        );
    }
  };

  const filteredAccounts = accounts.filter((acc) => {
    if (filterTab === 'connected') return acc.status === 'connected';
    if (filterTab === 'available') return acc.status === 'disconnected' || acc.status === 'available';
    if (filterTab === 'config_needed') return acc.status === 'not_configured';
    return true;
  });

  const connectedCount = accounts.filter((a) => a.status === 'connected').length;

  return (
    <div id="view-connected-accounts" className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0D1220] via-[#111827] to-[#080B14] border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>CENTRAL INTEGRATION & OAUTH PROTOCOL</span>
          </div>
          <h2 className="text-2xl font-display font-extrabold text-white">
            Connected Accounts & Official Integrations
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-xl">
            Authorize official API handshakes to sync client emails, orders, calendars, and files into AURA context.
            Sensitive tokens remain strictly server-side with zero retention of third-party account passwords.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 px-3.5 py-2 rounded-xl flex-shrink-0">
          <Lock className="w-4 h-4" />
          <span>{connectedCount} Active Handshake{connectedCount !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Security notice & capabilities architecture */}
      <div className="aura-card p-4 rounded-xl border border-white/5 flex items-start space-x-3 text-xs text-gray-400">
        <AlertCircle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-white">Security & Minimum Permission Architecture:</strong>{' '}
          AURA connects exclusively via official developer tokens or OAuth 2.0 with PKCE verification.
          We never ask for or store passwords. Each provider declares exact capabilities and requested scopes.
          If developer credentials are not configured, providers explicitly show "Config Required" rather than fake connectivity.
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-white/10 pb-3 overflow-x-auto">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
            filterTab === 'all'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          All Integrations ({accounts.length})
        </button>
        <button
          onClick={() => setFilterTab('connected')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
            filterTab === 'connected'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Connected ({connectedCount})
        </button>
        <button
          onClick={() => setFilterTab('available')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
            filterTab === 'available'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Available ({accounts.filter((a) => a.status === 'disconnected' || a.status === 'available').length})
        </button>
        <button
          onClick={() => setFilterTab('config_needed')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
            filterTab === 'config_needed'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Config Required ({accounts.filter((a) => a.status === 'not_configured').length})
        </button>
      </div>

      {/* Accounts List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredAccounts.map((acc) => {
          const isConnected = acc.status === 'connected';
          const isSyncing = syncingId === acc.id;
          const isNotConfigured = acc.status === 'not_configured';

          return (
            <div
              key={acc.id}
              id={`card-account-${acc.id}`}
              className="aura-card p-6 rounded-2xl border border-white/5 hover:border-white/15 transition-all flex flex-col justify-between space-y-5"
            >
              {/* Top row */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {getProviderIcon(acc.provider, acc.category)}
                    <div>
                      <h3 className="text-sm font-bold text-white">{acc.name}</h3>
                      <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                        {acc.accountIdentifier || 'Unlinked'}
                      </p>
                    </div>
                  </div>

                  {getStatusBadge(acc.status)}
                </div>

                {/* Capabilities Badges */}
                {acc.capabilities && acc.capabilities.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Capabilities:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {acc.capabilities.map((cap) => (
                        <span
                          key={cap}
                          className="px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/5 text-[10px] text-gray-300 font-mono"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Permissions */}
                <div className="space-y-1.5 text-xs">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Granted Permissions:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(acc.permissions || []).map((perm) => (
                      <span
                        key={perm}
                        className="px-2 py-0.5 rounded-md bg-[#080B14] border border-white/5 text-[11px] text-gray-300"
                      >
                        ✓ {perm}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Configuration Required Warning */}
                {isNotConfigured && (
                  <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-amber-300 flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-white font-medium">Provider Configuration Required</strong>
                      <span className="text-[11px] text-amber-200/80">
                        {acc.requiredConfig || 'Configure API keys or OAuth Client credentials in server environment variables to activate this service.'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Live Telemetry metrics if connected */}
                {isConnected && acc.dataStats && (
                  <div className="p-3 rounded-xl bg-[#080B14] border border-white/5 text-[11px] flex flex-wrap items-center justify-between gap-2 text-gray-300">
                    <span>
                      Last Sync: <strong className="text-white">{acc.lastSync}</strong>
                    </span>
                    {acc.dataStats.activeOrders !== undefined && (
                      <span className="text-cyan-300 font-semibold">
                        {acc.dataStats.activeOrders} active orders
                      </span>
                    )}
                    {acc.dataStats.analyzedEmails !== undefined && (
                      <span className="text-indigo-300 font-semibold">
                        {acc.dataStats.analyzedEmails} messages analyzed
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                {isConnected ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSync(acc.id)}
                        disabled={isSyncing}
                        className="px-3 py-1.5 rounded-xl bg-[#0D1220] border border-white/10 text-xs font-medium text-gray-300 hover:text-white flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${
                            isSyncing ? 'animate-spin text-cyan-400' : ''
                          }`}
                        />
                        <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                      </button>

                      {acc.syncHistory && acc.syncHistory.length > 0 && (
                        <button
                          onClick={() => setHistoryModalAccount(acc)}
                          className="px-2.5 py-1.5 rounded-xl bg-[#0D1220] border border-white/5 text-xs text-gray-400 hover:text-gray-200 flex items-center space-x-1 cursor-pointer"
                          title="View Sync History"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>Audit</span>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => setDisconnectConfirmAccount(acc)}
                      className="text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-rose-950/20"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      <span>Disconnect</span>
                    </button>
                  </>
                ) : isNotConfigured ? (
                  <button
                    onClick={() => openConnectModal(acc)}
                    className="w-full py-2.5 rounded-xl border border-amber-500/30 bg-amber-950/20 text-amber-300 text-xs font-semibold flex items-center justify-center space-x-2 cursor-pointer hover:bg-amber-950/30 transition-all"
                  >
                    <Info className="w-3.5 h-3.5 text-amber-400" />
                    <span>View Setup Requirements</span>
                  </button>
                ) : (
                  <button
                    onClick={() => openConnectModal(acc)}
                    className="w-full aura-gradient-btn text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm hover:shadow-cyan-500/20"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Authorize & Connect</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ==================================================== */}
      {/* 25. REUSABLE CONNECTION MODAL                        */}
      {/* ==================================================== */}
      {connectingModalAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className="aura-card border border-white/15 rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl relative"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                {getProviderIcon(connectingModalAccount.provider)}
                <div>
                  <h3 className="text-base font-bold text-white">
                    Connect {connectingModalAccount.name}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Official OAuth 2.0 PKCE Authorization Handshake
                  </p>
                </div>
              </div>
              <button
                onClick={closeConnectModal}
                disabled={isSubmittingConnect}
                className="text-gray-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {connectError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white">Connection Error</strong>
                  <span>{connectError}</span>
                </div>
              </div>
            )}

            {/* Success State */}
            {connectSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Authorization verified! Connection established.</span>
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="space-y-4">
              {/* Account identifier field */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Account Identifier / Work Email
                </label>
                <input
                  type="text"
                  value={modalIdentifier}
                  onChange={(e) => setModalIdentifier(e.target.value)}
                  placeholder="e.g., user@company.com or handle"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B14] border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Capabilities declaration */}
              {connectingModalAccount.capabilities && connectingModalAccount.capabilities.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-gray-300 block">
                    Supported Provider Capabilities:
                  </span>
                  <div className="p-2.5 rounded-xl bg-[#080B14] border border-white/5 flex flex-wrap gap-1.5">
                    {connectingModalAccount.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="px-2 py-0.5 rounded-md bg-cyan-950/40 border border-cyan-500/30 text-[10px] text-cyan-300 font-mono"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Permissions checklist */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-gray-300 block">
                  Permissions to Request (Least Privilege):
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {(connectingModalAccount.allAvailablePermissions || connectingModalAccount.permissions || []).map((perm) => {
                    const isChecked = modalPermissions.includes(perm);
                    return (
                      <label
                        key={perm}
                        className="flex items-center space-x-2.5 p-2 rounded-xl bg-[#080B14] border border-white/5 cursor-pointer hover:border-white/10 text-xs text-gray-200"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleModalPermission(perm)}
                          className="rounded border-white/20 text-cyan-500 focus:ring-0"
                        />
                        <span>{perm}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Privacy & Zero-Retention Notice */}
              <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-[11px] text-gray-400 flex items-start space-x-2">
                <Lock className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Zero-Password Guarantee:</strong> Credentials are stored encrypted server-side.
                  AURA accesses data strictly according to selected permissions and never stores your third-party password.
                </span>
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeConnectModal}
                  disabled={isSubmittingConnect}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>

                {connectingModalAccount.status === 'not_configured' ? (
                  <button
                    type="button"
                    disabled
                    className="px-5 py-2.5 rounded-xl bg-gray-800 text-gray-500 text-xs font-semibold cursor-not-allowed"
                  >
                    Configuration Required
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmittingConnect || connectSuccess}
                    className="aura-gradient-btn text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center space-x-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmittingConnect ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>Connecting via OAuth...</span>
                      </>
                    ) : connectSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Connected</span>
                      </>
                    ) : (
                      <>
                        <Link2 className="w-3.5 h-3.5 text-white" />
                        <span>Authorize Connection</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      {disconnectConfirmAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="aura-card border border-rose-500/30 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-400">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Disconnect {disconnectConfirmAccount.name}?</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Disconnecting will purge all active OAuth tokens from the secure server store.
              Existing client and project records already synchronized to your AURA workspace will remain safely preserved.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setDisconnectConfirmAccount(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white cursor-pointer"
              >
                Keep Connected
              </button>
              <button
                onClick={confirmDisconnect}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
              >
                Disconnect & Purge Tokens
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sync History Audit Modal */}
      {historyModalAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="aura-card border border-white/15 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <History className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  Sync Audit Log: {historyModalAccount.name}
                </h3>
              </div>
              <button
                onClick={() => setHistoryModalAccount(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {(historyModalAccount.syncHistory || []).map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 rounded-xl bg-[#080B14] border border-white/5 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
                    <span>{entry.timestamp}</span>
                    <span className="text-cyan-400">{entry.durationMs}ms</span>
                  </div>
                  <p className="text-gray-200">{entry.message}</p>
                  <div className="text-[10px] text-gray-400 flex items-center space-x-3 pt-0.5">
                    <span>Processed: {entry.recordsProcessed}</span>
                    <span>Updated: {entry.recordsUpdated}</span>
                    <span>Added: {entry.recordsAdded}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setHistoryModalAccount(null)}
                className="px-4 py-2 rounded-xl bg-gray-800 text-xs font-semibold text-gray-200 hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
