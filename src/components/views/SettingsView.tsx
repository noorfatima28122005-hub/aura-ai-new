import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { apiUpdateProfile } from '../../lib/api';
import { Settings, ShieldCheck, User, Bell, Database, Trash2, Check, AlertTriangle, X, Loader2, Upload, Camera, Image as ImageIcon, Link2 } from 'lucide-react';

interface SettingsViewProps {
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  onResetWorkspace: () => Promise<void> | void;
  onNavigate?: (tab: any) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onUpdateUser,
  onResetWorkspace,
  onNavigate,
}) => {
  const [name, setName] = useState(user.name);
  const [company, setCompany] = useState(user.companyName);
  const [email, setEmail] = useState(user.email);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || user.photoUrl || '');
  const [workspaceType, setWorkspaceType] = useState(user.workspaceType || user.accountType || 'Freelancer');
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [confirmInput, setConfirmInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setPhotoError('Please upload a valid JPG, PNG, or WebP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(reader.result as string);
      setPhotoError(null);
    };
    reader.onerror = () => {
      setPhotoError('Could not read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...user,
      name,
      companyName: company,
      email,
      avatarUrl,
      photoUrl: avatarUrl,
      workspaceType,
      accountType: workspaceType,
    };
    onUpdateUser(updated);

    if (user.id) {
      apiUpdateProfile({
        id: user.id,
        name,
        companyName: company,
        avatarUrl,
        photoUrl: avatarUrl,
        workspaceType,
        accountType: workspaceType,
      }).catch((err) => console.warn('Backend profile update note:', err));
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExecuteReset = async () => {
    if (confirmInput.trim().toUpperCase() !== 'RESET') {
      setError('Please type RESET in uppercase to confirm.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onResetWorkspace();
      setIsModalOpen(false);
      setConfirmInput('');
      setModalStep(1);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset workspace. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="view-settings" className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h2 className="text-2xl font-display font-extrabold text-white tracking-tight">
          Workspace Settings & Governance
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Manage your organization profile, human governance policies, and API connections.
        </p>
      </div>

      {/* Profile settings */}
      <div className="aura-card p-6 rounded-2xl border border-white/5 space-y-4">
        <div className="flex items-center space-x-2 text-sm font-bold text-white">
          <User className="w-4 h-4 text-indigo-400" />
          <span>Operator Profile</span>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Profile Photo Section */}
          <div className="p-3.5 rounded-xl bg-[#080B14] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
                Profile Photo
              </label>
              <span className="text-[11px] text-gray-400">JPG, PNG, WebP · Max 5MB</span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative flex-shrink-0">
                {avatarUrl ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-500 shadow-md">
                    <img
                      src={avatarUrl}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-700 via-indigo-900 to-purple-800 border border-white/20 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                    {name.trim()
                      ? name
                          .trim()
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()
                      : 'AU'}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 border border-black flex items-center justify-center text-white">
                  <Camera className="w-3 h-3" />
                </span>
              </div>

              <div className="flex-1 space-y-2">
                <input
                  id="settings-profile-photo-input"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    id="btn-settings-upload-photo"
                    type="button"
                    onClick={() =>
                      document.getElementById('settings-profile-photo-input')?.click()
                    }
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white flex items-center space-x-1.5 cursor-pointer transition-colors shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{avatarUrl ? 'Change Image' : 'Upload Image'}</span>
                  </button>

                  <button
                    id="btn-settings-choose-photo"
                    type="button"
                    onClick={() =>
                      document.getElementById('settings-profile-photo-input')?.click()
                    }
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 flex items-center space-x-1.5 cursor-pointer transition-colors"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Choose Image</span>
                  </button>

                  {avatarUrl && (
                    <button
                      id="btn-settings-remove-photo"
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-500/30 flex items-center space-x-1 cursor-pointer transition-colors"
                    >
                      <X className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                {photoError ? (
                  <p className="text-[11px] text-rose-400">{photoError}</p>
                ) : (
                  <p className="text-[11px] text-gray-400">
                    Image is saved to your profile and displayed across navigation and workspace badges.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-300 mb-1">Full Name</label>
              <input
                id="input-settings-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#080B14] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">Business / Brand Name</label>
              <input
                id="input-settings-company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full bg-[#080B14] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-300 mb-1">Email Address</label>
            <input
              id="input-settings-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#080B14] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Workspace Type Selector */}
          <div>
            <label className="block text-xs text-gray-300 mb-1.5">
              Workspace Operational Model
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                'Freelancer',
                'Consultant',
                'Agency',
                'Small Business',
                'Service Business',
                'Other',
              ].map((type) => {
                const isSelected = workspaceType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    id={`btn-settings-workspace-${type.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => setWorkspaceType(type)}
                    className={`py-2 px-2.5 text-xs rounded-lg border text-center transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                      isSelected
                        ? 'bg-indigo-950/70 border-indigo-500 text-cyan-300 font-semibold shadow-sm shadow-indigo-500/20'
                        : 'bg-[#080B14] border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-cyan-400 flex-shrink-0" />}
                    <span className="truncate">{type}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="aura-gradient-btn px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center space-x-1.5 shadow-sm"
            >
              {saved && <Check className="w-3.5 h-3.5" />}
              <span>{saved ? 'Saved Successfully' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Governance policy per Section 25 & 29 */}
      <div className="aura-card p-6 rounded-2xl border border-white/5 space-y-3">
        <div className="flex items-center space-x-2 text-sm font-bold text-white">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>AURA Governance & Safeguard Policies</span>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed">
          The fundamental constraint of AURA OS is{' '}
          <strong className="text-cyan-300">"AI assists. Human decides."</strong> All automated
          proposals originating from Fiverr hooks, Email message parsing, or invoice reminders require
          explicit human approval before triggering outbound API calls.
        </p>
        <div className="p-3 rounded-xl bg-[#080B14] border border-white/5 text-xs text-emerald-400 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          <span>Strict Human-in-the-Loop Governance: Enforced</span>
        </div>
      </div>

      {/* Official Integrations & Connected Accounts (Section 58) */}
      <div className="aura-card p-6 rounded-2xl border border-cyan-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm font-bold text-white">
            <Link2 className="w-4 h-4 text-cyan-400" />
            <span>Connected Accounts & API Integrations</span>
          </div>
          <span className="text-[10px] text-cyan-300 font-bold px-2 py-0.5 rounded-full bg-cyan-950/50 border border-cyan-500/30">
            OAuth 2.0 PKCE
          </span>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          Manage live connections to Gmail, Outlook, Fiverr Pro, Google Calendar, and Drive.
          All sensitive credentials and tokens are secured server-side with zero retention of user passwords.
        </p>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('connected-accounts')}
            className="aura-gradient-btn px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center space-x-1.5 cursor-pointer shadow-sm hover:shadow-cyan-500/20"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Open Connected Accounts Hub</span>
          </button>
        )}
      </div>

      {/* Reset workspace */}
      <div className="aura-card p-6 rounded-2xl border border-rose-500/20 bg-rose-950/10 space-y-3">
        <div className="flex items-center space-x-2 text-sm font-bold text-rose-300">
          <Trash2 className="w-4 h-4" />
          <span>Data Storage Management</span>
        </div>
        <p className="text-xs text-gray-400">
          Reset all current workspace data back to a clean slate (0 clients, 0 projects, 0 tasks, $0 revenue).
        </p>
        <button
          type="button"
          onClick={() => {
            setConfirmInput('');
            setError(null);
            setModalStep(1);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:bg-rose-900/40 text-xs font-semibold cursor-pointer transition-colors"
        >
          Reset To Clean Slate (0 Data)
        </button>
      </div>

      {/* Professional Confirmation Modal (Two-Stage Workflow) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0c101c] border border-rose-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-wide uppercase">
                    Reset Workspace Data
                  </h3>
                  <p className="text-xs text-rose-400/80 font-medium">
                    {modalStep === 1 ? 'Step 1 of 2: Impact Review' : 'Step 2 of 2: Final Confirmation'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalStep === 1 ? (
              /* STAGE 1: Impact Review */
              <div className="space-y-4">
                <div className="space-y-2 text-xs text-gray-300">
                  <p>This action permanently removes the current workspace's business data.</p>
                  <p className="text-gray-400 text-[11px]">The following will be reset:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-400 pl-1">
                    <li>Clients</li>
                    <li>Projects</li>
                    <li>Tasks</li>
                    <li>Financial/revenue workspace data</li>
                    <li>Other workspace business records included in the reset scope</li>
                  </ul>

                  <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-cyan-300 text-[11px] leading-relaxed">
                    <strong>Protected Scope:</strong> Your account, authentication credentials, password, and JWT system will remain completely intact.
                  </div>

                  <p className="text-rose-400 font-semibold">This action cannot be undone.</p>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-white/10 text-xs text-gray-300 hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalStep(2)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
                  >
                    Continue &rarr;
                  </button>
                </div>
              </div>
            ) : (
              /* STAGE 2: Security Word Challenge */
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-300 text-[11px] leading-relaxed">
                  <strong>Final Security Challenge:</strong> To execute an atomic reset across all business collections (0 clients, 0 projects, 0 tasks, $0 revenue), please type <strong>RESET</strong> below.
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-gray-300">
                    Type <strong className="text-rose-400 tracking-wider">RESET</strong> to confirm:
                  </label>
                  <input
                    type="text"
                    value={confirmInput}
                    onChange={(e) => setConfirmInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault(); // Disallow accidental Enter-key submission
                      }
                    }}
                    placeholder="Type RESET"
                    disabled={isSubmitting}
                    className="w-full bg-[#060911] border border-rose-500/30 rounded-xl py-2 px-3 text-xs text-white font-mono tracking-wider focus:outline-none focus:border-rose-400"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isSubmitting) setModalStep(1);
                    }}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl border border-white/10 text-xs text-gray-300 hover:bg-white/5 transition-colors disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteReset}
                    disabled={confirmInput.trim().toUpperCase() !== 'RESET' || isSubmitting}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center space-x-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isSubmitting ? 'Resetting Workspace...' : 'Reset Workspace'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
