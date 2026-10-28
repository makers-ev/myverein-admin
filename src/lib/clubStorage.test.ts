import { describe, expect, it } from 'vitest';

import { MAX_QUOTA_BYTES, formatBytes, parseQuota, usageTone } from './clubStorage';

describe('parseQuota', () => {
    it('converts MB and GB and accepts a decimal comma', () => {
        expect(parseQuota('500', 'MB')).toBe(500 * 1024 ** 2);
        expect(parseQuota('2,5', 'GB')).toBe(Math.round(2.5 * 1024 ** 3));
    });
    it('refuses empty, zero, negative, non-numeric and too large values', () => {
        for (const bad of ['', '0', '-1', 'abc']) expect(parseQuota(bad, 'GB'), bad).toBeNull();
        expect(parseQuota('2000', 'GB')).toBeNull();
        expect(parseQuota('1024', 'GB')).toBe(MAX_QUOTA_BYTES);
    });
});

describe('formatBytes and usageTone', () => {
    it('scales units', () => {
        expect(formatBytes(0)).toBe('0 B');
        expect(formatBytes(1024 ** 3)).toBe('1,0 GB');
        expect(formatBytes(-5)).toBe('–');
    });
    it('marks 80 % and over quota', () => {
        expect(usageTone({ percent: 10, overQuota: false })).toBe('ok');
        expect(usageTone({ percent: 85, overQuota: false })).toBe('warn');
        expect(usageTone({ percent: 120, overQuota: true })).toBe('over');
    });
});
