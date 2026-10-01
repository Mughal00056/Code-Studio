import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Pause,
  Play,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useIdeStore } from '../../stores/ideStore';
import { LogcatEntry } from '../../types/ide';

export const LogcatPanel: React.FC = () => {
  const {
    logcatEntries,
    logcatPaused,
    setLogcatPaused,
    appendLogcat,
    clearLogcat,
  } = useIdeStore();

  const [tagFilter, setTagFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState<'ALL' | LogcatEntry['level']>('ALL');
  const [copied, setCopied] = useState(false);

  const filteredLogs = useMemo(() => {
    return logcatEntries.filter((entry) => {
      if (levelFilter !== 'ALL' && entry.level !== levelFilter) return false;
      if (tagFilter.trim()) {
        const q = tagFilter.toLowerCase();
        return (
          entry.tag.toLowerCase().includes(q) ||
          entry.message.toLowerCase().includes(q) ||
          entry.packageName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logcatEntries, tagFilter, levelFilter]);

  const handleCopyLogs = () => {
    const text = filteredLogs
      .map((l) => `${l.timestamp} ${l.pid} ${l.level}/${l.tag}: ${l.message}`)
      .join('\n');
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleSaveLogs = () => {
    const text = filteredLogs
      .map((l) => `${l.timestamp} ${l.pid} ${l.level}/${l.tag}: ${l.message}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logcat-${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const emitSampleEvent = () => {
    const samples: { level: LogcatEntry['level']; tag: string; msg: string }[] = [
      { level: 'I', tag: 'MainActivity', msg: 'onResume() lifecycle callback completed in 12ms' },
      { level: 'D', tag: 'RecyclerView', msg: 'Bound ViewHolder at position 0 (itemViewType=1)' },
      { level: 'W', tag: 'Choreographer', msg: 'Skipped 2 frames! The application may be doing too much work on its main thread.' },
      { level: 'E', tag: 'SQLiteLog', msg: '(1) no such table: cached_sessions in "SELECT * FROM cached_sessions"' },
    ];
    const pick = samples[Math.floor(Math.random() * samples.length)];
    appendLogcat(pick.level, pick.tag, pick.msg);
  };

  return (
    <div className="flex flex-col h-full bg-[#090D14] text-slate-200">
      {/* Logcat Filter & Control Bar */}
      <div className="px-3 py-1.5 bg-[#0E1420] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              type="text"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              placeholder="Filter tag or message (e.g. MainActivity)..."
              className="bg-transparent text-slate-200 placeholder:text-slate-500 focus:outline-none w-full"
            />
          </div>

          <div className="flex items-center bg-slate-900 p-0.5 rounded border border-slate-800">
            {(['ALL', 'V', 'D', 'I', 'W', 'E'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevelFilter(lvl)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-colors ${
                  levelFilter === lvl
                    ? 'bg-emerald-600 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={emitSampleEvent}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300"
            title="Emit Test Log Event"
          >
            <Plus className="w-3 h-3 text-emerald-400" />
            <span>Test Event</span>
          </button>
          <button
            type="button"
            onClick={() => setLogcatPaused(!logcatPaused)}
            className={`p-1.5 rounded border ${
              logcatPaused
                ? 'bg-amber-950/60 border-amber-700 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
            title={logcatPaused ? 'Resume Logcat Stream' : 'Pause Logcat Stream'}
          >
            {logcatPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={handleCopyLogs}
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300"
            title="Copy Logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={handleSaveLogs}
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300"
            title="Save .log File"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={clearLogcat}
            className="p-1.5 rounded bg-slate-900 hover:bg-rose-950/50 border border-slate-800 text-slate-300 hover:text-rose-300"
            title="Clear Logcat"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Logcat Entries Stream */}
      <div className="flex-1 p-3 overflow-y-auto font-mono text-xs space-y-1">
        {filteredLogs.length === 0 ? (
          <div className="text-slate-500 py-6 text-center">
            No Logcat entries match the current filter.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const levelColor =
              log.level === 'E'
                ? 'text-rose-400 font-semibold'
                : log.level === 'W'
                ? 'text-amber-300'
                : log.level === 'I'
                ? 'text-emerald-300'
                : log.level === 'D'
                ? 'text-sky-300'
                : 'text-slate-400';

            return (
              <div
                key={log.id}
                className="flex items-start gap-2.5 py-0.5 hover:bg-slate-900/60 px-1.5 rounded leading-relaxed"
              >
                <span className="text-slate-500 shrink-0">{log.timestamp}</span>
                <span className={`shrink-0 w-28 truncate ${levelColor}`}>
                  {log.level}/{log.tag}:
                </span>
                <span className="text-slate-200 break-all">{log.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
