import React, { useEffect, useRef, useState } from 'react';
import { CornerDownLeft, Play, Terminal as TerminalIcon, Trash2 } from 'lucide-react';
import { useIdeStore } from '../../stores/ideStore';

const QUICK_COMMANDS = [
  './gradlew assembleDebug',
  './gradlew clean',
  'ls',
  'pwd',
  'git status',
  'git log',
  'adb devices',
  'help',
];

export const TerminalPanel: React.FC = () => {
  const {
    terminalCwd,
    terminalLines,
    executeTerminalCommand,
    clearTerminal,
    settings,
  } = useIdeStore();

  const [inputCmd, setInputCmd] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([
    './gradlew assembleDebug',
    'git status',
    'ls',
  ]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);

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

  return (
    <div className="flex flex-col h-full bg-[#090D14] text-slate-200 font-mono">
      {/* Quick Command Bar for Mobile Ergonomics */}
      <div className="px-3 py-1.5 bg-[#0E1420] border-b border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0">
        <div className="flex items-center gap-1.5">
          <TerminalIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0 mr-1" />
          {QUICK_COMMANDS.map((cmd) => (
            <button
              key={cmd}
              type="button"
              onClick={() => executeTerminalCommand(cmd)}
              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-emerald-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1"
            >
              {cmd.startsWith('./gradlew') && <Play className="w-2.5 h-2.5 text-emerald-400" />}
              <span>{cmd}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={clearTerminal}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 shrink-0"
          title="Clear Terminal Output"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Scrollable Terminal Output Stream */}
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

      {/* Interactive Shell Prompt */}
      <form
        onSubmit={handleSubmit}
        className="px-3 py-2 bg-[#0B0F17] border-t border-slate-800/80 flex items-center gap-2 shrink-0"
      >
        <span className="text-xs text-emerald-400 font-semibold shrink-0">
          {terminalCwd.split('/').pop() || '~'} $
        </span>
        <input
          type="text"
          value={inputCmd}
          onChange={(e) => setInputCmd(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type command (e.g. ./gradlew assembleDebug, ls, git status)..."
          autoCapitalize="off"
          autoComplete="off"
          spellCheck={false}
          className="flex-1 bg-transparent text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none"
        />
        <button
          type="submit"
          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-sans font-semibold text-xs flex items-center gap-1 shrink-0"
        >
          <span>Run</span>
          <CornerDownLeft className="w-3 h-3" />
        </button>
      </form>
    </div>
  );
};
