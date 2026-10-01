import React, { useMemo, useRef, useState } from 'react';
import {
  Check,
  Code2,
  Columns,
  Copy,
  CornerDownLeft,
  FileCode,
  Hash,
  Redo2,
  Replace,
  Search,
  Smartphone,
  Sparkles,
  Undo2,
  X,
} from 'lucide-react';
import { useIdeStore } from '../../stores/ideStore';
import { XmlLayoutDesigner } from './XmlLayoutDesigner';

function highlightLineSyntax(line: string, lang: string, enabled: boolean): React.ReactNode {
  if (!enabled || !line) return line || ' ';

  if (lang === 'xml' || lang === 'html') {
    // Highlight XML tags, attributes, and quoted values
    const tokens = line.split(/(<\/?[a-zA-Z0-9_:-]+|\/>|>|[a-zA-Z0-9_:-]+="[^"]*"|<!--[\s\S]*?-->)/g);
    return tokens.map((tok, i) => {
      if (!tok) return null;
      if (tok.startsWith('<!--')) {
        return (
          <span key={i} className="text-slate-500 italic">
            {tok}
          </span>
        );
      }
      if (tok.startsWith('</') || tok.startsWith('<') || tok === '/>' || tok === '>') {
        return (
          <span key={i} className="text-sky-400 font-medium">
            {tok}
          </span>
        );
      }
      const attrMatch = tok.match(/^([a-zA-Z0-9_:-]+)=("[^"]*")$/);
      if (attrMatch) {
        return (
          <React.Fragment key={i}>
            <span className="text-amber-300">{attrMatch[1]}</span>
            <span className="text-slate-400">=</span>
            <span className="text-emerald-300">{attrMatch[2]}</span>
          </React.Fragment>
        );
      }
      return <span key={i}>{tok}</span>;
    });
  }

  // Comment line
  const trimmed = line.trim();
  if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
    return <span className="text-slate-500 italic">{line}</span>;
  }

  const keywordRegex =
    /\b(package|import|class|interface|object|fun|val|var|override|private|public|protected|static|final|void|int|boolean|String|return|if|else|for|while|when|true|false|null|companion|const|export|default|function|from|let|async|await|plugins|android|defaultConfig|buildTypes|dependencies|implementation)\b/g;

  const parts = line.split(/("[^"]*"|'[^']*'|@[a-zA-Z0-9_]+|\b\d+\b)/g);

  return parts.map((part, idx) => {
    if (!part) return null;
    if (
      (part.startsWith('"') && part.endsWith('"')) ||
      (part.startsWith("'") && part.endsWith("'"))
    ) {
      return (
        <span key={idx} className="text-emerald-300">
          {part}
        </span>
      );
    }
    if (part.startsWith('@')) {
      return (
        <span key={idx} className="text-amber-300">
          {part}
        </span>
      );
    }
    if (/^\d+$/.test(part)) {
      return (
        <span key={idx} className="text-purple-300">
          {part}
        </span>
      );
    }

    // Highlight keywords inside remaining code segment
    const subTokens = part.split(keywordRegex);
    return (
      <React.Fragment key={idx}>
        {subTokens.map((sub, j) =>
          keywordRegex.test(sub) ? (
            <span key={j} className="text-sky-400 font-medium">
              {sub}
            </span>
          ) : (
            <span key={j}>{sub}</span>
          )
        )}
      </React.Fragment>
    );
  });
}

const MOBILE_QUICK_KEYS = [
  { label: 'Tab', insert: '    ' },
  { label: 'Ctrl', action: 'ctrl' },
  { label: '←', action: 'left' },
  { label: '→', action: 'right' },
  { label: '{', insert: '{}' },
  { label: '}', insert: '}' },
  { label: ';', insert: ';' },
  { label: '=', insert: ' = ' },
  { label: '(', insert: '()' },
  { label: ')', insert: ')' },
  { label: '<', insert: '<' },
  { label: '>', insert: '>' },
  { label: '"', insert: '""' },
  { label: ':', insert: ': ' },
];

export const CodeEditor: React.FC = () => {
  const {
    projects,
    activeProjectId,
    openTabs,
    activeFilePath,
    openFile,
    closeTab,
    updateFileContent,
    undoEdit,
    redoEdit,
    setXmlViewMode,
    settings,
    appendLogcat,
  } = useIdeStore();

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const highlightPreRef = useRef<HTMLPreElement | null>(null);

  const [findBarOpen, setFindBarOpen] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [goToLineOpen, setGoToLineOpen] = useState(false);
  const [goToLineInput, setGoToLineInput] = useState('');
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [activeLine, setActiveLine] = useState(1);
  const [foldedLines, setFoldedLines] = useState<Record<number, boolean>>({});

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) || projects[0],
    [projects, activeProjectId]
  );

  const activeTab = useMemo(
    () => openTabs.find((t) => t.filePath === activeFilePath) || null,
    [openTabs, activeFilePath]
  );

  const activeFile = useMemo(
    () => activeProject?.files.find((f) => f.path === activeFilePath && f.type === 'file') || null,
    [activeProject, activeFilePath]
  );

  const content = activeFile?.content ?? '';
  const lines = useMemo(() => content.split('\n'), [content]);
  const isXmlFile = activeFile?.name.endsWith('.xml') ?? false;
  const xmlMode = activeTab?.xmlViewMode || (isXmlFile ? 'split' : 'code');

  const syncScroll = () => {
    if (textareaRef.current && highlightPreRef.current) {
      highlightPreRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightPreRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleCursorMove = () => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const textBefore = content.slice(0, pos);
    const lineNum = textBefore.split('\n').length;
    setActiveLine(lineNum);
  };

  const insertAtCursor = (snippet: string) => {
    if (!activeFile) return;
    const el = textareaRef.current;
    if (!el) {
      updateFileContent(activeFile.path, content + snippet);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = content.slice(0, start) + snippet + content.slice(end);
    updateFileContent(activeFile.path, next);

    requestAnimationFrame(() => {
      el.focus();
      const offset =
        snippet === '{}' || snippet === '()' || snippet === '""'
          ? start + 1
          : start + snippet.length;
      el.setSelectionRange(offset, offset);
      handleCursorMove();
    });
  };

  const handleKeyAction = (keyItem: (typeof MOBILE_QUICK_KEYS)[number]) => {
    if (keyItem.insert) {
      insertAtCursor(keyItem.insert);
      return;
    }
    const el = textareaRef.current;
    if (!el) return;
    const pos = el.selectionStart;
    if (keyItem.action === 'left') {
      el.focus();
      el.setSelectionRange(Math.max(0, pos - 1), Math.max(0, pos - 1));
      handleCursorMove();
    } else if (keyItem.action === 'right') {
      el.focus();
      el.setSelectionRange(Math.min(content.length, pos + 1), Math.min(content.length, pos + 1));
      handleCursorMove();
    } else if (keyItem.action === 'ctrl') {
      setFindBarOpen((prev) => !prev);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!activeFile) return;
    if (e.key === 'Tab') {
      e.preventDefault();
      insertAtCursor(' '.repeat(settings.tabSize));
    } else if (e.key === 'Enter') {
      const el = e.currentTarget;
      const start = el.selectionStart;
      const before = content.slice(0, start);
      const currentLineStr = before.split('\n').pop() || '';
      const indentMatch = currentLineStr.match(/^\s*/);
      const baseIndent = indentMatch ? indentMatch[0] : '';
      const extraIndent =
        currentLineStr.trim().endsWith('{') || currentLineStr.trim().endsWith('>')
          ? ' '.repeat(settings.tabSize)
          : '';
      e.preventDefault();
      insertAtCursor(`\n${baseIndent}${extraIndent}`);
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      setFindBarOpen((prev) => !prev);
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) redoEdit(activeFile.path);
      else undoEdit(activeFile.path);
    }
  };

  const handleReplaceAll = () => {
    if (!activeFile || !findQuery) return;
    const next = content.split(findQuery).join(replaceQuery);
    updateFileContent(activeFile.path, next);
    appendLogcat('I', 'CodeEditor', `Replaced occurrences of "${findQuery}" in ${activeFile.name}`);
  };

  const handleFormatCode = () => {
    if (!activeFile) return;
    let level = 0;
    const formatted = content
      .split('\n')
      .map((raw) => {
        const trimmed = raw.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('}') || trimmed.startsWith('</')) {
          level = Math.max(0, level - 1);
        }
        const out = ' '.repeat(level * settings.tabSize) + trimmed;
        if (
          (trimmed.endsWith('{') ||
            (trimmed.startsWith('<') &&
              !trimmed.startsWith('</') &&
              !trimmed.startsWith('<?') &&
              !trimmed.endsWith('/>') &&
              !trimmed.includes('</'))) &&
          !trimmed.startsWith('//')
        ) {
          level++;
        }
        return out;
      })
      .join('\n');

    updateFileContent(activeFile.path, formatted);
    appendLogcat('D', 'CodeFormatter', `Formatted ${activeFile.name}`);
  };

  const handleGoToLine = (e: React.FormEvent) => {
    e.preventDefault();
    const targetLine = parseInt(goToLineInput, 10);
    if (!isNaN(targetLine) && targetLine >= 1 && targetLine <= lines.length) {
      setActiveLine(targetLine);
      if (textareaRef.current) {
        const charOffset =
          lines.slice(0, targetLine - 1).join('\n').length + (targetLine > 1 ? 1 : 0);
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(charOffset, charOffset);
        textareaRef.current.scrollTop = Math.max(0, (targetLine - 3) * 22);
        syncScroll();
      }
    }
    setGoToLineOpen(false);
    setGoToLineInput('');
  };

  const handleCopyAll = () => {
    navigator.clipboard?.writeText(content);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 1800);
  };

  const matchCount = useMemo(() => {
    if (!findQuery) return 0;
    return content.split(findQuery).length - 1;
  }, [content, findQuery]);

  if (!activeFile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0D131F]">
        <FileCode className="w-10 h-10 text-slate-600 mb-3" />
        <h3 className="text-sm font-semibold text-slate-300">No Active File Selected</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Select a source file (`MainActivity.kt`, `activity_main.xml`, or `build.gradle`) from the Project Explorer to begin editing.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-[#0D131F] overflow-hidden">
      {/* File Tabs & Action Bar */}
      <div className="h-10 border-b border-slate-800/80 bg-[#0B0F17] flex items-center justify-between px-2 gap-2 shrink-0">
        {/* Scrollable Open Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar min-w-0 flex-1">
          {openTabs
            .filter((t) => t.projectId === activeProject.id)
            .map((tab) => {
              const fileObj = activeProject.files.find((f) => f.path === tab.filePath);
              if (!fileObj) return null;
              const isCurrent = tab.filePath === activeFilePath;
              const isDirty =
                activeProject.git.initialSnapshot[fileObj.path] !== undefined &&
                activeProject.git.initialSnapshot[fileObj.path] !== fileObj.content;

              return (
                <div
                  key={tab.filePath}
                  onClick={() => openFile(tab.filePath)}
                  className={`group flex items-center gap-2 px-3 h-8 rounded-md text-xs font-medium cursor-pointer transition-colors shrink-0 ${
                    isCurrent
                      ? 'bg-[#151F32] text-emerald-300 border border-slate-700/70'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <span className="truncate max-w-[140px]">{fileObj.name}</span>
                  {isDirty && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"
                      title="Modified since last Git commit"
                    />
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.filePath);
                    }}
                    className="p-0.5 rounded hover:bg-slate-700/60 text-slate-500 hover:text-slate-200"
                    title="Close Tab"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
        </div>

        {/* Right Editor Controls & XML Code/Design/Split Switcher */}
        <div className="flex items-center gap-1 shrink-0">
          {isXmlFile && (
            <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 mr-1.5">
              {(['code', 'design', 'split'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setXmlViewMode(activeFile.path, m)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-colors whitespace-nowrap ${
                    xmlMode === m
                      ? 'bg-emerald-600 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m === 'code' && <Code2 className="w-3 h-3" />}
                  {m === 'design' && <Smartphone className="w-3 h-3" />}
                  {m === 'split' && <Columns className="w-3 h-3" />}
                  <span>{m}</span>
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => undoEdit(activeFile.path)}
            disabled={!activeTab || activeTab.undoStack.length === 0}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => redoEdit(activeFile.path)}
            disabled={!activeTab || activeTab.redoStack.length === 0}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setFindBarOpen((prev) => !prev)}
            className={`p-1.5 rounded hover:bg-slate-800 ${
              findBarOpen ? 'text-emerald-400 bg-slate-800' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Find & Replace in File"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setGoToLineOpen((prev) => !prev)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            title="Go to Line"
          >
            <Hash className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleFormatCode}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            title="Auto-Indent & Format Code"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleCopyAll}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            title="Copy File Content"
          >
            {copiedNotice ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Inline Find & Replace Drawer */}
      {findBarOpen && (
        <div className="px-3 py-2 bg-[#111827] border-b border-slate-800 flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded px-2 py-1">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={findQuery}
              onChange={(e) => setFindQuery(e.target.value)}
              placeholder="Find in file..."
              className="bg-transparent text-slate-100 focus:outline-none w-32 sm:w-44"
            />
            <span className="text-[11px] font-mono text-slate-400">{matchCount} matches</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded px-2 py-1">
            <Replace className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              placeholder="Replace with..."
              className="bg-transparent text-slate-100 focus:outline-none w-32 sm:w-44"
            />
          </div>

          <button
            type="button"
            onClick={handleReplaceAll}
            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold transition-colors"
          >
            Replace All
          </button>
          <button
            type="button"
            onClick={() => setFindBarOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-200 ml-auto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Inline Go To Line Bar */}
      {goToLineOpen && (
        <form
          onSubmit={handleGoToLine}
          className="px-3 py-1.5 bg-[#111827] border-b border-slate-800 flex items-center gap-2 text-xs"
        >
          <span className="text-slate-400">Go to Line (1–{lines.length}):</span>
          <input
            type="number"
            min={1}
            max={lines.length}
            value={goToLineInput}
            onChange={(e) => setGoToLineInput(e.target.value)}
            placeholder={String(activeLine)}
            autoFocus
            className="w-20 px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-slate-100"
          />
          <button
            type="submit"
            className="px-2.5 py-1 rounded bg-emerald-600 text-slate-950 font-semibold"
          >
            Jump
          </button>
          <button
            type="button"
            onClick={() => setGoToLineOpen(false)}
            className="text-slate-400 hover:text-slate-200 ml-auto"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Main Editor Body: Code, Design, or Split */}
      <div className="flex-1 flex flex-col xl:flex-row min-h-0 overflow-hidden">
        {/* Code Viewport */}
        {(!isXmlFile || xmlMode === 'code' || xmlMode === 'split') && (
          <div
            className={`flex-1 flex min-h-0 relative overflow-hidden ${
              isXmlFile && xmlMode === 'split' ? 'border-b xl:border-b-0 xl:border-r border-slate-800' : ''
            }`}
          >
            {/* Line Numbers Gutter */}
            {settings.lineNumbers && (
              <div
                className="w-12 py-3 bg-[#0B0F17] border-r border-slate-800/70 select-none text-right pr-2.5 font-mono text-slate-500 shrink-0 overflow-hidden"
                style={{ fontSize: `${settings.fontSize}px`, lineHeight: '22px' }}
              >
                {lines.map((ln, idx) => {
                  const lineNo = idx + 1;
                  const canFold = ln.trim().endsWith('{') || ln.trim().startsWith('<LinearLayout');
                  return (
                    <div
                      key={lineNo}
                      onClick={() => {
                        if (canFold) {
                          setFoldedLines((prev) => ({ ...prev, [lineNo]: !prev[lineNo] }));
                        }
                      }}
                      className={`flex items-center justify-end gap-1 ${
                        activeLine === lineNo ? 'text-emerald-400 font-semibold' : ''
                      } ${canFold ? 'cursor-pointer hover:text-slate-300' : ''}`}
                      style={{ height: '22px' }}
                    >
                      <span>{lineNo}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Overlay Syntax Highlighting + Editable Textarea */}
            <div className="flex-1 relative min-w-0 h-full overflow-hidden bg-[#0D131F]">
              <pre
                ref={highlightPreRef}
                aria-hidden="true"
                className={`absolute inset-0 m-0 py-3 px-4 font-mono pointer-events-none overflow-hidden ${
                  settings.wordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
                }`}
                style={{
                  fontSize: `${settings.fontSize}px`,
                  lineHeight: '22px',
                  tabSize: settings.tabSize,
                }}
              >
                {lines.map((lineText, idx) => {
                  const lnNum = idx + 1;
                  const isCurrentLine = lnNum === activeLine;
                  return (
                    <div
                      key={lnNum}
                      className={`${isCurrentLine ? 'bg-slate-800/35 -mx-4 px-4' : ''}`}
                      style={{ minHeight: '22px' }}
                    >
                      {highlightLineSyntax(
                        lineText,
                        activeFile.language || 'kotlin',
                        settings.syntaxHighlighting
                      )}
                    </div>
                  );
                })}
              </pre>

              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => updateFileContent(activeFile.path, e.target.value)}
                onScroll={syncScroll}
                onClick={handleCursorMove}
                onKeyUp={handleCursorMove}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                className={`absolute inset-0 w-full h-full py-3 px-4 font-mono bg-transparent text-transparent caret-emerald-400 resize-none focus:outline-none overflow-auto selection:bg-emerald-500/30 ${
                  settings.wordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
                }`}
                style={{
                  fontSize: `${settings.fontSize}px`,
                  lineHeight: '22px',
                  tabSize: settings.tabSize,
                }}
              />
            </div>
          </div>
        )}

        {/* XML Design Viewport */}
        {isXmlFile && (xmlMode === 'design' || xmlMode === 'split') && (
          <div className="flex-1 min-h-0 overflow-hidden">
            <XmlLayoutDesigner
              filePath={activeFile.path}
              xmlContent={content}
              onChangeXml={(updated) => updateFileContent(activeFile.path, updated)}
            />
          </div>
        )}
      </div>

      {/* Mobile Developer Quick Symbol Touch Bar (Section 7 of PRD: Tab Ctrl ← → { } ; =) */}
      <div className="h-10 bg-[#0B0F17] border-t border-slate-800/80 px-2 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar shrink-0">
        <div className="flex items-center gap-1">
          {MOBILE_QUICK_KEYS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleKeyAction(item)}
              className="min-w-[36px] h-7 px-2 rounded bg-slate-900 hover:bg-slate-800 active:bg-emerald-600 active:text-slate-950 border border-slate-800 font-mono text-xs text-slate-200 flex items-center justify-center transition-colors shrink-0"
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => insertAtCursor('\n')}
            className="min-w-[36px] h-7 px-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 font-mono text-xs text-slate-200 flex items-center justify-center shrink-0"
            title="Insert Newline"
          >
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="hidden md:flex items-center gap-3 text-[11px] font-mono text-slate-500 shrink-0 pl-2">
          <span>Ln {activeLine}, Col 1</span>
          <span>·</span>
          <span className="uppercase">{activeFile.language || 'TEXT'}</span>
          <span>·</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
};
