import React, { useRef, useState } from 'react';
import JSZip from 'jszip';
import {
  Clock,
  Code2,
  FolderGit2,
  FolderOpen,
  HardDrive,
  Package,
  Plus,
  Settings,
  Smartphone,
  Terminal,
  Trash2,
  Upload,
} from 'lucide-react';
import { useIdeStore } from '../stores/ideStore';
import { detectLanguage } from '../services/templates';
import { FileNode } from '../types/ide';

function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDays = Math.floor(diffHr / 24);
  return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
}

export const HomeDashboard: React.FC = () => {
  const {
    projects,
    activeProjectId,
    selectProject,
    deleteProject,
    importProjectFiles,
    setNewProjectModalOpen,
    setGitCloneModalOpen,
    setActiveScreen,
    setBottomPanelTab,
    apkArtifacts,
    settings,
  } = useIdeStore();

  const zipInputRef = useRef<HTMLInputElement | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleImportZipFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImportStatus(`Extracting ${file.name}...`);
      const zip = await JSZip.loadAsync(file);
      const extractedNodes: FileNode[] = [];
      const folderSet = new Set<string>();
      const now = Date.now();

      const entries = Object.keys(zip.files);
      for (const rawPath of entries) {
        const entry = zip.files[rawPath];
        const cleanPath = rawPath.replace(/^\/+|\/+$/g, '');
        if (!cleanPath) continue;

        if (entry.dir) {
          folderSet.add(cleanPath);
        } else {
          const parts = cleanPath.split('/');
          for (let i = 1; i < parts.length; i++) {
            folderSet.add(parts.slice(0, i).join('/'));
          }
          const content = await entry.async('string');
          const fileName = parts[parts.length - 1];
          extractedNodes.push({
            id: `zip-file-${cleanPath}-${now}`,
            name: fileName,
            path: cleanPath,
            type: 'file',
            content,
            language: detectLanguage(fileName),
            lastModified: now,
          });
        }
      }

      const folderNodes: FileNode[] = Array.from(folderSet)
        .sort()
        .map((folderPath) => {
          const segs = folderPath.split('/');
          return {
            id: `zip-folder-${folderPath}-${now}`,
            name: segs[segs.length - 1],
            path: folderPath,
            type: 'folder',
            lastModified: now,
          };
        });

      const projName = file.name.replace(/\.zip$/i, '').replace(/[^a-zA-Z0-9_-]/g, '') || 'ImportedApp';
      importProjectFiles(
        projName,
        `com.imported.${projName.toLowerCase()}`,
        [...folderNodes, ...extractedNodes]
      );
      setImportStatus(null);
    } catch {
      setImportStatus('Failed to read ZIP archive. Ensure it is a valid .zip file.');
      setTimeout(() => setImportStatus(null), 3000);
    }
    e.target.value = '';
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0B0F17] p-4 sm:p-6 lg:p-10 text-slate-100">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Hero Welcome & Quick Actions (Section 4 of PRD) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <p className="text-xs font-mono text-emerald-400 mb-1">
              Android IDE · Offline-First Architecture
            </p>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-100 tracking-tight">
              Build Android apps directly from your phone.
            </h1>
            <p className="text-sm text-slate-400 mt-1.5 max-w-2xl">
              Create Kotlin, Java, or React hybrid projects, design XML layouts visually, run Gradle builds, and inspect APK packages in one workspace.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setNewProjectModalOpen(true)}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveScreen('workspace')}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#111827] hover:bg-slate-800 text-slate-100 font-medium text-xs sm:text-sm border border-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <FolderOpen className="w-4 h-4 text-emerald-400" />
              <span>Open Active IDE</span>
            </button>
          </div>
        </div>

        {importStatus && (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-700 text-xs text-emerald-300">
            {importStatus}
          </div>
        )}

        {/* Primary Dashboard Action Grid (New Project, Open Project, Import ZIP, Git Clone, Terminal, Settings) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <button
            type="button"
            onClick={() => setNewProjectModalOpen(true)}
            className="p-4 rounded-xl bg-[#111827] hover:bg-slate-800/80 border border-slate-800/80 text-left transition-colors group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-3 text-emerald-400 group-hover:scale-105 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            <div className="text-sm font-semibold text-slate-100">New Project</div>
            <div className="text-xs text-slate-400 mt-0.5">Kotlin, Java & Compose templates</div>
          </button>

          <button
            type="button"
            onClick={() => zipInputRef.current?.click()}
            className="p-4 rounded-xl bg-[#111827] hover:bg-slate-800/80 border border-slate-800/80 text-left transition-colors group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center mb-3 text-sky-400 group-hover:scale-105 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <div className="text-sm font-semibold text-slate-100">Import ZIP</div>
            <div className="text-xs text-slate-400 mt-0.5">Extract existing source archive</div>
            <input
              ref={zipInputRef}
              type="file"
              accept=".zip"
              className="hidden"
              onChange={handleImportZipFile}
            />
          </button>

          <button
            type="button"
            onClick={() => setGitCloneModalOpen(true)}
            className="p-4 rounded-xl bg-[#111827] hover:bg-slate-800/80 border border-slate-800/80 text-left transition-colors group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3 text-purple-400 group-hover:scale-105 transition-transform">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div className="text-sm font-semibold text-slate-100">Git Clone</div>
            <div className="text-xs text-slate-400 mt-0.5">Clone GitHub or GitLab repo</div>
          </button>

          <button
            type="button"
            onClick={() => {
              setBottomPanelTab('terminal');
              setActiveScreen('workspace');
            }}
            className="p-4 rounded-xl bg-[#111827] hover:bg-slate-800/80 border border-slate-800/80 text-left transition-colors group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3 text-amber-400 group-hover:scale-105 transition-transform">
              <Terminal className="w-5 h-5" />
            </div>
            <div className="text-sm font-semibold text-slate-100">Terminal & Gradle</div>
            <div className="text-xs text-slate-400 mt-0.5">Run ./gradlew & ADB commands</div>
          </button>
        </div>

        {/* Main Two-Column Section: Recent Projects + Local Storage Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recent Projects List (Section 4 of PRD) */}
          <div className="lg:col-span-8 p-5 rounded-xl bg-[#111827] border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-100">Recent Projects</h2>
              <span className="text-xs text-slate-400 font-mono">
                {projects.length} local workspaces
              </span>
            </div>

            <div className="divide-y divide-slate-800/80">
              {projects.map((proj) => {
                const isCurrent = proj.id === activeProjectId;
                const fileCount = proj.files.filter((f) => f.type === 'file').length;

                return (
                  <div
                    key={proj.id}
                    onClick={() => selectProject(proj.id)}
                    className={`py-3.5 px-3 -mx-3 rounded-lg transition-colors cursor-pointer flex items-center justify-between gap-4 ${
                      isCurrent ? 'bg-slate-800/50' : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 text-emerald-400">
                        {proj.language === 'React / TypeScript' ? (
                          <Code2 className="w-5 h-5 text-sky-400" />
                        ) : (
                          <Smartphone className="w-5 h-5 text-emerald-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-100 truncate">
                            {proj.name}
                          </span>
                          {isCurrent && (
                            <span className="text-[11px] font-mono text-emerald-400">
                              · Active
                            </span>
                          )}
                        </div>
                        {/* Clean unboxed metadata per Zero-Pill Discipline */}
                        <div className="text-xs text-slate-400 flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span>{proj.language}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{proj.packageName}</span>
                          <span aria-hidden="true">·</span>
                          <span>{fileCount} files</span>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-slate-400">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(proj.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectProject(proj.id);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-slate-950 text-xs font-medium text-slate-200 transition-colors"
                      >
                        Open
                      </button>
                      {projects.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProject(proj.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: File Storage Structure & Toolchain Summary (Section 22 of PRD) */}
          <div className="lg:col-span-4 p-5 rounded-xl bg-[#111827] border border-slate-800/80 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-100">Device File Storage</h2>
                <HardDrive className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xs text-slate-400">
                Local sandboxed directory hierarchy persisted offline:
              </p>

              <pre className="p-3 rounded-lg bg-[#090D14] border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
{`${settings.storageLocation}/
├── Projects/
${projects
  .map(
    (p, idx) =>
      `│   ${idx === projects.length - 1 ? '└──' : '├──'} ${p.name}/`
  )
  .join('\n')}
├── Builds/
├── APKs/ (${apkArtifacts.length} built)
├── Templates/ (7 ready)
└── Backups/`}
              </pre>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setActiveScreen('build')}
                className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-emerald-400" />
                  <span>APK Manager & Builds</span>
                </span>
                <span className="font-mono text-slate-400">{apkArtifacts.length} APKs</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveScreen('settings')}
                className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5 text-sky-400" />
                  <span>IDE Settings & Themes</span>
                </span>
                <span className="font-mono capitalize text-slate-400">{settings.theme}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
