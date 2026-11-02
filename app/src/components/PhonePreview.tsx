/**
 * Phone preview (decision #22): the play as a teammate sees it on a phone, without
 * leaving the computer. The app itself runs in a phone-sized frame, opened with the
 * play's link, so it lays itself out exactly as it would on a phone.
 */
import { useEffect, useRef, useState } from 'react';
import type { Play } from '../model/types';
import { linkFor } from '../model/share';
import { Icon } from './Icon';

/** A typical phone screen, in CSS pixels (an iPhone 15 or a Pixel 8 is about this size). */
export const PHONE_SIZE = { width: 390, height: 844 };

export type Orientation = 'portrait' | 'landscape';

/** How much to shrink the phone so it fits in the space available. Never enlarges it. */
export function phoneScale(orientation: Orientation, room: { width: number; height: number }): number {
  const w = orientation === 'portrait' ? PHONE_SIZE.width : PHONE_SIZE.height;
  const h = orientation === 'portrait' ? PHONE_SIZE.height : PHONE_SIZE.width;
  return Math.max(0.2, Math.min(1, room.width / w, room.height / h));
}

/** True inside the preview's own frame, so the preview doesn't offer a preview of itself. */
export const insideFrame = (): boolean => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

interface Props {
  play: Play;
  /** Set for playbook plays, whose links are short. */
  slug?: string;
  onClose: () => void;
}

// Room around the phone for the toolbar and some margin, in CSS pixels.
const CHROME = { width: 48, height: 120 };

export function PhonePreview({ play, slug, onClose }: Props) {
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [link, setLink] = useState('');
  const [room, setRoom] = useState(() => ({ width: window.innerWidth - CHROME.width, height: window.innerHeight - CHROME.height }));
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let live = true;
    linkFor(play, slug).then((l) => live && setLink(l));
    return () => {
      live = false;
    };
  }, [play, slug]);

  useEffect(() => {
    const onResize = () => setRoom({ width: window.innerWidth - CHROME.width, height: window.innerHeight - CHROME.height });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onKey, true);
    closeRef.current?.focus();
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [onClose]);

  const portrait = orientation === 'portrait';
  const width = portrait ? PHONE_SIZE.width : PHONE_SIZE.height;
  const height = portrait ? PHONE_SIZE.height : PHONE_SIZE.width;
  const scale = phoneScale(orientation, room);

  return (
    <div className="phone-preview" role="dialog" aria-modal="true" aria-label="Phone preview">
      <header className="phone-preview-bar">
        <div className="segmented" role="group" aria-label="Phone orientation">
          {(['portrait', 'landscape'] as const).map((o) => (
            <button key={o} type="button" className={orientation === o ? 'is-on' : ''} aria-pressed={orientation === o} onClick={() => setOrientation(o)}>
              {o === 'portrait' ? 'Upright' : 'Sideways'}
            </button>
          ))}
        </div>
        <p className="phone-preview-hint">What your team sees on a phone.</p>
        <button ref={closeRef} type="button" className="btn btn-quiet" onClick={onClose}>
          <Icon name="close" size={16} /> Close preview
        </button>
      </header>
      <div className="phone-preview-room">
        <div className="phone-shell" style={{ width: width * scale, height: height * scale }}>
          {link && (
            <iframe
              key={orientation}
              className="phone-screen"
              title="The play on a phone"
              src={link}
              width={width}
              height={height}
              style={{ transform: `scale(${scale})` }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
