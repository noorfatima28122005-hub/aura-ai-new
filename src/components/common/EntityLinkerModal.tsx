import React, { useState, useMemo } from 'react';
import { Client, Project } from '../../types';
import {
  X,
  Link as LinkIcon,
  Search,
  UserCheck,
  FolderGit2,
  Check,
  Building,
  Briefcase,
  AlertCircle,
  Unlink,
} from 'lucide-react';

export interface EntityLinkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemTitle?: string;
  initialClientId?: string;
  initialProjectId?: string;
  clients: Client[];
  projects: Project[];
  onSave: (association: {
    clientId?: string;
    clientName?: string;
    projectId?: string;
    projectName?: string;
  }) => void;
}

export const EntityLinkerModal: React.FC<EntityLinkerModalProps> = ({
  isOpen,
  onClose,
  itemTitle,
  initialClientId,
  initialProjectId,
  clients,
  projects,
  onSave,
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(initialClientId);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(initialProjectId);
  const [clientSearch, setClientSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'client' | 'project'>('client');

  // Reset state when opening/initial values change
  React.useEffect(() => {
    if (isOpen) {
      setSelectedClientId(initialClientId);
      setSelectedProjectId(initialProjectId);
      setClientSearch('');
      setProjectSearch('');
      setActiveTab('client');
    }
  }, [isOpen, initialClientId, initialProjectId]);

  const filteredClients = useMemo(() => {
    const q = clientSearch.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }, [clients, clientSearch]);

  const filteredProjects = useMemo(() => {
    const q = projectSearch.toLowerCase().trim();
    let list = projects;
    // If a client is selected, we prioritize showing projects for this client
    if (selectedClientId && !q) {
      list = [...projects].sort((a, b) => {
        if (a.clientId === selectedClientId && b.clientId !== selectedClientId) return -1;
        if (b.clientId === selectedClientId && a.clientId !== selectedClientId) return 1;
        return 0;
      });
    }
    if (!q) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.clientName && p.clientName.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [projects, projectSearch, selectedClientId]);

  if (!isOpen) return null;

  const currentClient = clients.find((c) => c.id === selectedClientId);
  const currentProject = projects.find((p) => p.id === selectedProjectId);

  const handleSelectClient = (c: Client) => {
    if (selectedClientId === c.id) {
      setSelectedClientId(undefined);
    } else {
      setSelectedClientId(c.id);
      // If current project does not belong to new client, check if there's an associated project
      if (selectedProjectId) {
        const proj = projects.find((p) => p.id === selectedProjectId);
        if (proj && proj.clientId !== c.id) {
          // Keep project or allow user to switch
        }
      }
    }
  };

  const handleSelectProject = (p: Project) => {
    if (selectedProjectId === p.id) {
      setSelectedProjectId(undefined);
    } else {
      setSelectedProjectId(p.id);
      // Auto-populate client if unlinked
      if (!selectedClientId && p.clientId) {
        setSelectedClientId(p.clientId);
      }
    }
  };

  const handleSave = () => {
    const client = clients.find((c) => c.id === selectedClientId);
    const project = projects.find((p) => p.id === selectedProjectId);
    onSave({
      clientId: client?.id,
      clientName: client?.name,
      projectId: project?.id,
      projectName: project?.name,
    });
    onClose();
  };

  const handleClearAll = () => {
    setSelectedClientId(undefined);
    setSelectedProjectId(undefined);
  };

  return (
    <div
      id="entity-linker-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="entity-linker-modal-content"
        className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-100">Link Message to Entity</h3>
              <p className="text-xs text-neutral-400 truncate max-w-md">
                {itemTitle ? `Associating: "${itemTitle}"` : 'Select a Client and/or Project'}
              </p>
            </div>
          </div>
          <button
            id="entity-linker-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Entities Summary Bar */}
        <div className="px-5 py-3 bg-neutral-950/60 border-b border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-500 font-medium">Client:</span>
              {currentClient ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 font-medium">
                  <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                  {currentClient.name}
                  {currentClient.company && <span className="text-neutral-400 font-normal">({currentClient.company})</span>}
                </span>
              ) : (
                <span className="text-neutral-500 italic">None selected</span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-neutral-500 font-medium">Project:</span>
              {currentProject ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-950/40 text-purple-300 border border-purple-500/30 font-medium">
                  <FolderGit2 className="w-3.5 h-3.5 text-purple-400" />
                  {currentProject.name}
                </span>
              ) : (
                <span className="text-neutral-500 italic">None selected</span>
              )}
            </div>
          </div>

          {(selectedClientId || selectedProjectId) && (
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 transition-colors"
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>Clear Associations</span>
            </button>
          )}
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-neutral-800 bg-neutral-900/50">
          <button
            id="entity-linker-client-tab"
            onClick={() => setActiveTab('client')}
            className={`flex-1 py-3 px-4 text-xs font-medium flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'client'
                ? 'border-cyan-500 text-cyan-300 bg-cyan-950/10'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Select Client ({filteredClients.length})</span>
            {selectedClientId && (
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            )}
          </button>
          <button
            id="entity-linker-project-tab"
            onClick={() => setActiveTab('project')}
            className={`flex-1 py-3 px-4 text-xs font-medium flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'project'
                ? 'border-purple-500 text-purple-300 bg-purple-950/10'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Select Project ({filteredProjects.length})</span>
            {selectedProjectId && (
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            )}
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[300px]">
          {activeTab === 'client' ? (
            <div className="space-y-3">
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="client-search-input"
                  type="text"
                  placeholder="Search clients by name, company, or email..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 focus:outline-none focus:border-cyan-500 placeholder-neutral-500"
                />
              </div>

              {/* Client List */}
              <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                {filteredClients.length === 0 ? (
                  <div className="text-center py-8 text-xs text-neutral-500">
                    No clients found matching "{clientSearch}".
                  </div>
                ) : (
                  filteredClients.map((client) => {
                    const isSelected = selectedClientId === client.id;
                    return (
                      <div
                        key={client.id}
                        onClick={() => handleSelectClient(client)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-200'
                            : 'bg-neutral-950/40 border-neutral-800/80 hover:border-neutral-700 text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold ${
                              isSelected
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                : 'bg-neutral-800 text-neutral-400'
                            }`}
                          >
                            {client.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-neutral-100 flex items-center gap-2">
                              <span>{client.name}</span>
                              {client.status && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400">
                                  {client.status}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-400 flex items-center gap-2">
                              {client.company && <span>{client.company}</span>}
                              {client.email && <span>• {client.email}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isSelected ? (
                            <span className="flex items-center gap-1 text-[11px] text-cyan-400 font-medium">
                              <Check className="w-4 h-4" />
                              Selected
                            </span>
                          ) : (
                            <span className="text-[11px] text-neutral-500 group-hover:text-neutral-300">
                              Select
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="project-search-input"
                  type="text"
                  placeholder="Search projects by title or client name..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 focus:outline-none focus:border-purple-500 placeholder-neutral-500"
                />
              </div>

              {selectedClientId && (
                <div className="flex items-center justify-between text-[11px] px-3 py-1.5 rounded-lg bg-cyan-950/20 border border-cyan-500/20 text-cyan-300">
                  <span>Showing projects for active client first</span>
                  <button
                    onClick={() => setProjectSearch('')}
                    className="underline text-cyan-400 hover:text-cyan-200"
                  >
                    View All
                  </button>
                </div>
              )}

              {/* Project List */}
              <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                {filteredProjects.length === 0 ? (
                  <div className="text-center py-8 text-xs text-neutral-500">
                    No projects found matching "{projectSearch}".
                  </div>
                ) : (
                  filteredProjects.map((project) => {
                    const isSelected = selectedProjectId === project.id;
                    const matchesClient = selectedClientId && project.clientId === selectedClientId;
                    return (
                      <div
                        key={project.id}
                        onClick={() => handleSelectProject(project)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-950/30 border-purple-500/50 text-purple-200'
                            : 'bg-neutral-950/40 border-neutral-800/80 hover:border-neutral-700 text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold ${
                              isSelected
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-neutral-800 text-neutral-400'
                            }`}
                          >
                            <Briefcase className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-neutral-100 flex items-center gap-2">
                              <span>{project.name}</span>
                              {matchesClient && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/50 text-cyan-300 border border-cyan-500/30">
                                  Client Match
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-400 flex items-center gap-2">
                              <span>Client: {project.clientName || 'General'}</span>
                              <span>•</span>
                              <span>Status: {project.status}</span>
                              {project.deadline && (
                                <>
                                  <span>•</span>
                                  <span>Due: {project.deadline}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isSelected ? (
                            <span className="flex items-center gap-1 text-[11px] text-purple-400 font-medium">
                              <Check className="w-4 h-4" />
                              Selected
                            </span>
                          ) : (
                            <span className="text-[11px] text-neutral-500 group-hover:text-neutral-300">
                              Select
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <div className="text-[11px] text-neutral-400">
            {selectedClientId || selectedProjectId ? (
              <span>
                Will associate message with{' '}
                {currentClient ? <strong>{currentClient.name}</strong> : ''}
                {currentClient && currentProject ? ' and ' : ''}
                {currentProject ? <strong>{currentProject.name}</strong> : ''}
              </span>
            ) : (
              <span>No entity will be linked (unassociated)</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="entity-linker-cancel-btn"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="entity-linker-save-btn"
              onClick={handleSave}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Association</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
