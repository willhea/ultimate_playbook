import type { Play } from '../model/types';
import type { Playback } from '../state/usePlayback';
import { frameTimes, totalDuration } from '../model/engine';
import { stepLabel } from '../model/edit';
import { Icon } from './Icon';

interface Props {
  play: Play;
  playback: Playback;
  /** The step currently shown (being edited or animated into). */
  activeIndex: number;
  showRoutes: boolean;
  onShowRoutes: (on: boolean) => void;
  closeUp: boolean;
  onCloseUp: (on: boolean) => void;
  onAddStep: () => void;
}

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.5, 2];

export function Timeline({ play, playback, activeIndex, showRoutes, onShowRoutes, closeUp, onCloseUp, onAddStep }: Props) {
  const times = frameTimes(play);
  const total = totalDuration(play);

  return (
    <footer className="timeline">
      <ol className="steps" aria-label="Steps">
        {play.frames.map((f, i) => (
          <li key={f.id}>
            <button
              type="button"
              className={`step-chip ${i === activeIndex ? 'is-active' : ''} ${playback.frame === i ? 'is-paused-here' : ''}`}
              aria-current={i === activeIndex ? 'step' : undefined}
              onClick={() => playback.goToFrame(i)}
            >
              <span className="step-num">{i === 0 ? '0' : i}</span>
              <span className="step-name">{stepLabel(play, i)}</span>
            </button>
          </li>
        ))}
        <li>
          <button type="button" className="step-chip step-add" onClick={onAddStep}>
            <Icon name="plus" size={16} /> Add step
          </button>
        </li>
      </ol>

      <div className="transport">
        <div className="transport-buttons">
          <button type="button" className="icon-btn" aria-label="Back to the start" title="Back to the start (Home)" onClick={() => playback.goToFrame(0)}>
            <Icon name="restart" />
          </button>
          <button type="button" className="icon-btn" aria-label="Previous step" title="Previous step (←)" onClick={playback.stepBack}>
            <Icon name="stepBack" />
          </button>
          <button
            type="button"
            className="icon-btn play-btn"
            aria-label={playback.playing ? 'Pause' : 'Play'}
            title={playback.playing ? 'Pause (Space)' : 'Play (Space)'}
            onClick={playback.toggle}
            disabled={total === 0}
          >
            <Icon name={playback.playing ? 'pause' : 'play'} size={22} />
          </button>
          <button type="button" className="icon-btn" aria-label="Play the next step" title="Play the next step (→)" onClick={playback.stepForward}>
            <Icon name="stepForward" />
          </button>
        </div>

        <div className="scrubber">
          <input
            type="range"
            id="scrubber"
            aria-label="Position in the play"
            min={0}
            max={Math.max(total, 0.01)}
            step={0.01}
            value={playback.time}
            onChange={(e) => playback.seek(Number(e.target.value))}
            disabled={total === 0}
          />
          <div className="ticks" aria-hidden="true">
            {total > 0 && times.map((t, i) => <span key={i} style={{ left: `${(t / total) * 100}%` }} />)}
          </div>
        </div>
        <output className="clock" htmlFor="scrubber">
          {playback.time.toFixed(1)} / {total.toFixed(1)} s
        </output>

        <div className="segmented" role="group" aria-label="View">
          <button type="button" className={closeUp ? 'is-on' : ''} aria-pressed={closeUp} onClick={() => onCloseUp(true)}>
            Close-up
          </button>
          <button type="button" className={!closeUp ? 'is-on' : ''} aria-pressed={!closeUp} onClick={() => onCloseUp(false)}>
            Whole field
          </button>
        </div>
        <label className="inline-control">
          <span>Speed</span>
          <select id="speed" value={playback.speed} onChange={(e) => playback.setSpeed(Number(e.target.value))}>
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}×
              </option>
            ))}
          </select>
        </label>
        <label className="inline-control">
          <input id="loop" type="checkbox" checked={playback.loop} onChange={(e) => playback.setLoop(e.target.checked)} />
          <span>Loop</span>
        </label>
        <label className="inline-control">
          <input id="routes" type="checkbox" checked={showRoutes} onChange={(e) => onShowRoutes(e.target.checked)} />
          <span>Show runs while playing</span>
        </label>
      </div>
    </footer>
  );
}
