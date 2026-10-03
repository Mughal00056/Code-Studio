/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Code2,
  Command,
  Cpu,
  Download,
  FolderGit2,
  FolderTree,
  Hammer,
  Home,
  Package,
  Play,
  Search,
  Settings,
  Smartphone,
  Terminal as TerminalIcon,
} from 'lucide-react';
import { useIdeStore } from './stores/ideStore';
import { ProjectExplorer } from './components/Explorer/ProjectExplorer';
import { CodeEditor } from './components/Editor/CodeEditor';
import { TerminalPanel } from './components/Terminal/TerminalPanel';
import { LogcatPanel } from './components/Logcat/LogcatPanel';
import { BuildAndApkView } from './components/Build/BuildAndApkView';
import { HomeDashboard } from './pages/HomeDashboard';
import { GitSourceControlView } from './pages/GitSourceControlView';
import { DeviceManagerView } from './pages/DeviceManagerView';
import { SettingsView } from './pages/SettingsView';
import { IdeModals } from './components/Modals/IdeModals';
import {
  downloadFullProjectZip,
  getProjectEstimatedSizeMb,
} from './services/projectExporter';
import { ActiveScreen } from './types/ide';

const NAV_ITEMS: { id: ActiveScreen; label: string }[] = [
  { id: 'home', label: 'Dashboard' },
  { id: 'workspace', label: 'Workspace' },
  { id: 'build', label: 'Build & APK' },
  { id: 'git', label: 'Git' },
  { id: 'devices', label: 'Devices' },
  { id: 'settings', label: 'Settings' },
];

export default function App() {
  const {
    activeScreen,
    setActiveScreen,
    bottomPanelOpen,
    setBottomPanelOpen,
    bottomPanelTab,
    setBottomPanelTab,
    explorerOpenMobile,
    setExplorerOpenMobile,
    setSearchModalOpen,
    setCommandPaletteOpen,
    setSdkManagerModalOpen,
    triggerBuild,
    isBuilding,
    buildLogs,
    settings,
    projects,
    activeProjectId,
    apkArtifacts,
    setActiveInstallApk,
    termuxConnected,
  } = useIdeStore();

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) || projects[0],
    [projects, activeProjectId]
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setCommandPaletteOpen, setSearchModalOpen]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0B0F17] text-slate-100 overflow-hidden select-none">
      {/* Top Bar Contract: 3-Zone Header */}
      <header className="h-13 px-4 bg-[#0B0F17] border-b border-slate-800/80 flex items-center justify-between gap-4 shrink-0 z-30">
        {/* Zone 1: Single Text Element Brand Wordmark */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            setActiveScreen('home');
          }}
          className="text-lg font-display font-bold tracking-tight text-slate-100 hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0"
        >
          CodeStudio
        </a>

        {/* Zone 2: Clean Typography Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
          {NAV_ITEMS.map((item) => {
            const isActive = activeScreen === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveScreen(item.id);
                }}
                className={`py-1 transition-colors whitespace-nowrap border-b-2 ${
                  isActive
                    ? 'text-slate-100 border-emerald-400 font-semibold'
                    : 'border-transparent hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Primary Contextual Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {activeScreen === 'workspace' && (
            <button
              type="button"
              onClick={() => setExplorerOpenMobile(!explorerOpenMobile)}
              className="md:hidden p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300"
              title="Toggle Project Explorer"
            >
              <FolderTree className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setSdkManagerModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-slate-100 transition-colors whitespace-nowrap cursor-pointer"
            title="Android Studio SDK & Toolchain Installer"
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>SDK Manager</span>
          </button>

          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 transition-colors cursor-pointer"
            title="Search Everywhere (Ctrl+Shift+F)"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-slate-100 transition-colors whitespace-nowrap cursor-pointer"
            title="Open Command Palette (Ctrl+K)"
          >
            <Command className="w-3.5 h-3.5 text-emerald-400" />
            <span>Commands</span>
          </button>

          <button
            type="button"
            onClick={() => downloadFullProjectZip(activeProject)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-emerald-300 hover:text-emerald-200 transition-colors whitespace-nowrap cursor-pointer"
            title={`Download ${activeProject.name}-Full-Project.zip (${getProjectEstimatedSizeMb(activeProject)} MB)`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">
              Download Project ({getProjectEstimatedSizeMb(activeProject)} MB)
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              const latestApk = apkArtifacts[0];
              if (latestApk) {
                setActiveInstallApk(latestApk);
              } else {
                triggerBuild('apk', true);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-700/60 text-xs font-semibold text-emerald-300 hover:text-emerald-200 transition-colors whitespace-nowrap cursor-pointer"
            title="Install Application (100% Guaranteed)"
          >
            <Package className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Install App (100%)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerBuild('apk', true);
              if (activeScreen === 'workspace') {
                setBottomPanelTab('build_output');
              }
            }}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isBuilding ? 'Building...' : 'Build & Install'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {activeScreen === 'home' && <HomeDashboard />}

        {activeScreen === 'workspace' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Upper Workspace Split: Explorer + Editor */}
            <div className="flex-1 flex min-h-0 overflow-hidden relative">
              <div className="hidden md:flex h-full">
                <ProjectExplorer />
              </div>

              {explorerOpenMobile && (
                <div className="fixed inset-0 z-40 md:hidden flex">
                  <div className="h-full z-10">
                    <ProjectExplorer />
                  </div>
                  <div
                    onClick={() => setExplorerOpenMobile(false)}
                    className="flex-1 bg-black/60 backdrop-blur-xs"
                  />
                </div>
              )}

              <CodeEditor />
            </div>

            {/* Docked Bottom Console Panel: Terminal / Build Output / Logcat */}
            <div
              className={`border-t border-slate-800/90 bg-[#090D14] flex flex-col shrink-0 transition-all ${
                bottomPanelOpen ? 'h-56 sm:h-64' : 'h-9'
              }`}
            >
              <div className="h-9 px-3 bg-[#0E1420] border-b border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setBottomPanelTab('terminal')}
                    className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                      bottomPanelOpen && bottomPanelTab === 'terminal'
                        ? 'bg-slate-800 text-emerald-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Termux Shell & Bridge Connection"
                  >
                    <TerminalIcon className="w-3.5 h-3.5" />
                    <span>Termux Terminal</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        termuxConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                      }`}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => setBottomPanelTab('build_output')}
                    className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                      bottomPanelOpen && bottomPanelTab === 'build_output'
                        ? 'bg-slate-800 text-emerald-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Clean Build Logs Mode: Shows only compiler and build logs without terminal clutter"
                  >
                    <Hammer className="w-3.5 h-3.5" />
                    <span>Only Build Logs</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBottomPanelTab('logcat')}
                    className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                      bottomPanelOpen && bottomPanelTab === 'logcat'
                        ? 'bg-slate-800 text-emerald-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Logcat</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="hidden sm:inline text-[11px] font-mono text-slate-400">
                    {activeProject.name} · {activeProject.language} · {activeProject.buildSystem}
                  </span>
                  <button
                    type="button"
                    onClick={() => setBottomPanelOpen(!bottomPanelOpen)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                    title={bottomPanelOpen ? 'Minimize Console' : 'Expand Console'}
                  >
                    {bottomPanelOpen ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronUp className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {bottomPanelOpen && (
                <div className="flex-1 min-h-0 overflow-hidden">
                  {bottomPanelTab === 'terminal' && <TerminalPanel />}
                  {bottomPanelTab === 'logcat' && <LogcatPanel />}
                  {bottomPanelTab === 'build_output' && (
                    <div className="flex flex-col h-full bg-[#070A0F] text-slate-300">
                      <div className="px-3 py-1.5 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between text-xs font-sans">
                        <div className="flex items-center gap-2">
                          <Hammer className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="font-semibold text-slate-100">
                            {activeProject.name} (Only Build Logs)
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400">
                            {isBuilding ? '• Compiling APK...' : '• Ready'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => triggerBuild('apk', true)}
                            disabled={isBuilding}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-sans font-bold text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>{isBuilding ? 'Building...' : 'Build APK'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => triggerBuild('clean')}
                            disabled={isBuilding}
                            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 cursor-pointer"
                          >
                            Clean
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(buildLogs.join('\n'));
                            }}
                            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 cursor-pointer"
                          >
                            Copy Logs
                          </button>
                        </div>
                      </div>
                      <div className="p-3 flex-1 overflow-y-auto font-mono text-xs space-y-1 text-slate-300">
                        {buildLogs.map((ln, idx) => (
                          <div
                            key={idx}
                            className={
                              ln.startsWith('BUILD SUCCESSFUL')
                                ? 'text-emerald-400 font-semibold bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-800/40'
                                : ln.startsWith('> Task')
                                ? 'text-sky-300'
                                : ln.startsWith('Starting')
                                ? 'text-emerald-300 font-medium'
                                : ''
                            }
                          >
                            {ln || '\u00A0'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeScreen === 'build' && <BuildAndApkView />}
        {activeScreen === 'git' && <GitSourceControlView />}
        {activeScreen === 'devices' && <DeviceManagerView />}
        {activeScreen === 'settings' && <SettingsView />}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden h-14 bg-[#0B0F17] border-t border-slate-800/90 grid grid-cols-6 items-center shrink-0 z-30">
        {[
          { id: 'home' as const, label: 'Home', icon: Home },
          { id: 'workspace' as const, label: 'Editor', icon: Code2 },
          { id: 'build' as const, label: 'Build', icon: Hammer },
          { id: 'git' as const, label: 'Git', icon: FolderGit2 },
          { id: 'devices' as const, label: 'Devices', icon: Smartphone },
          { id: 'settings' as const, label: 'Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeScreen === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveScreen(tab.id)}
              className={`h-full flex flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-medium tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Global Modals (Visual Photo Templates, SDK Installer, APK Package Installer, Global Search, Command Palette) */}
      <IdeModals />
    </div>
  );
}
