import { describe, expect, it } from 'vitest';
import { PHONE_SIZE, phoneScale } from './PhonePreview';

describe('phoneScale', () => {
  it('shows the phone at its real size when there is room', () => {
    expect(phoneScale('portrait', { width: 1400, height: 900 })).toBe(1);
    expect(phoneScale('landscape', { width: 1400, height: 900 })).toBe(1);
  });

  it('shrinks an upright phone to fit a short window', () => {
    expect(phoneScale('portrait', { width: 1400, height: PHONE_SIZE.height / 2 })).toBe(0.5);
  });

  it('shrinks a sideways phone to fit a narrow window', () => {
    expect(phoneScale('landscape', { width: PHONE_SIZE.height / 2, height: 900 })).toBe(0.5);
  });

  it('never shrinks to nothing', () => {
    expect(phoneScale('portrait', { width: -50, height: 10 })).toBe(0.2);
  });
});
