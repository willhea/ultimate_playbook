import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Play } from '../model/types';
import type { Formation } from '../model/defaults';
import { exportPlay, fileNameFor, importPlay } from '../model/storage';
import { Icon } from './Icon';
import { detectDownloads, saveFile, type DownloadSupport } from '../hostDownloads';
import { linkFor } from '../model/share';
import type { PlaybookEntry } from '../plays';

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
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
  examples,
  onAddExample,
  onDuplicate,
  onDelete,
  onClose,
}: {
  plays: Play[];
  currentId: string;
  onOpen: (id: string) => void;
  onNew: (formation: Formation) => void;
  /** Titles of the built-in example plays; picking one adds a fresh copy. */
  examples: string[];
  onAddExample: (index: number) => void;
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
        <button type="button" className="btn btn-primary" onClick={() => onNew('vertical')} data-autofocus>
          New vertical stack
        </button>
        <button type="button" className="btn btn-primary" onClick={() => onNew('horizontal')}>
          New horizontal stack
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
      <h3 className="dialog-subhead">Playbook</h3>
      <p className="hint">The plays built into the app. Add a copy of one to change it without losing the original.</p>
      <ul className="example-list">
        {examples.map((title, i) => (
          <li key={title}>
            <span>{title}</span>
            <button type="button" className="btn btn-quiet" onClick={() => onAddExample(i)} aria-label={`Add a copy of ${title}`}>
              Add a copy
            </button>
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

const steps = (play: Play) => {
  const n = play.frames.length - 1;
  return `${n} ${n === 1 ? 'step' : 'steps'}`;
};

/** Picking a play to watch: the public playbook, then the plays saved in this browser. */
export function WatchPlaysDialog({
  entries,
  mine,
  onPlaybook,
  onMine,
  onNew,
  onClose,
}: {
  entries: PlaybookEntry[];
  mine: Play[];
  onPlaybook: (slug: string) => void;
  onMine: (id: string) => void;
  onNew: () => void;
  onClose: () => void;
}) {
  const sorted = [...mine].sort((a, b) => b.updatedAt - a.updatedAt);
  return (
    <Modal title="Plays" onClose={onClose}>
      <h3 className="dialog-subhead">Playbook</h3>
      <ul className="play-list">
        {entries.map((e) => (
          <li key={e.slug}>
            <button type="button" className="play-open" onClick={() => onPlaybook(e.slug)}>
              <span className="play-title">{e.play.title}</span>
              <span className="play-meta">{steps(e.play)}</span>
            </button>
          </li>
        ))}
      </ul>
      <h3 className="dialog-subhead">Your plays</h3>
      <p className="hint">Saved in this browser.</p>
      <ul className="play-list">
        {sorted.map((p) => (
          <li key={p.id}>
            <button type="button" className="play-open" onClick={() => onMine(p.id)}>
              <span className="play-title">{p.title || 'Untitled play'}</span>
              <span className="play-meta">{steps(p)}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="button-row">
        <button type="button" className="btn btn-quiet" onClick={onNew}>
          Make a new play
        </button>
      </div>
    </Modal>
  );
}

/** A link to a play, to send to the team. */
export function ShareDialog({ play, slug, onClose }: { play: Play; slug?: string; onClose: () => void }) {
  const [link, setLink] = useState('');
  const [status, setStatus] = useState('');
  const field = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let live = true;
    linkFor(play, slug).then((l) => live && setLink(l));
    return () => {
      live = false;
    };
  }, [play, slug]);

  const canShare = typeof navigator.share === 'function';
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setStatus('Link copied. Paste it into a message to your team.');
    } catch {
      field.current?.select();
      setStatus('Copying was blocked. The link is selected: copy it from the box.');
    }
  };
  const share = async () => {
    try {
      await navigator.share({ title: play.title, url: link });
    } catch {
      // Cancelled, or the browser refused; the link is still in the box.
    }
  };

  return (
    <Modal title="Share this play" onClose={onClose}>
      <p className="hint">
        {slug
          ? 'This play is in the public playbook, so its link is short and always shows the latest version.'
          : 'The whole play is inside this link, so nothing is uploaded. Anyone who opens it can watch the play and make their own copy.'}
      </p>
      <input ref={field} className="text-input code" readOnly value={link} aria-label="Link to this play" onFocus={(e) => e.target.select()} />
      <div className="button-row">
        {canShare && (
          <button type="button" className="btn btn-primary" onClick={share} data-autofocus>
            Share…
          </button>
        )}
        <button type="button" className={canShare ? 'btn btn-quiet' : 'btn btn-primary'} onClick={copy} {...(!canShare && { 'data-autofocus': true })}>
          Copy link
        </button>
      </div>
      <p className="status" role="status">
        {status}
      </p>
    </Modal>
  );
}
