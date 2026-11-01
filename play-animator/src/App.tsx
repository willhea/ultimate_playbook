import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { Play } from './model/types';
import { evaluate, staticFacing } from './model/engine';
import { addStep, setFacing } from './model/edit';
import { saveCurrentId, savePlays } from './model/storage';
import { FULL_VIEW, type ViewBox } from './model/field';
import { fitView } from './model/view';
import { currentPlay, initLibrary, libraryReducer } from './state/library';
import { usePlayback } from './state/usePlayback';
import { Field } from './components/Field';
import { Inspector } from './components/Inspector';
import { Timeline } from './components/Timeline';
import { ExportDialog, ImportDialog, PlaysDialog, ShortcutsDialog } from './components/Dialogs';
import { Icon } from './components/Icon';

type DialogName = 'plays' | 'export' | 'import' | 'shortcuts' | null;

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
  return target instanceof HTMLInputElement && !['range', 'checkbox', 'button'].includes(target.type);
}

export function App() {
  const [library, dispatch] = useReducer(libraryReducer, undefined, initLibrary);
  const play = currentPlay(library);
  const playback = usePlayback(play);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showRoutes, setShowRoutes] = useState(true);
  const [closeUp, setCloseUp] = useState(true);
  const [presenting, setPresenting] = useState(false);
  const [dialog, setDialog] = useState<DialogName>(null);

  const view = evaluate(play, playback.time);
  // Frame the close-up from the play as it was before a drag, so the view doesn't move under the pointer.
  const viewBox = closeUp ? fitView(library.dragBase ?? play) : FULL_VIEW;
  const editIndex = playback.frame;
  const activeIndex = editIndex ?? view.index;

  // Save to the browser shortly after each change.
  useEffect(() => {
    const t = setTimeout(() => savePlays(library.plays), 300);
    return () => clearTimeout(t);
  }, [library.plays]);
  useEffect(() => saveCurrentId(library.currentId), [library.currentId]);

  const edit = useCallback((p: Play) => dispatch({ type: 'edit', play: p }), []);
  const preview = useCallback((p: Play) => dispatch({ type: 'preview', play: p }), []);
  const endPreview = useCallback(() => dispatch({ type: 'endPreview' }), []);
  const exitPresenting = useCallback(() => setPresenting(false), []);

  const addStepHere = () => {
    const after = editIndex ?? view.index;
    const next = addStep(play, after);
    edit(next);
    playback.goToFrame(after + 1, next);
  };

  const openPlay = (id: string) => {
    dispatch({ type: 'open', id });
    setSelectedId(null);
    playback.goToFrame(0);
    setDialog(null);
  };

  // Keyboard shortcuts. The listener is added once and calls the latest handler through a ref.
  const keys = useRef<(e: KeyboardEvent) => void>(() => {});
  const onKey = (e: KeyboardEvent) => {
    if (dialog || isTyping(e.target)) return;
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'z') {
      dispatch({ type: e.shiftKey ? 'redo' : 'undo' });
    } else if (mod && e.key.toLowerCase() === 'y') {
      dispatch({ type: 'redo' });
    } else if (mod || e.altKey) {
      return;
    } else if (e.key === ' ') {
      playback.toggle();
    } else if (e.key === 'ArrowRight') {
      playback.stepForward();
    } else if (e.key === 'ArrowLeft') {
      playback.stepBack();
    } else if (e.key === 'Home') {
      playback.goToFrame(0);
    } else if (e.key === 'Escape') {
      if (presenting) setPresenting(false);
      else setSelectedId(null);
    } else if (/^Digit[1-7]$/.test(e.code)) {
      const id = `${e.shiftKey ? 'D' : 'O'}${e.code.slice(5)}`;
      if (play.players.some((p) => p.id === id)) setSelectedId(id);
    } else if ((e.key === 'q' || e.key === 'e') && selectedId && editIndex !== null) {
      const turn = e.key === 'q' ? -15 : 15;
      edit(setFacing(play, editIndex, selectedId, (staticFacing(play, editIndex, selectedId) + turn + 360) % 360));
    } else if (e.key === 'a' && selectedId && editIndex !== null) {
      edit(setFacing(play, editIndex, selectedId, null));
    } else if (e.key === 'n') {
      addStepHere();
    } else if (e.key === 'p') {
      setPresenting(true);
    } else if (e.key === '?') {
      setDialog('shortcuts');
    } else {
      return;
    }
    e.preventDefault();
  };
  useEffect(() => {
    keys.current = onKey;
  });
  useEffect(() => {
    const handler = (e: KeyboardEvent) => keys.current(e);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const steps = play.frames.length - 1;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="26" height="26">
            <circle cx="12" cy="12" r="10" className="brand-disc" />
            <circle cx="12" cy="12" r="5.5" className="brand-ring" />
          </svg>
        </div>
        <div className="title-block">
          <label htmlFor="play-title" className="eyebrow">
            Ultimate Play Animator
          </label>
          <input
            id="play-title"
            className="title-input"
            value={play.title}
            placeholder="Untitled play"
            onChange={(e) => preview({ ...play, title: e.target.value })}
            onBlur={endPreview}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          />
        </div>
        <nav className="toolbar" aria-label="Play actions">
          <button type="button" className="btn btn-quiet" onClick={() => setDialog('plays')}>
            <Icon name="list" size={16} /> Plays
          </button>
          <span className="divider" aria-hidden="true" />
          <button type="button" className="icon-btn" aria-label="Undo" title="Undo (⌘/Ctrl+Z)" disabled={library.past.length === 0 && !library.dragBase} onClick={() => dispatch({ type: 'undo' })}>
            <Icon name="undo" />
          </button>
          <button type="button" className="icon-btn" aria-label="Redo" title="Redo (⌘/Ctrl+Shift+Z)" disabled={library.future.length === 0} onClick={() => dispatch({ type: 'redo' })}>
            <Icon name="redo" />
          </button>
          <span className="divider" aria-hidden="true" />
          <button type="button" className="btn btn-quiet" onClick={() => setDialog('import')}>
            Import
          </button>
          <button type="button" className="btn btn-quiet" onClick={() => setDialog('export')}>
            Export
          </button>
          <button type="button" className="icon-btn" aria-label="Keyboard shortcuts" title="Keyboard shortcuts (?)" onClick={() => setDialog('shortcuts')}>
            <Icon name="keyboard" />
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setPresenting(true)} title="Clean full-screen view for recording (P)">
            <Icon name="present" size={16} /> Present
          </button>
        </nav>
      </header>

      <main className="workspace">
        <section className="stage" aria-label="Field">
          <Field
            play={play}
            view={view}
            editIndex={editIndex}
            selectedId={selectedId}
            showRoutes={showRoutes}
            viewBox={viewBox}
            time={playback.time}
            onSelect={setSelectedId}
            onPreview={preview}
            onEndPreview={endPreview}
            onEdit={edit}
            onNeedFrame={() => playback.goToFrame(view.index)}
          />
          {steps === 0 && editIndex === 0 && (
            <p className="stage-callout">
              Set up your starting positions, then press <strong>Add step</strong> to make players run.
            </p>
          )}
        </section>
        <Inspector
          play={play}
          editIndex={editIndex}
          playingIndex={view.index}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onEdit={edit}
          onPreview={preview}
          onEndPreview={endPreview}
          onGoToFrame={playback.goToFrame}
        />
      </main>

      <Timeline
        play={play}
        playback={playback}
        activeIndex={activeIndex}
        showRoutes={showRoutes}
        onShowRoutes={setShowRoutes}
        closeUp={closeUp}
        onCloseUp={setCloseUp}
        onAddStep={addStepHere}
      />

      {presenting && <Presenter play={play} view={view} viewBox={viewBox} showRoutes={showRoutes} playing={playback.playing} onExit={exitPresenting} />}

      {dialog === 'plays' && (
        <PlaysDialog
          plays={library.plays}
          currentId={library.currentId}
          onOpen={openPlay}
          onNew={() => {
            dispatch({ type: 'create' });
            setSelectedId(null);
            playback.goToFrame(0);
            setDialog(null);
          }}
          onDuplicate={() => {
            dispatch({ type: 'duplicate' });
            setDialog(null);
          }}
          onDelete={(id) => dispatch({ type: 'delete', id })}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === 'export' && <ExportDialog play={play} onClose={() => setDialog(null)} />}
      {dialog === 'import' && (
        <ImportDialog
          onImport={(p) => {
            dispatch({ type: 'create', play: p });
            setSelectedId(null);
            playback.goToFrame(0);
            setDialog(null);
          }}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === 'shortcuts' && <ShortcutsDialog onClose={() => setDialog(null)} />}
    </div>
  );
}

/** Clean view for recording: just the field. Keyboard controls keep working. */
function Presenter({
  play,
  view,
  viewBox,
  showRoutes,
  playing,
  onExit,
}: {
  play: Play;
  view: ReturnType<typeof evaluate>;
  viewBox: ViewBox;
  showRoutes: boolean;
  playing: boolean;
  onExit: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hintVisible, setHintVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    el?.requestFullscreen?.().catch(() => {});
    const t = setTimeout(() => setHintVisible(false), 3500);
    const onFs = () => {
      if (!document.fullscreenElement) onExit();
    };
    document.addEventListener('fullscreenchange', onFs);
    return () => {
      clearTimeout(t);
      document.removeEventListener('fullscreenchange', onFs);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [onExit]);

  return (
    <div className="presenter" ref={ref} onPointerMove={() => setHintVisible(true)}>
      <Field play={play} view={view} viewBox={viewBox} editIndex={null} selectedId={null} showRoutes={showRoutes} className="field-present" />
      <div className={`presenter-hint ${hintVisible && !playing ? 'is-visible' : ''}`}>
        <span>
          <kbd>Space</kbd> play / pause · <kbd>→</kbd> next step · <kbd>←</kbd> back · <kbd>Esc</kbd> exit
        </span>
        <button type="button" className="btn btn-quiet" onClick={onExit}>
          Exit
        </button>
      </div>
    </div>
  );
}
