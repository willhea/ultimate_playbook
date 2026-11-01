import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Play } from '../model/types';
import { exportPlay, fileNameFor, importPlay } from '../model/storage';
import { Icon } from './Icon';
import { detectDownloads, saveFile, type DownloadSupport } from '../hostDownloads';

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    // Focus the dialog's main action if it has one, otherwise its first control.
    const root = ref.current;
    (root?.querySelector<HTMLElement>('[data-autofocus]') ?? root?.querySelector<HTMLElement>('button, input, textarea'))?.focus();
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <header className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <Icon name="close" />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

const dateFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export function PlaysDialog({
  plays,
  currentId,
  onOpen,
  onNew,
  onDuplicate,
  onDelete,
  onClose,
}: {
  plays: Play[];
  currentId: string;
  onOpen: (id: string) => void;
  onNew: () => void;
  onDuplicate: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const sorted = [...plays].sort((a, b) => b.updatedAt - a.updatedAt);
  return (
    <Modal title="Your plays" onClose={onClose}>
      <p className="hint">Plays are saved in this browser automatically. Use Export to keep a copy or move a play to another computer.</p>
      <div className="button-row">
        <button type="button" className="btn btn-primary" onClick={onNew} data-autofocus>
          New play
        </button>
        <button type="button" className="btn btn-quiet" onClick={onDuplicate}>
          Duplicate this play
        </button>
      </div>
      <ul className="play-list">
        {sorted.map((p) => (
          <li key={p.id} className={p.id === currentId ? 'is-current' : ''}>
            <button type="button" className="play-open" onClick={() => onOpen(p.id)}>
              <span className="play-title">{p.title || 'Untitled play'}</span>
              <span className="play-meta">
                {p.frames.length - 1} {p.frames.length - 1 === 1 ? 'step' : 'steps'} · edited {dateFormat.format(p.updatedAt)}
                {p.id === currentId && ' · open now'}
              </span>
            </button>
            {confirming === p.id ? (
              <button type="button" className="btn btn-danger" onClick={() => { setConfirming(null); onDelete(p.id); }} onBlur={() => setConfirming(null)} autoFocus>
                Confirm delete
              </button>
            ) : (
              <button type="button" className="btn btn-quiet btn-danger-text" onClick={() => setConfirming(p.id)}>
                Delete
              </button>
            )}
          </li>
        ))}
      </ul>
    </Modal>
  );
}

export function ExportDialog({ play, onClose }: { play: Play; onClose: () => void }) {
  const text = exportPlay(play);
  const area = useRef<HTMLTextAreaElement>(null);
  const [status, setStatus] = useState('');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus('Copied. Paste it into a text file to keep it.');
    } catch {
      area.current?.select();
      setStatus('Copying was blocked. The text is selected: press Ctrl+C (or ⌘C) to copy it.');
    }
  };

  const [support, setSupport] = useState<DownloadSupport | null>(null);
  useEffect(() => {
    let live = true;
    detectDownloads().then((d) => live && setSupport(d));
    return () => {
      live = false;
    };
  }, []);

  const download = async () => {
    if (!support) return;
    const ok = await saveFile(support, fileNameFor(play), text);
    setStatus(ok ? `Saved as ${fileNameFor(play)}.` : 'The download was cancelled.');
  };

  return (
    <Modal title="Export play" onClose={onClose}>
      <p className="hint">This text is the whole play. Save it to back up the play, or import it in another browser.</p>
      <textarea ref={area} className="text-input code" readOnly value={text} rows={10} aria-label="Play file contents" />
      <div className="button-row">
        <button type="button" className="btn btn-primary" onClick={copy} data-autofocus>
          Copy to clipboard
        </button>
        {support && support.kind !== 'none' && (
          <button type="button" className="btn btn-quiet" onClick={download}>
            Download file
          </button>
        )}
      </div>
      <p className="status" role="status">
        {status}
      </p>
    </Modal>
  );
}

export function ImportDialog({ onImport, onClose }: { onImport: (play: Play) => void; onClose: () => void }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const tryImport = (raw: string) => {
    try {
      onImport(importPlay(raw));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That file could not be read.');
    }
  };

  return (
    <Modal title="Import a play" onClose={onClose}>
      <p className="hint">Choose a play file, or paste the text you copied from Export. It opens as a new play; nothing is overwritten.</p>
      <label className="field-label" htmlFor="import-file">
        Play file
      </label>
      <input
        id="import-file"
        type="file"
        accept=".json,application/json"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) tryImport(await file.text());
        }}
      />
      <label className="field-label" htmlFor="import-text">
        Or paste it here
      </label>
      <textarea id="import-text" className="text-input code" rows={8} value={text} onChange={(e) => { setText(e.target.value); setError(''); }} />
      <div className="button-row">
        <button type="button" className="btn btn-primary" disabled={!text.trim()} onClick={() => tryImport(text)}>
          Import
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </Modal>
  );
}

const SHORTCUTS: [string, string][] = [
  ['Space', 'Play / pause'],
  ['→', 'Play the next step, then stop'],
  ['←', 'Back one step'],
  ['Home', 'Back to the start'],
  ['1 – 7', 'Select offense player'],
  ['Shift + 1 – 7', 'Select defender'],
  ['Q / E', 'Turn the selected player left / right'],
  ['A', 'Selected player faces automatically'],
  ['N', 'Add a step after this one'],
  ['P', 'Present (clean full-screen view)'],
  ['Esc', 'Deselect, or leave Present'],
  ['⌘/Ctrl + Z', 'Undo'],
  ['⌘/Ctrl + Shift + Z', 'Redo'],
];

export function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Keyboard shortcuts" onClose={onClose}>
      <dl className="shortcuts">
        {SHORTCUTS.map(([k, v]) => (
          <div key={k}>
            <dt>
              <kbd>{k}</kbd>
            </dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}
