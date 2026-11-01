import { useState } from 'react';
import type { Play, Team } from '../model/types';
import { staticFacing } from '../model/engine';
import {
  addPlayer,
  canAddPlayer,
  deleteStep,
  holdsDisc,
  moveStep,
  removePlayer,
  resetMove,
  setCurve,
  setFacing,
  setGuards,
  setHolder,
  setManual,
  setStack,
  stepLabel,
  teamPlayers,
  updateFrame,
} from '../model/edit';
import { dist } from '../model/geometry';
import { isManual } from '../model/defenders';
import { FacingDial } from './FacingDial';
import { Icon } from './Icon';

interface Props {
  play: Play;
  /** Frame being edited, or null while animating between steps. */
  editIndex: number | null;
  playingIndex: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onEdit: (play: Play) => void;
  onPreview: (play: Play) => void;
  onEndPreview: () => void;
  onGoToFrame: (i: number, inPlay?: Play) => void;
}

const TEAM_NAME: Record<Team, string> = { O: 'Offense', D: 'Defense' };

export function Inspector(props: Props) {
  const { play, editIndex, playingIndex, selectedId } = props;

  if (editIndex === null) {
    return (
      <aside className="inspector" aria-label="Step and player details">
        <section className="panel">
          <p className="eyebrow">Playing</p>
          <h2 className="panel-title">{stepLabel(play, playingIndex)}</h2>
          <p className="hint">Pause on a step to edit it. Press Space to pause, or click a step below.</p>
        </section>
      </aside>
    );
  }

  return (
    <aside className="inspector" aria-label="Step and player details">
      {selectedId ? <PlayerPanel {...props} editIndex={editIndex} selectedId={selectedId} /> : <Tips play={play} editIndex={editIndex} />}
      {editIndex === 0 && !selectedId && play.stack && <StackPanel {...props} />}
      <StepPanel {...props} editIndex={editIndex} />
      <TeamsPanel {...props} />
    </aside>
  );
}

function StepPanel({ play, editIndex, onEdit, onPreview, onEndPreview, onGoToFrame }: Props & { editIndex: number }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const f = play.frames[editIndex];
  const isSetup = editIndex === 0;
  const throwing = !isSetup && play.frames[editIndex - 1].discHolder !== f.discHolder;

  return (
    <section className="panel">
      <p className="eyebrow">{isSetup ? 'Starting positions' : `Step ${editIndex} of ${play.frames.length - 1}`}</p>
      <label className="field-label" htmlFor="step-name">
        Step name
      </label>
      <input
        id="step-name"
        className="text-input"
        value={f.name}
        placeholder={isSetup ? 'Setup' : `Step ${editIndex}`}
        onChange={(e) => onPreview(updateFrame(play, editIndex, { name: e.target.value }))}
        onBlur={onEndPreview}
      />

      {!isSetup && (
        <>
          <label className="field-label" htmlFor="step-duration">
            Length <output className="value">{f.duration.toFixed(1)} s</output>
          </label>
          <input
            id="step-duration"
            type="range"
            min={0.5}
            max={6}
            step={0.1}
            value={f.duration}
            onChange={(e) => onPreview(updateFrame(play, editIndex, { duration: Number(e.target.value) }))}
            onPointerUp={onEndPreview}
            onKeyUp={onEndPreview}
            onBlur={onEndPreview}
          />
        </>
      )}

      {throwing && (
        <>
          <label className="field-label" htmlFor="step-release">
            Throw released <output className="value">{Math.round(f.release * 100)}% into the step</output>
          </label>
          <input
            id="step-release"
            type="range"
            min={0}
            max={0.9}
            step={0.05}
            value={f.release}
            onChange={(e) => onPreview(updateFrame(play, editIndex, { release: Number(e.target.value) }))}
            onPointerUp={onEndPreview}
            onKeyUp={onEndPreview}
            onBlur={onEndPreview}
          />
        </>
      )}

      <label className="field-label" htmlFor="step-notes">
        Notes for the voiceover
      </label>
      <textarea
        id="step-notes"
        className="text-input notes"
        rows={3}
        value={f.notes}
        placeholder="What's happening, and what to look for."
        onChange={(e) => onPreview(updateFrame(play, editIndex, { notes: e.target.value }))}
        onBlur={onEndPreview}
      />

      {!isSetup && (
        <div className="button-row">
          <button type="button" className="btn btn-quiet" disabled={editIndex <= 1} onClick={() => {
              const next = moveStep(play, editIndex, -1);
              onEdit(next);
              onGoToFrame(editIndex - 1, next);
            }}>
            Move earlier
          </button>
          <button type="button" className="btn btn-quiet" disabled={editIndex >= play.frames.length - 1} onClick={() => {
              const next = moveStep(play, editIndex, 1);
              onEdit(next);
              onGoToFrame(editIndex + 1, next);
            }}>
            Move later
          </button>
          {confirmDelete ? (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                setConfirmDelete(false);
                const next = deleteStep(play, editIndex);
                onEdit(next);
                onGoToFrame(editIndex - 1, next);
              }}
              onBlur={() => setConfirmDelete(false)}
              autoFocus
            >
              Confirm delete
            </button>
          ) : (
            <button type="button" className="btn btn-quiet btn-danger-text" onClick={() => setConfirmDelete(true)}>
              Delete step
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function PlayerPanel({ play, editIndex, selectedId, onSelect, onEdit, onPreview, onEndPreview }: Props & { editIndex: number; selectedId: string }) {
  const player = play.players.find((p) => p.id === selectedId);
  if (!player) return null;
  const f = play.frames[editIndex];
  const manual = f.facing[player.id] !== undefined;
  const facing = staticFacing(play, editIndex, player.id);
  const prev = editIndex > 0 ? play.frames[editIndex - 1] : null;
  const moved = prev ? dist(prev.positions[player.id], f.positions[player.id]) > 0.05 : false;
  const curved = Boolean(f.curves[player.id]);
  const hasDisc = f.discHolder === player.id;
  const guarded = play.players.find((p) => p.id === player.guards);
  // Defenders who guard someone follow them in each step unless placed by hand.
  const followable = Boolean(guarded) && editIndex > 0;
  const byHand = isManual(f, player.id);
  const following = followable && !byHand;
  const color = player.team === 'O' ? 'var(--offense)' : 'var(--defense)';

  return (
    <section className="panel">
      <div className="player-heading">
        <span className={`badge badge-${player.team}`}>{player.number}</span>
        <div>
          <p className="eyebrow">{TEAM_NAME[player.team]}</p>
          <h2 className="panel-title">
            {player.team === 'O' ? 'Offense' : 'Defender'} {player.number}
            {hasDisc && <span className="chip">Has the disc</span>}
          </h2>
        </div>
        <button type="button" className="icon-btn" aria-label="Deselect player" onClick={() => onSelect(null)}>
          <Icon name="close" size={16} />
        </button>
      </div>

      <div className="facing-row">
        <FacingDial
          angle={facing}
          manual={manual}
          color={color}
          onChange={(a) => onPreview(setFacing(play, editIndex, player.id, a))}
          onCommit={onEndPreview}
        />
        <div className="facing-text">
          <p className="field-label">Facing</p>
          <div className="segmented" role="group" aria-label="Facing mode">
            <button type="button" className={!manual ? 'is-on' : ''} aria-pressed={!manual} onClick={() => onEdit(setFacing(play, editIndex, player.id, null))}>
              Automatic
            </button>
            <button type="button" className={manual ? 'is-on' : ''} aria-pressed={manual} onClick={() => onEdit(setFacing(play, editIndex, player.id, facing))}>
              By hand
            </button>
          </div>
          <p className="hint">
            {manual
              ? 'Holds this direction at the end of the step. Drag the dial to change it.'
              : player.team === 'D'
                ? 'Faces the player they guard, and turns to run.'
                : 'Faces the disc, and turns to run.'}
          </p>
        </div>
      </div>

      {player.team === 'D' && (
        <>
          <label className="field-label" htmlFor="guards">
            Guarding
          </label>
          <select
            id="guards"
            className="text-input"
            value={player.guards ?? ''}
            onChange={(e) => onEdit(setGuards(play, player.id, e.target.value || null))}
          >
            <option value="">Nobody (zone, poach)</option>
            {teamPlayers(play, 'O').map((o) => (
              <option key={o.id} value={o.id}>
                Offense {o.number}
              </option>
            ))}
          </select>
        </>
      )}

      {followable && guarded && (
        <>
          <p className="field-label">Position</p>
          <div className="segmented" role="group" aria-label="Position mode">
            <button type="button" className={following ? 'is-on' : ''} aria-pressed={following} onClick={() => onEdit(setManual(play, editIndex, player.id, false))}>
              Automatic
            </button>
            <button type="button" className={byHand ? 'is-on' : ''} aria-pressed={byHand} onClick={() => onEdit(setManual(play, editIndex, player.id, true))}>
              By hand
            </button>
          </div>
          <p className="hint">
            {byHand
              ? 'Stays where you put them in this step.'
              : `Follows Offense ${guarded.number}: trails them when they run and marks them when they catch the disc. Drag to place them yourself.`}
          </p>
        </>
      )}

      <div className="button-row">
        {player.team === 'O' && !hasDisc && (
          <button type="button" className="btn btn-primary" onClick={() => onEdit(setHolder(play, editIndex, player.id))}>
            {editIndex === 0 ? 'Give them the disc' : 'Throw to them in this step'}
          </button>
        )}
        {moved && !following && (
          <button type="button" className="btn btn-quiet" onClick={() => onEdit(resetMove(play, editIndex, player.id))}>
            Undo their run
          </button>
        )}
        {curved && !following && (
          <button type="button" className="btn btn-quiet" onClick={() => onEdit(setCurve(play, editIndex, player.id, null))}>
            Straighten run
          </button>
        )}
        <button
          type="button"
          className="btn btn-quiet btn-danger-text"
          disabled={holdsDisc(play, player.id)}
          title={holdsDisc(play, player.id) ? 'This player has the disc in at least one step.' : undefined}
          onClick={() => {
            onSelect(null);
            onEdit(removePlayer(play, player.id));
          }}
        >
          Remove player
        </button>
      </div>
    </section>
  );
}

function TeamsPanel({ play, onEdit }: Props) {
  return (
    <section className="panel">
      <p className="eyebrow">Players</p>
      {(['O', 'D'] as const).map((team) => {
        const list = teamPlayers(play, team);
        const removable = [...list].reverse().find((p) => !holdsDisc(play, p.id));
        return (
          <div className="team-row" key={team}>
            <span className={`swatch swatch-${team}`} aria-hidden="true" />
            <span className="team-name">{TEAM_NAME[team]}</span>
            <span className="team-count">{list.length}</span>
            <button
              type="button"
              className="icon-btn"
              aria-label={`Remove a ${TEAM_NAME[team].toLowerCase()} player`}
              disabled={!removable}
              onClick={() => removable && onEdit(removePlayer(play, removable.id))}
            >
              <Icon name="minus" size={16} />
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label={`Add a ${TEAM_NAME[team].toLowerCase()} player`}
              disabled={!canAddPlayer(play, team)}
              onClick={() => onEdit(addPlayer(play, team))}
            >
              <Icon name="plus" size={16} />
            </button>
          </div>
        );
      })}
    </section>
  );
}

/** Spacing of the starting stack, adjustable from the setup. */
function StackPanel({ play, onPreview, onEndPreview }: Props) {
  const stack = play.stack!;
  const slider = (id: string, label: string, value: number, min: number, max: number, step: number, change: (v: number) => void) => (
    <>
      <label className="field-label" htmlFor={id}>
        {label} <output className="value">{value} yd</output>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => change(Number(e.target.value))}
        onPointerUp={onEndPreview}
        onKeyUp={onEndPreview}
        onBlur={onEndPreview}
      />
    </>
  );
  return (
    <section className="panel">
      <p className="eyebrow">{stack.kind === 'vertical' ? 'Vertical stack' : 'Horizontal stack'}</p>
      {slider('stack-depth', stack.kind === 'vertical' ? 'Thrower to the front of the stack' : 'Thrower to the cutters', stack.depth, 8, 25, 1, (depth) =>
        onPreview(setStack(play, { ...stack, depth })),
      )}
      {stack.kind === 'vertical' &&
        slider('stack-spacing', 'Space between cutters', stack.spacing, 4, 8, 0.5, (spacing) => onPreview(setStack(play, { ...stack, spacing })))}
      <p className="hint">Lines the cutters and their defenders up again from the thrower. Runs in later steps still end where they did.</p>
    </section>
  );
}

function Tips({ play, editIndex }: { play: Play; editIndex: number }) {
  const isSetup = editIndex === 0;
  return (
    <section className="panel tips">
      <p className="eyebrow">How to</p>
      {isSetup ? (
        <ul>
          <li>Drag players to set where everyone starts.</li>
          <li>Drag the disc onto a teammate to give it to them.</li>
          <li>Click a player to set facing or who they guard.</li>
          <li>
            Then press <strong>Add step</strong> and drag players to where they run.
          </li>
        </ul>
      ) : (
        <ul>
          <li>Drag players to where they are at the end of {stepLabel(play, editIndex).toLowerCase() === `step ${editIndex}` ? 'this step' : `“${stepLabel(play, editIndex)}”`}.</li>
          <li>Drag the dot in the middle of a run to bend it. Double-click it to straighten.</li>
          <li>Drag the disc onto a teammate to throw it during this step.</li>
          <li>Defenders follow the player they guard. Drag one to place them yourself.</li>
          <li>
            Press <kbd>→</kbd> to watch the next step, or <kbd>Space</kbd> to play.
          </li>
        </ul>
      )}
    </section>
  );
}
