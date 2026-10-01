import React, { useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  FileDiff,
  FolderGit2,
  GitBranch,
  GitCommit as GitCommitIcon,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { useIdeStore } from '../stores/ideStore';

export const GitSourceControlView: React.FC = () => {
  const {
    projects,
    activeProjectId,
    commitChanges,
    createBranch,
    switchBranch,
    updateFileContent,
    setGitCloneModalOpen,
    openFile,
    appendLogcat,
  } = useIdeStore();

  const [commitMsg, setCommitMsg] = useState('Update login screen & MainActivity handlers');
  const [newBranchInput, setNewBranchInput] = useState('');
  const [showNewBranch, setShowNewBranch] = useState(false);
  const [selectedDiffPath, setSelectedDiffPath] = useState<string | null>(null);
  const [gitBanner, setGitBanner] = useState<string | null>(null);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) || projects[0],
    [projects, activeProjectId]
  );

  const modifiedFiles = useMemo(() => {
    return activeProject.files.filter((f) => {
      if (f.type !== 'file') return false;
      const base = activeProject.git.initialSnapshot[f.path];
      return base !== f.content;
    });
  }, [activeProject]);

  const activeDiffFile = useMemo(() => {
    if (selectedDiffPath) {
      const found = modifiedFiles.find((f) => f.path === selectedDiffPath);
      if (found) return found;
    }
    return modifiedFiles[0] || null;
  }, [modifiedFiles, selectedDiffPath]);

  const showNotice = (text: string) => {
    setGitBanner(text);
    setTimeout(() => setGitBanner(null), 2600);
  };

  const handleCommit = (pushAfter: boolean) => {
    if (!commitMsg.trim()) return;
    commitChanges(commitMsg, pushAfter);
    setCommitMsg('');
    showNotice(
      pushAfter
        ? `Committed and pushed to origin/${activeProject.git.branch}`
        : `Committed changes on branch ${activeProject.git.branch}`
    );
  };

  const handleRevertFile = (path: string) => {
    const original = activeProject.git.initialSnapshot[path];
    if (original !== undefined) {
      updateFileContent(path, original);
      showNotice(`Reverted ${path.split('/').pop()} to HEAD`);
    }
  };

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchInput.trim()) return;
    createBranch(newBranchInput);
    setNewBranchInput('');
    setShowNewBranch(false);
    showNotice(`Switched to new branch '${newBranchInput.trim()}'`);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0B0F17] p-4 sm:p-6 lg:p-8 text-slate-100">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-100">
              Source Control (Git)
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 flex flex-wrap items-center gap-2">
              <span>Repository: <strong className="text-slate-200">{activeProject.name}</strong></span>
              <span>·</span>
              <span className="font-mono text-xs text-emerald-400">
                Branch: {activeProject.git.branch}
              </span>
              {activeProject.git.remoteUrl && (
                <>
                  <span>·</span>
                  <span className="font-mono text-xs text-slate-500 truncate max-w-xs">
                    {activeProject.git.remoteUrl}
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Branch Selector */}
            <div className="flex items-center gap-1.5 bg-[#111827] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
              <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={activeProject.git.branch}
                onChange={(e) => switchBranch(e.target.value)}
                className="bg-transparent text-slate-100 font-mono focus:outline-none"
              >
                {activeProject.git.branches.map((b) => (
                  <option key={b} value={b} className="bg-slate-900">
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowNewBranch((prev) => !prev)}
              className="px-3 py-1.5 rounded-lg bg-[#111827] hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>New Branch</span>
            </button>

            <button
              type="button"
              onClick={() => {
                appendLogcat('I', 'GitEngine', `Pulled latest commits from origin/${activeProject.git.branch}`);
                showNotice(`Already up to date with origin/${activeProject.git.branch}`);
              }}
              className="px-3 py-1.5 rounded-lg bg-[#111827] hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 flex items-center gap-1.5"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 text-sky-400" />
              <span>Pull</span>
            </button>

            <button
              type="button"
              onClick={() => setGitCloneModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-[#111827] hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 flex items-center gap-1.5"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Clone Repo</span>
            </button>
          </div>
        </div>

        {gitBanner && (
          <div className="px-4 py-2.5 rounded-lg bg-emerald-950/70 border border-emerald-700/60 text-xs text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{gitBanner}</span>
          </div>
        )}

        {showNewBranch && (
          <form
            onSubmit={handleCreateBranch}
            className="p-4 rounded-xl bg-[#111827] border border-slate-800 flex items-center gap-3 text-xs"
          >
            <GitBranch className="w-4 h-4 text-emerald-400 shrink-0" />
            <input
              type="text"
              value={newBranchInput}
              onChange={(e) => setNewBranchInput(e.target.value)}
              placeholder="New branch name (e.g. feature/material3-theme)..."
              autoFocus
              className="flex-1 px-3 py-1.5 rounded bg-slate-900 border border-slate-700 font-mono text-slate-100"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded bg-emerald-600 text-slate-950 font-semibold"
            >
              Checkout Branch
            </button>
          </form>
        )}

        {/* Main Grid: Working Tree Changes & Commit Box + Diff Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Working Changes & Commit Controls (Section 16) */}
          <div className="lg:col-span-5 p-5 rounded-xl bg-[#111827] border border-slate-800/80 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-slate-100">Working Tree Changes</h2>
                <span className="text-xs font-mono text-slate-400">
                  {modifiedFiles.length} modified
                </span>
              </div>

              {modifiedFiles.length === 0 ? (
                <div className="py-6 px-4 rounded-lg bg-slate-900/60 border border-slate-800/80 text-center text-xs text-slate-400">
                  Working tree is clean. Edit any file in the Code Editor or XML Designer to see live Git diffs here.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {modifiedFiles.map((file) => {
                    const isNew = activeProject.git.initialSnapshot[file.path] === undefined;
                    const isSelected = activeDiffFile?.path === file.path;

                    return (
                      <div
                        key={file.path}
                        onClick={() => setSelectedDiffPath(file.path)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-slate-800 text-slate-100 border border-slate-700'
                            : 'bg-slate-900/70 hover:bg-slate-800/60 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`font-mono font-bold ${
                              isNew ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            {isNew ? 'U' : 'M'}
                          </span>
                          <span className="truncate font-mono">{file.name}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openFile(file.path);
                            }}
                            className="text-[11px] text-slate-400 hover:text-emerald-300 px-1.5 py-0.5"
                          >
                            Edit
                          </button>
                          {!isNew && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRevertFile(file.path);
                              }}
                              className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-rose-300"
                              title="Discard Changes"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Commit Message & Commit Buttons */}
            <div className="pt-4 border-t border-slate-800/80 space-y-3">
              <label className="block text-xs font-medium text-slate-300">
                Commit Message
              </label>
              <textarea
                rows={3}
                value={commitMsg}
                onChange={(e) => setCommitMsg(e.target.value)}
                placeholder="Describe your changes (e.g. Update login screen)..."
                className="w-full p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleCommit(false)}
                  disabled={!commitMsg.trim()}
                  className="min-h-[42px] py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-100 font-semibold text-xs border border-slate-700 transition-colors cursor-pointer"
                >
                  Commit
                </button>
                <button
                  type="button"
                  onClick={() => handleCommit(true)}
                  disabled={!commitMsg.trim()}
                  className="min-h-[42px] py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-slate-950 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowUpFromLine className="w-3.5 h-3.5" />
                  <span>Commit & Push</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Diff Inspector & Commit Log */}
          <div className="lg:col-span-7 space-y-6">
            {/* File Diff Viewer */}
            <div className="p-5 rounded-xl bg-[#111827] border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileDiff className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-base font-semibold text-slate-100">
                    {activeDiffFile ? `Diff: ${activeDiffFile.path}` : 'Diff Inspector'}
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-400">HEAD vs Working Copy</span>
              </div>

              {activeDiffFile ? (
                <div className="p-3 rounded-lg bg-[#090D14] border border-slate-800 font-mono text-xs overflow-x-auto max-h-64 space-y-0.5">
                  {(() => {
                    const oldLines = (
                      activeProject.git.initialSnapshot[activeDiffFile.path] || ''
                    ).split('\n');
                    const newLines = (activeDiffFile.content || '').split('\n');
                    const maxLen = Math.max(oldLines.length, newLines.length);
                    const rows: React.ReactNode[] = [];

                    for (let i = 0; i < maxLen; i++) {
                      const a = oldLines[i];
                      const b = newLines[i];
                      if (a === b) {
                        rows.push(
                          <div key={i} className="text-slate-500 px-2">
                            {'  '}
                            {b}
                          </div>
                        );
                      } else {
                        if (a !== undefined) {
                          rows.push(
                            <div
                              key={`old-${i}`}
                              className="bg-rose-950/40 text-rose-300 px-2 rounded"
                            >
                              - {a}
                            </div>
                          );
                        }
                        if (b !== undefined) {
                          rows.push(
                            <div
                              key={`new-${i}`}
                              className="bg-emerald-950/40 text-emerald-300 px-2 rounded"
                            >
                              + {b}
                            </div>
                          );
                        }
                      }
                    }
                    return rows;
                  })()}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-4">
                  No modified files to diff.
                </p>
              )}
            </div>

            {/* Commit History Log */}
            <div className="p-5 rounded-xl bg-[#111827] border border-slate-800/80 space-y-3">
              <h2 className="text-base font-semibold text-slate-100">Recent Commits</h2>
              <div className="divide-y divide-slate-800/80">
                {activeProject.git.commits.map((c) => (
                  <div key={c.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <GitCommitIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="font-medium text-slate-100">{c.message}</div>
                        <div className="text-slate-400 mt-0.5 font-mono text-[11px]">
                          {c.hash} · {c.author} · {c.branch}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] text-slate-500 shrink-0">
                      {new Date(c.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
