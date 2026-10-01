import React, { useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Edit3,
  FileCode2,
  FileJson,
  FilePlus,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { useIdeStore } from '../../stores/ideStore';
import { FileNode } from '../../types/ide';

interface TreeEntry {
  node: FileNode;
  children: TreeEntry[];
}

function buildHierarchy(files: FileNode[]): TreeEntry[] {
  const map = new Map<string, TreeEntry>();
  const roots: TreeEntry[] = [];

  // Sort folders first, then alphabetically
  const sorted = [...files].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.path.localeCompare(b.path);
  });

  // Ensure all parent folders exist in map
  for (const item of sorted) {
    map.set(item.path, { node: item, children: [] });
  }

  for (const item of sorted) {
    const entry = map.get(item.path)!;
    const lastSlash = item.path.lastIndexOf('/');
    if (lastSlash === -1) {
      roots.push(entry);
    } else {
      const parentPath = item.path.slice(0, lastSlash);
      const parent = map.get(parentPath);
      if (parent) {
        parent.children.push(entry);
      } else {
        roots.push(entry);
      }
    }
  }

  const sortChildren = (entries: TreeEntry[]) => {
    entries.sort((a, b) => {
      if (a.node.type !== b.node.type) return a.node.type === 'folder' ? -1 : 1;
      return a.node.name.localeCompare(b.node.name);
    });
    entries.forEach((e) => sortChildren(e.children));
  };
  sortChildren(roots);
  return roots;
}

export const ProjectExplorer: React.FC = () => {
  const {
    projects,
    activeProjectId,
    activeFilePath,
    openFile,
    createFileOrFolder,
    renameFileOrFolder,
    deleteFileOrFolder,
    duplicateFile,
    appendLogcat,
  } = useIdeStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    app: true,
    'app/src': true,
    'app/src/main': true,
    'app/src/main/java': true,
    'app/src/main/java/com': true,
    'app/src/main/java/com/example': true,
    'app/src/main/java/com/example/myapp': true,
    'app/src/main/res': true,
    'app/src/main/res/layout': true,
    'app/src/main/res/values': true,
    src: true,
  });

  const [createDialog, setCreateDialog] = useState<{
    type: 'file' | 'folder';
    parentPath: string;
  } | null>(null);
  const [newNameInput, setNewNameInput] = useState('');

  const [renameTarget, setRenameTarget] = useState<FileNode | null>(null);
  const [renameInput, setRenameInput] = useState('');

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) || projects[0],
    [projects, activeProjectId]
  );

  const treeRoots = useMemo(
    () => buildHierarchy(activeProject?.files || []),
    [activeProject]
  );

  const filteredFiles = useMemo(() => {
    if (!filterQuery.trim()) return null;
    const q = filterQuery.toLowerCase();
    return activeProject.files.filter(
      (f) => f.type === 'file' && f.path.toLowerCase().includes(q)
    );
  }, [activeProject, filterQuery]);

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createDialog || !newNameInput.trim()) return;
    createFileOrFolder(createDialog.parentPath, newNameInput.trim(), createDialog.type);
    if (createDialog.parentPath) {
      setExpandedFolders((prev) => ({ ...prev, [createDialog.parentPath]: true }));
    }
    setCreateDialog(null);
    setNewNameInput('');
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameInput.trim()) return;
    renameFileOrFolder(renameTarget.path, renameInput.trim());
    setRenameTarget(null);
    setRenameInput('');
  };

  const handleExportProjectZip = async () => {
    const zip = new JSZip();
    activeProject.files.forEach((f) => {
      if (f.type === 'file') {
        zip.file(f.path, f.content || '');
      }
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProject.name}-source.zip`;
    a.click();
    URL.revokeObjectURL(url);
    appendLogcat('I', 'FileExplorer', `Exported ${activeProject.name}-source.zip`);
  };

  const handleImportSingleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    createFileOrFolder('app/src/main', file.name, 'file', text);
    e.target.value = '';
  };

  const renderFileIcon = (fileName: string) => {
    if (fileName.endsWith('.kt') || fileName.endsWith('.java')) {
      return <FileCode2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    }
    if (fileName.endsWith('.xml')) {
      return <FileCode2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    }
    if (fileName.endsWith('.gradle') || fileName.endsWith('.properties')) {
      return <FileJson className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
    }
    return <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  };

  const renderTreeEntry = (entry: TreeEntry, depth = 0): React.ReactNode => {
    const { node, children } = entry;
    const isFolder = node.type === 'folder';
    const isExpanded = !!expandedFolders[node.path];
    const isSelected = node.path === activeFilePath;

    return (
      <div key={node.path}>
        <div
          onClick={() => {
            if (isFolder) toggleFolder(node.path);
            else openFile(node.path);
          }}
          style={{ paddingLeft: `${depth * 12 + 10}px` }}
          className={`group flex items-center justify-between pr-2 py-1.5 min-h-[34px] text-xs cursor-pointer select-none transition-colors ${
            isSelected
              ? 'bg-emerald-500/15 text-emerald-300 font-medium border-l-2 border-emerald-400'
              : 'text-slate-300 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {isFolder ? (
              <>
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                )}
                {isExpanded ? (
                  <FolderOpen className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                ) : (
                  <Folder className="w-3.5 h-3.5 text-sky-400/80 shrink-0" />
                )}
              </>
            ) : (
              <span className="pl-3.5 flex items-center">
                {renderFileIcon(node.name)}
              </span>
            )}
            <span className="truncate">{node.name}</span>
          </div>

          {/* Inline File / Folder Operations */}
          <div className="hidden group-hover:flex items-center gap-0.5 shrink-0 ml-1">
            {isFolder && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCreateDialog({ type: 'file', parentPath: node.path });
                  setNewNameInput('');
                }}
                className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-100"
                title="New File Inside Folder"
              >
                <FilePlus className="w-3 h-3" />
              </button>
            )}
            {!isFolder && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateFile(node.path);
                }}
                className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-100"
                title="Duplicate File"
              >
                <Copy className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setRenameTarget(node);
                setRenameInput(node.name);
              }}
              className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-100"
              title="Rename"
            >
              <Edit3 className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                deleteFileOrFolder(node.path);
              }}
              className="p-1 rounded hover:bg-rose-900/60 text-slate-400 hover:text-rose-300"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {isFolder && isExpanded && (
          <div>{children.map((child) => renderTreeEntry(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 lg:w-72 h-full bg-[#0E1420] border-r border-slate-800/80 flex flex-col select-none shrink-0">
      {/* Project Header & Quick Actions */}
      <div className="p-3 border-b border-slate-800/80 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-100 truncate">
            {activeProject.name}
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            {activeProject.language} · {activeProject.git.branch}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              setCreateDialog({ type: 'file', parentPath: 'app/src/main' });
              setNewNameInput('');
            }}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100"
            title="New File"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setCreateDialog({ type: 'folder', parentPath: 'app/src/main' });
              setNewNameInput('');
            }}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100"
            title="New Folder"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100"
            title="Import File"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleExportProjectZip}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100"
            title="Export Project ZIP"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleImportSingleFile}
          />
        </div>
      </div>

      {/* Search Filter Input (Section 6: 🔍 Search) */}
      <div className="p-2 border-b border-slate-800/70">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
          <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter project files..."
            className="bg-transparent text-slate-200 placeholder:text-slate-500 focus:outline-none w-full"
          />
        </div>
      </div>

      {/* Inline Create File/Folder Form */}
      {createDialog && (
        <form
          onSubmit={handleCreateSubmit}
          className="p-2.5 bg-slate-900/90 border-b border-slate-800 space-y-2 text-xs"
        >
          <div className="text-[11px] text-slate-400">
            New {createDialog.type} in{' '}
            <span className="font-mono text-slate-200">
              {createDialog.parentPath || '/'}
            </span>
          </div>
          <input
            type="text"
            value={newNameInput}
            onChange={(e) => setNewNameInput(e.target.value)}
            placeholder={
              createDialog.type === 'file' ? 'e.g. Helper.kt or item_row.xml' : 'e.g. utils'
            }
            autoFocus
            className="w-full px-2 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-100"
          />
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setCreateDialog(null)}
              className="px-2 py-1 rounded text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-2.5 py-1 rounded bg-emerald-600 text-slate-950 font-semibold"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {/* Inline Rename Form */}
      {renameTarget && (
        <form
          onSubmit={handleRenameSubmit}
          className="p-2.5 bg-slate-900/90 border-b border-slate-800 space-y-2 text-xs"
        >
          <div className="text-[11px] text-slate-400">
            Rename <span className="font-mono text-slate-200">{renameTarget.name}</span>
          </div>
          <input
            type="text"
            value={renameInput}
            onChange={(e) => setRenameInput(e.target.value)}
            autoFocus
            className="w-full px-2 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-100"
          />
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setRenameTarget(null)}
              className="px-2 py-1 rounded text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-2.5 py-1 rounded bg-emerald-600 text-slate-950 font-semibold"
            >
              Save
            </button>
          </div>
        </form>
      )}

      {/* Scrollable File Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {filteredFiles ? (
          filteredFiles.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              No matching files found.
            </div>
          ) : (
            filteredFiles.map((f) => (
              <div
                key={f.path}
                onClick={() => openFile(f.path)}
                className={`px-3 py-2 text-xs cursor-pointer flex items-center gap-2 ${
                  f.path === activeFilePath
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                {renderFileIcon(f.name)}
                <div className="min-w-0">
                  <div className="truncate font-medium">{f.name}</div>
                  <div className="truncate text-[10px] text-slate-500 font-mono">{f.path}</div>
                </div>
              </div>
            ))
          )
        ) : (
          treeRoots.map((entry) => renderTreeEntry(entry, 0))
        )}
      </div>

      {/* Storage Path Footer */}
      <div className="px-3 py-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-500 truncate">
        {activeProject.storagePath}
      </div>
    </div>
  );
};
