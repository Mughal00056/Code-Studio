import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  CornerDownLeft,
  Cpu,
  FileCode2,
  Hammer,
  HelpCircle,
  Play,
  RefreshCw,
  Server,
  Settings2,
  Terminal as TerminalIcon,
  Trash2,
  Wifi,
  X,
} from 'lucide-react';
import { useIdeStore } from '../../stores/ideStore';

const TERMUX_QUICK_COMMANDS = [
  './gradlew assembleDebug',
  'pkg install openjdk-17 gradle',
  'termux-setup-storage',
  'flutter build apk',
  'pkg update',
  'termux-info',
  'adb install',
  'git status',
  'ls',
  'clear',
];

export const TerminalPanel: React.FC = () => {
  const {
    terminalCwd,
    terminalLines,
    executeTerminalCommand,
    clearTerminal,
    settings,
    buildLogs,
    isBuilding,
    triggerBuild,
    termuxConnected,
    setTermuxConnected,
    terminalViewMode,
    setTerminalViewMode,
    projects,
    activeProjectId,
  } = useIdeStore();

  const [inputCmd, setInputCmd] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([
    './gradlew assembleDebug',
    'pkg install openjdk-17 gradle',
    'termux-setup-storage',
    'flutter build apk',
    'git status',
  ]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [termuxModalOpen, setTermuxModalOpen] = useState(false);
  const [termuxHost, setTermuxHost] = useState('127.0.0.1');
  const [termuxPort, setTermuxPort] = useState('8022');
  const [termuxUser, setTermuxUser] = useState('u0_a294');
  const [copyFeedback, setCopyFeedback] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const buildLogsBottomRef = useRef<HTMLDivElement | null>(null);

  const activeProject =
    projects.find((p) => p.id === activeProjectId) || projects[0];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);

  useEffect(() => {
    buildLogsBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [buildLogs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCmd.trim()) return;
    executeTerminalCommand(inputCmd);
    setCmdHistory((prev) => [inputCmd, ...prev.slice(0, 29)]);
    setHistoryIdx(-1);
    setInputCmd('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const nextIdx = Math.min(historyIdx + 1, cmdHistory.length - 1);
      if (cmdHistory[nextIdx]) {
        setHistoryIdx(nextIdx);
        setInputCmd(cmdHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = historyIdx - 1;
      if (nextIdx < 0) {
        setHistoryIdx(-1);
        setInputCmd('');
      } else {
        setHistoryIdx(nextIdx);
        setInputCmd(cmdHistory[nextIdx]);
      }
    }
  };

  const handleCopyBuildLogs = () => {
    navigator.clipboard?.writeText(buildLogs.join('\n'));
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#090D14] text-slate-200 font-mono">
      {/* Top Header: Termux Connection Bridge & Mode Switcher */}
      <div className="px-3 py-1.5 bg-[#0E1420] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher: Only Build Logs vs Termux Terminal */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setTerminalViewMode('build_logs')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                terminalViewMode === 'build_logs'
                  ? 'bg-emerald-600 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Clean Build Logs Mode: Shows only compiler and build logs without terminal clutter"
            >
              <Hammer className="w-3.5 h-3.5" />
              <span>Only Build Logs</span>
            </button>
            <button
              type="button"
              onClick={() => setTerminalViewMode('termux')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                terminalViewMode === 'termux'
                  ? 'bg-emerald-600 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Interactive Termux Shell Connection"
            >
              <TerminalIcon className="w-3.5 h-3.5" />
              <span>Termux Terminal</span>
            </button>
          </div>

          {/* 1-Click Termux Connect / Disconnect Toggle Button */}
          <button
            type="button"
            onClick={() => setTermuxConnected(!termuxConnected)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-sans font-bold border transition-colors cursor-pointer ${
              termuxConnected
                ? 'bg-emerald-950/80 border-emerald-600/70 text-emerald-300'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-emerald-300'
            }`}
            title="Click to Connect or Disconnect Termux"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                termuxConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              }`}
            />
            <span>{termuxConnected ? 'Termux: Connected ✓' : 'Connect Termux'}</span>
          </button>

          {/* Quick Copy Termux Commands Button */}
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(
                'pkg update -y && pkg install -y openjdk-17 gradle git openssh && sshd -p 8022'
              );
              setCopyFeedback(true);
              setTimeout(() => setCopyFeedback(false), 2000);
            }}
            className="hidden md:flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-emerald-300 cursor-pointer"
            title="Copy command to run in Termux on your Android phone"
          >
            <Copy className="w-3 h-3 text-emerald-400" />
            <span>Copy Termux Setup</span>
          </button>

          {/* Termux Settings Config Button */}
          <button
            type="button"
            onClick={() => setTermuxModalOpen(true)}
            className="p-1 rounded text-slate-400 hover:text-emerald-300 cursor-pointer"
            title="Configure Termux Connection Bridge (Host, Port, User)"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {terminalViewMode === 'build_logs' ? (
            <>
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
                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-slate-100 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Clean</span>
              </button>
              <button
                type="button"
                onClick={handleCopyBuildLogs}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                title="Copy Build Logs"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setTermuxModalOpen(true)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-emerald-300"
                title="Termux Connection Settings"
              >
                <Server className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={clearTerminal}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                title="Clear Terminal Output"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* VIEW 1: TERMUX INTERACTIVE TERMINAL */}
      {terminalViewMode === 'termux' && (
        <>
          {/* Quick Command Bar */}
          <div className="px-3 py-1 bg-[#090D14] border-b border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] text-emerald-400 font-sans font-semibold shrink-0">
              Termux:
            </span>
            {TERMUX_QUICK_COMMANDS.map((cmd) => (
              <button
                key={cmd}
                type="button"
                onClick={() => executeTerminalCommand(cmd)}
                className="px-2 py-0.5 rounded bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-emerald-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer"
              >
                {(cmd.startsWith('./gradlew') || cmd.startsWith('flutter build')) && (
                  <Play className="w-2.5 h-2.5 text-emerald-400" />
                )}
                <span>{cmd}</span>
              </button>
            ))}
          </div>

          {/* Terminal Output */}
          <div
            className="flex-1 p-3 overflow-y-auto space-y-1.5"
            style={{ fontSize: `${settings.terminalFontSize}px` }}
          >
            {terminalLines.map((line) => (
              <div
                key={line.id}
                className={`whitespace-pre-wrap break-words leading-relaxed ${
                  line.type === 'input'
                    ? 'text-emerald-400 font-semibold'
                    : line.type === 'error'
                    ? 'text-rose-400'
                    : line.type === 'success'
                    ? 'text-emerald-300 font-medium'
                    : line.type === 'info'
                    ? 'text-sky-300'
                    : 'text-slate-300'
                }`}
              >
                {line.text}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Shell Input Prompt */}
          <form
            onSubmit={handleSubmit}
            className="px-3 py-2 bg-[#0B0F17] border-t border-slate-800/80 flex items-center gap-2 shrink-0"
          >
            <span className="text-xs text-emerald-400 font-semibold shrink-0 flex items-center gap-1">
              <span className="text-slate-500 font-normal">termux@localhost:</span>
              <span>{terminalCwd.split('/').pop() || '~'} $</span>
            </span>
            <input
              type="text"
              value={inputCmd}
              onChange={(e) => setInputCmd(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Termux command (./gradlew assembleDebug, pkg install, flutter build apk)..."
              autoCapitalize="off"
              autoComplete="off"
              spellCheck={false}
              className="flex-1 bg-transparent text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none"
            />
            <button
              type="submit"
              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-sans font-semibold text-xs flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <span>Run</span>
              <CornerDownLeft className="w-3 h-3" />
            </button>
          </form>
        </>
      )}

      {/* VIEW 2: ONLY BUILD LOGS (Pure, clean build log streaming) */}
      {terminalViewMode === 'build_logs' && (
        <div className="flex-1 flex flex-col min-h-0 bg-[#070A0F]">
          <div className="px-4 py-2 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between text-xs font-sans">
            <div className="flex items-center gap-2">
              <Hammer className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-slate-100">
                {activeProject.name} Build Output Pipeline
              </span>
              <span className="text-[11px] font-mono text-emerald-400">
                {isBuilding ? '• Compiling Sources...' : '• BUILD READY (100%)'}
              </span>
            </div>
            {copyFeedback && (
              <span className="text-[11px] font-mono text-emerald-400">
                ✓ Build logs copied!
              </span>
            )}
          </div>

          <div className="flex-1 p-3.5 overflow-y-auto space-y-1 font-mono text-xs text-slate-300">
            {buildLogs.map((ln, idx) => (
              <div
                key={idx}
                className={
                  ln.startsWith('BUILD SUCCESSFUL')
                    ? 'text-emerald-400 font-bold bg-emerald-950/20 px-2 py-1 rounded border border-emerald-800/40'
                    : ln.startsWith('> Task')
                    ? 'text-sky-300'
                    : ln.startsWith('Starting')
                    ? 'text-emerald-300 font-semibold'
                    : 'text-slate-300'
                }
              >
                {ln || '\u00A0'}
              </div>
            ))}
            <div ref={buildLogsBottomRef} />
          </div>
        </div>
      )}

      {/* Termux Connection Settings Modal */}
      {termuxModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#111827] border border-slate-800 shadow-2xl overflow-hidden font-sans">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-emerald-400" />
                <h3 className="font-display font-bold text-slate-100 text-sm">
                  Termux Connection Bridge
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTermuxModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-100">
                    Termux SSH Bridge Status
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Connect local Termux session on Android
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTermuxConnected(!termuxConnected)}
                  className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                    termuxConnected
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {termuxConnected ? 'Connected ✓' : 'Connect'}
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-400 mb-1">
                    Termux SSH Host
                  </label>
                  <input
                    type="text"
                    value={termuxHost}
                    onChange={(e) => setTermuxHost(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-slate-100 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Port</label>
                    <input
                      type="text"
                      value={termuxPort}
                      onChange={(e) => setTermuxPort(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-slate-100 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">User</label>
                    <input
                      type="text"
                      value={termuxUser}
                      onChange={(e) => setTermuxUser(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-slate-100 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">
                    Termux Prefix Path
                  </label>
                  <input
                    type="text"
                    disabled
                    value="/data/data/com.termux/files/usr"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-slate-400 text-xs"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 text-xs">
                    Termux 1-Line Setup Command
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(
                        'termux-setup-storage && pkg update -y && pkg install -y openjdk-17 gradle git openssh && sshd -p 8022'
                      );
                      setCopyFeedback(true);
                      setTimeout(() => setCopyFeedback(false), 2000);
                    }}
                    className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Command</span>
                  </button>
                </div>
                <code className="block p-2 rounded bg-slate-950 font-mono text-[10px] text-emerald-300 break-all select-all">
                  termux-setup-storage &amp;&amp; pkg update -y &amp;&amp; pkg install -y openjdk-17 gradle git openssh &amp;&amp; sshd -p 8022
                </code>
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-[11px] leading-relaxed">
                Tip: Run <code className="font-mono font-bold">sshd</code> inside
                Termux on your phone to allow full local shell access on port 8022.
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setTermuxModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold cursor-pointer"
                >
                  Save & Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
