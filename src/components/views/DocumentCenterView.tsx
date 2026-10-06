import React, { useState } from 'react';
import { DocumentItem, DocumentType, Client, Project } from '../../types';
import {
  FolderOpen,
  Plus,
  Search,
  Filter,
  FileText,
  FileSpreadsheet,
  FileCheck,
  Download,
  Trash2,
  Eye,
  Building,
  Briefcase,
  Tag,
  UploadCloud,
  FileCode,
  File,
} from 'lucide-react';

interface DocumentCenterViewProps {
  documents: DocumentItem[];
  clients: Client[];
  projects: Project[];
  onAddDocument: (doc: DocumentItem) => void;
  onDeleteDocument: (id: string) => void;
}

export const DocumentCenterView: React.FC<DocumentCenterViewProps> = ({
  documents,
  clients,
  projects,
  onAddDocument,
  onDeleteDocument,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentType>('Deliverable');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [fileSize, setFileSize] = useState('1.8 MB');

  const categories: DocumentType[] = [
    'Proposal',
    'Contract',
    'Brief',
    'Invoice',
    'Deliverable',
    'Report',
    'Guideline',
  ];

  const filteredDocuments = documents.filter((doc) => {
    const matchesCategory = activeCategory === 'all' || doc.type === activeCategory;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.clientName && doc.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.projectName && doc.projectName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.tags && doc.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())));

    return matchesCategory && matchesSearch;
  });

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === selectedClientId);
    const project = projects.find((p) => p.id === selectedProjectId);
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newDoc: DocumentItem = {
      id: `doc_${Date.now()}`,
      title: title.trim(),
      type: category,
      fileSize,
      fileType: 'PDF',
      uploadedAt: new Date().toISOString().split('T')[0],
      clientId: selectedClientId || undefined,
      clientName: client ? client.name : undefined,
      projectId: selectedProjectId || undefined,
      projectName: project ? project.name : undefined,
      tags: tags.length > 0 ? tags : [category],
    };

    onAddDocument(newDoc);
    setIsUploadModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setCategory('Deliverable');
    setSelectedClientId('');
    setSelectedProjectId('');
    setTagsInput('');
    setFileSize('1.8 MB');
  };

  const getDocIcon = (type: DocumentType) => {
    switch (type) {
      case 'Contract':
        return <FileCheck className="w-5 h-5 text-emerald-400" />;
      case 'Proposal':
        return <FileSpreadsheet className="w-5 h-5 text-purple-400" />;
      case 'Invoice':
        return <FileText className="w-5 h-5 text-amber-400" />;
      case 'Deliverable':
        return <FileCode className="w-5 h-5 text-cyan-400" />;
      default:
        return <File className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">
              Document & File Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
              {documents.length} Files
            </span>
          </div>
          <p className="text-sm text-neutral-400 mt-1">
            Structured repository for statements of work, contracts, deliverables, briefs, and client reports.
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-medium rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload File</span>
        </button>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-neutral-900/50 border border-neutral-800">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeCategory === 'all'
                ? 'bg-neutral-800 text-neutral-100 font-medium'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? 'bg-neutral-800 text-cyan-400 font-medium'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {cat}s
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-8 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500/60"
          />
        </div>
      </div>

      {/* Documents Grid */}
      {documents.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-neutral-900/30 border border-dashed border-neutral-800">
          <div className="w-12 h-12 rounded-xl bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto mb-4 border border-neutral-700">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-medium text-neutral-200">No documents stored</h3>
          <p className="text-sm text-neutral-400 max-w-md mx-auto mt-1 mb-6">
            Store and organize client contracts, milestone deliverables, project briefs, and technical
            guidelines.
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload First File</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              onClick={() => setSelectedDoc(doc)}
              className="p-5 rounded-xl bg-neutral-900/70 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                    {getDocIcon(doc.type)}
                  </div>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">
                    {doc.type}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-neutral-100 mt-3 line-clamp-2">
                  {doc.title}
                </h3>

                <div className="space-y-1 text-xs text-neutral-400 mt-2">
                  {doc.clientName && (
                    <div className="flex items-center gap-1.5">
                      <Building className="w-3 h-3 text-neutral-500" />
                      <span className="truncate">{doc.clientName}</span>
                    </div>
                  )}
                  {doc.projectName && (
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-3 h-3 text-neutral-500" />
                      <span className="truncate">{doc.projectName}</span>
                    </div>
                  )}
                </div>

                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {doc.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-800"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
                <span>{doc.fileSize}</span>
                <span>{doc.uploadedAt}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Detail / Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                  {getDocIcon(selectedDoc.type)}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-neutral-100">{selectedDoc.title}</h3>
                  <span className="text-xs text-neutral-400">{selectedDoc.type} Document</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-neutral-400 hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Client:</span>
                  <span className="text-neutral-200 font-medium">
                    {selectedDoc.clientName || 'General / Internal'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Associated Project:</span>
                  <span className="text-neutral-200 font-medium">
                    {selectedDoc.projectName || 'None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">File Size:</span>
                  <span className="text-neutral-200 font-medium">{selectedDoc.fileSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Date Added:</span>
                  <span className="text-neutral-200 font-medium">{selectedDoc.uploadedAt}</span>
                </div>
              </div>

              {selectedDoc.tags && (
                <div>
                  <span className="text-neutral-400 block mb-1">Index Tags:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDoc.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[10px]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
              <button
                onClick={() => {
                  onDeleteDocument(selectedDoc.id);
                  setSelectedDoc(null);
                }}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete File</span>
              </button>

              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <form
            onSubmit={handleCreateDocument}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-semibold text-neutral-100">Upload New File</h3>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Master Architecture Specification v2"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Category / Type</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as DocumentType)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-blue-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Simulated Size</label>
                  <input
                    type="text"
                    value={fileSize}
                    onChange={(e) => setFileSize(e.target.value)}
                    placeholder="2.4 MB"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Client (Optional)</label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">None / General</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Project (Optional)</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">None / General</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Architecture, Staging, QA, Signed"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 text-neutral-400 hover:text-neutral-200 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Add Document
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
