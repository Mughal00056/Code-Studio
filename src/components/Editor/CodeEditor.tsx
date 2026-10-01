import React, { useMemo, useRef, useState } from 'react';
import {
  Check,
  ClipboardPaste,
  Code2,
  Columns,
  Copy,
  CornerDownLeft,
  FileCode,
  Hash,
  MousePointerClick,
  Redo2,
  Replace,
  Scissors,
  Search,
  Smartphone,
  Sparkles,
  Undo2,
  X,
} from 'lucide-react';
import { useIdeStore } from '../../stores/ideStore';
import { ProjectBuildSystem, ProjectLanguage } from '../../types/ide';
import { XmlLayoutDesigner } from './XmlLayoutDesigner';

function highlightLineSyntax(line: string, lang: string, enabled: boolean): React.ReactNode {
  if (!enabled || !line) return line || ' ';

  if (lang === 'xml' || lang === 'html') {
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

  const trimmed = line.trim();
  if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
    return <span className="text-slate-500 italic">{line}</span>;
  }

  const keywordRegex =
    /\b(package|import|class|interface|object|fun|val|var|override|private|public|protected|static|final|void|int|boolean|String|Widget|BuildContext|StatefulWidget|StatelessWidget|State|Scaffold|MaterialApp|AppBar|Column|Row|Text|ElevatedButton|FloatingActionButton|setState|extends|required|super|return|if|else|for|while|when|true|false|null|companion|const|export|default|function|from|let|async|await|plugins|android|defaultConfig|buildTypes|dependencies|implementation)\b/g;

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
  { label: 'Select', action: 'select_word' },
  { label: 'Copy', action: 'copy' },
  { label: 'Paste', action: 'paste' },
  { label: 'Cut', action: 'cut' },
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
];

const LANGUAGE_BUILD_OPTIONS: {
  lang: ProjectLanguage;
  build: ProjectBuildSystem;
}[] = [
  { lang: 'Kotlin', build: 'Kotlin Gradle DSL' },
  { lang: 'Java', build: 'Java Groovy Gradle' },
  { lang: 'React', build: 'React Vite + Capacitor' },
  { lang: 'Flutter', build: 'Flutter + Gradle' },
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
    setProjectBuildConfig,
    editorClipboard,
    setEditorClipboard,
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
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [activeLine, setActiveLine] = useState(1);

  // Selection Range tracking for interactive Select / Copy / Cut / Paste bar
  const [selectionRange, setSelectionRange] = useState<{
    start: number;
    end: number;
    text: string;
  }>({ start: 0, end: 0, text: '' });

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

  const showEditorToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 1800);
  };

  const syncScroll = () => {
    if (textareaRef.current && highlightPreRef.current) {
      highlightPreRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightPreRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const updateSelectionState = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const textBefore = content.slice(0, start);
    setActiveLine(textBefore.split('\n').length);
    setSelectionRange({
      start,
      end,
      text: end > start ? content.slice(start, end) : '',
    });
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
      updateSelectionState();
    });
  };

  // Selection & Clipboard Operations (Select Word, Select Line, Select All, Copy, Cut, Paste)
  const handleSelectWord = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    const pos = el.selectionStart;
    let left = pos;
    let right = pos;
    while (left > 0 && /[a-zA-Z0-9_@.$]/.test(content[left - 1])) left--;
    while (right < content.length && /[a-zA-Z0-9_@.$]/.test(content[right])) right++;
    if (left === right && content.length > 0) {
      right = Math.min(content.length, left + 1);
    }
    el.setSelectionRange(left, right);
    setSelectionRange({ start: left, end: right, text: content.slice(left, right) });
    showEditorToast('Selected word');
  };

  const handleSelectCurrentLine = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    const pos = el.selectionStart;
    const lineStart = content.lastIndexOf('\n', pos - 1) + 1;
    const nextNewline = content.indexOf('\n', pos);
    const lineEnd = nextNewline === -1 ? content.length : nextNewline;
    el.setSelectionRange(lineStart, lineEnd);
    setSelectionRange({
      start: lineStart,
      end: lineEnd,
      text: content.slice(lineStart, lineEnd),
    });
    showEditorToast(`Selected Line ${activeLine}`);
  };

  const handleSelectAll = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(0, content.length);
    setSelectionRange({ start: 0, end: content.length, text: content });
    showEditorToast('Selected all code');
  };

  const handleCopySelection = () => {
    const el = textareaRef.current;
    let textToCopy = selectionRange.text;
    if (!textToCopy && el && el.selectionEnd > el.selectionStart) {
      textToCopy = content.slice(el.selectionStart, el.selectionEnd);
    }
    if (!textToCopy) {
      // Fallback: copy current line if nothing is highlighted
      const lineText = lines[activeLine - 1] || content;
      textToCopy = lineText;
    }
    setEditorClipboard(textToCopy);
    navigator.clipboard?.writeText(textToCopy).catch(() => {});
    showEditorToast(`Copied (${textToCopy.length} chars)`);
  };

  const handleCutSelection = () => {
    if (!activeFile) return;
    const el = textareaRef.current;
    if (!el) return;
    let start = el.selectionStart;
    let end = el.selectionEnd;
    if (start === end) {
      // Cut current line if no selection
      start = content.lastIndexOf('\n', start - 1) + 1;
      const nextNl = content.indexOf('\n', end);
      end = nextNl === -1 ? content.length : nextNl + 1;
    }
    const cutText = content.slice(start, end);
    setEditorClipboard(cutText);
    navigator.clipboard?.writeText(cutText).catch(() => {});
    const updated = content.slice(0, start) + content.slice(end);
    updateFileContent(activeFile.path, updated);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start, start);
      setSelectionRange({ start, end: start, text: '' });
    });
    showEditorToast('Cut to clipboard');
  };

  const handlePasteClipboard = async () => {
    if (!activeFile) return;
    let pasteText = editorClipboard;
    try {
      const sysText = await navigator.clipboard.readText();
      if (sysText) pasteText = sysText;
    } catch {
      // Use internal editorClipboard when browser iframe blocks clipboard read
    }
    if (!pasteText) {
      showEditorToast('Clipboard is empty — Copy or Cut code first');
      return;
    }
    insertAtCursor(pasteText);
    showEditorToast(`Pasted (${pasteText.length} chars)`);
  };

  const handleToggleComment = () => {
    if (!activeFile) return;
    const currentLn = lines[activeLine - 1] ?? '';
    const trimmed = currentLn.trim();
    const updatedLines = [...lines];
    if (trimmed.startsWith('//')) {
      updatedLines[activeLine - 1] = currentLn.replace(/\/\/\s?/, '');
    } else {
      updatedLines[activeLine - 1] = `// ${currentLn}`;
    }
    updateFileContent(activeFile.path, updatedLines.join('\n'));
  };

  const handleKeyAction = (keyItem: (typeof MOBILE_QUICK_KEYS)[number]) => {
    if (keyItem.insert) {
      insertAtCursor(keyItem.insert);
      return;
    }
    const el = textareaRef.current;
    if (keyItem.action === 'select_word') {
      handleSelectWord();
      return;
    }
    if (keyItem.action === 'copy') {
      handleCopySelection();
      return;
    }
    if (keyItem.action === 'cut') {
      handleCutSelection();
      return;
    }
    if (keyItem.action === 'paste') {
      handlePasteClipboard();
      return;
    }
    if (!el) return;
    const pos = el.selectionStart;
    if (keyItem.action === 'left') {
      el.focus();
      el.setSelectionRange(Math.max(0, pos - 1), Math.max(0, pos - 1));
      updateSelectionState();
    } else if (keyItem.action === 'right') {
      el.focus();
      el.setSelectionRange(Math.min(content.length, pos + 1), Math.min(content.length, pos + 1));
      updateSelectionState();
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
    showEditorToast('Code formatted');
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
          Select a source file (`MainActivity.kt`, `main.dart`, `App.tsx`, or `activity_main.xml`) from the Project Explorer to begin editing.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-[#0D131F] overflow-hidden">
      {/* Row 1: File Tabs & Build System Language Switcher (Kotlin / Java / React / Flutter) */}
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

        {/* Right Editor Controls: Build Target Selector (Kotlin / Java / React / Flutter) & Tools */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Build System & Language Selector directly inside Editor */}
          <div className="hidden sm:flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            {LANGUAGE_BUILD_OPTIONS.map((opt) => {
              const isActiveLang = activeProject.language === opt.lang;
              return (
                <button
                  key={opt.lang}
                  type="button"
                  onClick={() => setProjectBuildConfig(opt.lang, opt.build)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    isActiveLang
                      ? 'bg-emerald-600 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={`Switch Build System to ${opt.build}`}
                >
                  {opt.lang}
                </button>
              );
            })}
          </div>

          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            {(['code', 'design', 'split'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setXmlViewMode(activeFile.path, m)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-colors whitespace-nowrap cursor-pointer ${
                  xmlMode === m
                    ? 'bg-emerald-600 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m === 'code' && <Code2 className="w-3 h-3" />}
                {m === 'design' && <Smartphone className="w-3 h-3" />}
                {m === 'split' && <Columns className="w-3 h-3" />}
                <span>{m === 'design' ? 'Preview' : m}</span>
              </button>
            ))}
          </div>

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
        </div>
      </div>

      {/* Row 2: Dedicated Code Selection & Clipboard Bar (Select Word, Select Line, Select All, Copy, Cut, Paste, Comment) */}
      <div className="h-9 px-3 bg-[#101726] border-b border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono text-slate-400 mr-1 flex items-center gap-1">
            <MousePointerClick className="w-3.5 h-3.5 text-emerald-400" />
            {selectionRange.text.length > 0
              ? `Selected ${selectionRange.text.length} chars:`
              : 'Selection Actions:'}
          </span>

          <button
            type="button"
            onClick={handleSelectWord}
            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-200 whitespace-nowrap cursor-pointer"
          >
            Select Word
          </button>
          <button
            type="button"
            onClick={handleSelectCurrentLine}
            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-200 whitespace-nowrap cursor-pointer"
          >
            Select Line
          </button>
          <button
            type="button"
            onClick={handleSelectAll}
            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-200 whitespace-nowrap cursor-pointer"
          >
            Select All
          </button>

          <div className="h-3.5 w-px bg-slate-800 mx-1" />

          <button
            type="button"
            onClick={handleCopySelection}
            className="px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-[11px] text-emerald-300 font-medium flex items-center gap-1 whitespace-nowrap cursor-pointer"
          >
            <Copy className="w-3 h-3" />
            <span>Copy</span>
          </button>

          <button
            type="button"
            onClick={handleCutSelection}
            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-200 flex items-center gap-1 whitespace-nowrap cursor-pointer"
          >
            <Scissors className="w-3 h-3 text-amber-400" />
            <span>Cut</span>
          </button>

          <button
            type="button"
            onClick={handlePasteClipboard}
            className="px-2.5 py-1 rounded bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-[11px] text-sky-300 font-medium flex items-center gap-1 whitespace-nowrap cursor-pointer"
          >
            <ClipboardPaste className="w-3 h-3" />
            <span>Paste</span>
          </button>

          <button
            type="button"
            onClick={handleToggleComment}
            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-nowrap cursor-pointer"
          >
            // Comment
          </button>
        </div>

        {actionToast && (
          <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 shrink-0">
            <Check className="w-3.5 h-3.5" />
            <span>{actionToast}</span>
          </div>
        )}
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

      {/* Main Editor Body: Code, Full Preview, or Split */}
      <div className="flex-1 flex flex-col xl:flex-row min-h-0 overflow-hidden">
        {(xmlMode === 'code' || xmlMode === 'split') && (
          <div
            className={`flex-1 flex min-h-0 relative overflow-hidden ${
              xmlMode === 'split' ? 'border-b xl:border-b-0 xl:border-r border-slate-800' : ''
            }`}
          >
            {/* Line Numbers Gutter */}
            {settings.lineNumbers && (
              <div
                className="w-12 py-3 bg-[#0B0F17] border-r border-slate-800/70 select-none text-right pr-2.5 font-mono text-slate-500 shrink-0 overflow-hidden"
                style={{ fontSize: `${settings.fontSize}px`, lineHeight: '22px' }}
              >
                {lines.map((_, idx) => {
                  const lineNo = idx + 1;
                  return (
                    <div
                      key={lineNo}
                      className={`flex items-center justify-end gap-1 ${
                        activeLine === lineNo ? 'text-emerald-400 font-semibold' : ''
                      }`}
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
                onSelect={updateSelectionState}
                onClick={updateSelectionState}
                onKeyUp={updateSelectionState}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                className={`absolute inset-0 w-full h-full py-3 px-4 font-mono bg-transparent text-transparent caret-emerald-400 resize-none focus:outline-none overflow-auto selection:bg-emerald-500/35 ${
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

        {/* Large Interactive App / Website Preview Viewport */}
        {(xmlMode === 'design' || xmlMode === 'split') && (
          <div className="flex-1 min-h-0 overflow-hidden">
            <XmlLayoutDesigner
              filePath={activeFile.path}
              xmlContent={content}
              onChangeXml={(updated) => {
                const targetXmlPath = isXmlFile
                  ? activeFile.path
                  : activeProject.files.find((f) => f.name === 'activity_main.xml')?.path ||
                    activeFile.path;
                updateFileContent(targetXmlPath, updated);
              }}
            />
          </div>
        )}
      </div>

      {/* Mobile Developer Quick Symbol & Selection Touch Bar */}
      <div className="h-10 bg-[#0B0F17] border-t border-slate-800/80 px-2 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar shrink-0">
        <div className="flex items-center gap-1">
          {MOBILE_QUICK_KEYS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleKeyAction(item)}
              className={`min-w-[36px] h-7 px-2 rounded border font-mono text-xs flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                item.action === 'copy' || item.action === 'paste' || item.action === 'select_word'
                  ? 'bg-emerald-950/60 hover:bg-emerald-900/70 border-emerald-700/50 text-emerald-300 font-semibold'
                  : 'bg-slate-900 hover:bg-slate-800 active:bg-emerald-600 active:text-slate-950 border-slate-800 text-slate-200'
              }`}
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
          <span>Ln {activeLine}</span>
          <span>·</span>
          <span>{activeProject.language}</span>
          <span>·</span>
          <span>{activeProject.buildSystem}</span>
        </div>
      </div>
    </div>
  );
};
