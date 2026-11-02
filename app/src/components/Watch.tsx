/**
 * Watching a play, made for phones (decision #18): the field as big as the screen
 * allows, thumb-sized controls, and the step's notes underneath. Share links and
 * the playbook open here; the editor is a tap away for your own plays.
 */
import type { Play } from '../model/types';
import type { Playback } from '../state/usePlayback';
import { evaluate } from '../model/engine';
import { stepLabel } from '../model/edit';
import { fitView } from '../model/view';
import { Field } from './Field';
import { Icon } from './Icon';

interface Props {
  play: Play;
  playback: Playback;
  /** Watching a play that isn't saved in this browser: from a share link or the playbook. */
  guest: boolean;
  /** A message to show above the field, e.g. that a link was broken or a copy was saved. */
  notice?: string;
  onPlays: () => void;
  onShare: () => void;
  /** Save a guest play to this browser's plays. */
  onCopy: () => void;
  /** Open your own play in the editor. */
  onEdit: () => void;
}

export function Watch({ play, playback, guest, notice, onPlays, onShare, onCopy, onEdit }: Props) {
  const view = evaluate(play, playback.time);
  const active = playback.frame ?? view.index;
  const frame = play.frames[active];
  const steps = play.frames.length - 1;

  return (
    <div className="watch">
      <header className="watch-bar">
        <button type="button" className="btn btn-quiet" onClick={onPlays}>
          <Icon name="list" size={16} /> Plays
        </button>
        <h1 className="watch-title" title={play.title}>
          {play.title || 'Untitled play'}
        </h1>
        <button type="button" className="btn btn-quiet" onClick={onShare}>
          <Icon name="share" size={16} /> Share
        </button>
      </header>

      {notice && (
        <p className="watch-notice" role="status">
          {notice}
        </p>
      )}

      <section className="watch-stage" aria-label="Field">
        <Field
          play={play}
          view={view}
          viewBox={fitView(play)}
          editIndex={null}
          selectedId={null}
          showRoutes
          showForce
          time={playback.time}
          className="field-watch"
        />
      </section>

      <section className="watch-step" aria-live="polite">
        <p className="eyebrow">{active === 0 ? 'Setup' : `Step ${active} of ${steps}`}</p>
        <h2 className="watch-step-name">{stepLabel(play, active)}</h2>
        {frame.notes && <p className="watch-notes">{frame.notes}</p>}
      </section>

      <nav className="watch-controls" aria-label="Playback">
        <button type="button" className="round-btn" aria-label="Back a step" onClick={playback.stepBack} disabled={playback.time <= 0}>
          <Icon name="stepBack" size={22} />
        </button>
        <button
          type="button"
          className="round-btn round-btn-big"
          aria-label={playback.playing ? 'Pause' : 'Play'}
          onClick={playback.toggle}
          disabled={steps === 0}
        >
          <Icon name={playback.playing ? 'pause' : 'play'} size={30} />
        </button>
        <button type="button" className="round-btn" aria-label="Next step" onClick={playback.stepForward} disabled={playback.frame === steps}>
          <Icon name="stepForward" size={22} />
        </button>
      </nav>

      <ol className="watch-dots" aria-label="Steps">
        {play.frames.map((f, i) => (
          <li key={f.id}>
            <button
              type="button"
              className={`watch-dot ${i === active ? 'is-active' : ''}`}
              aria-label={i === 0 ? 'Setup' : `Step ${i}: ${stepLabel(play, i)}`}
              aria-current={i === active ? 'step' : undefined}
              onClick={() => playback.goToFrame(i)}
            />
          </li>
        ))}
      </ol>

      <footer className="watch-foot">
        {guest ? (
          <button type="button" className="btn btn-primary" onClick={onCopy}>
            Make my own copy
          </button>
        ) : (
          <button type="button" className="btn btn-quiet" onClick={onEdit}>
            Edit this play
          </button>
        )}
        <p className="watch-rotate-hint">Turn your phone sideways for a bigger field.</p>
      </footer>
    </div>
  );
}
