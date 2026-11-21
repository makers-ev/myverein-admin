import { describe, expect, it } from 'vitest';

import { clubErrorText, clubsHref, isStateConflict, parsePlanForm, planExpired, validateReason } from './adminClubs';

describe('validateReason', () => {
    it('requires a trimmed reason of at least 10 characters', () => {
        expect(validateReason('   kurz  ')).not.toBeNull();
        expect(validateReason('Missbrauch gemeldet')).toBeNull();
        expect(validateReason('x'.repeat(1001))).not.toBeNull();
    });
});

const form = (o: Partial<Record<'tier' | 'validFrom' | 'validUntil' | 'memberLimit' | 'note', string>> = {}) => ({ tier: 'standard', validFrom: '', validUntil: '', memberLimit: '', note: '', ...o });

describe('parsePlanForm', () => {
    it('parses a full plan and treats empty optional fields as unlimited', () => {
        expect(parsePlanForm(form({ tier: ' standard ', validFrom: '2026-01-01', validUntil: '2027-01-31', memberLimit: '250', note: ' x ' }))).toEqual({ ok: true, value: { tier: 'standard', validFrom: '2026-01-01', validUntil: '2027-01-31', memberLimit: 250, note: 'x' } });
        expect(parsePlanForm(form())).toEqual({ ok: true, value: { tier: 'standard', validFrom: null, validUntil: null, memberLimit: null, note: null } });
    });
    it('rejects bad tier, dates, order and limits', () => {
        expect(parsePlanForm(form({ tier: '' })).ok).toBe(false);
        expect(parsePlanForm(form({ tier: 'Standard' })).ok).toBe(false);
        expect(parsePlanForm(form({ validUntil: '31.01.2027' })).ok).toBe(false);
        expect(parsePlanForm(form({ validFrom: '2027-02-01', validUntil: '2027-01-01' })).ok).toBe(false);
        expect(parsePlanForm(form({ memberLimit: '0' })).ok).toBe(false);
        expect(parsePlanForm(form({ memberLimit: '2,5' })).ok).toBe(false);
        expect(parsePlanForm(form({ note: 'x'.repeat(501) })).ok).toBe(false);
    });
});

describe('planExpired', () => {
    it('counts the end day as still valid', () => {
        const plan = { tier: 'a', validFrom: null, validUntil: '2026-11-20', memberLimit: null };
        expect(planExpired(plan, new Date('2026-11-20T12:00:00Z'))).toBe(false);
        expect(planExpired(plan, new Date('2026-11-21T00:30:00Z'))).toBe(true);
        expect(planExpired(null)).toBe(false);
    });
});

describe('error mapping', () => {
    it('maps conflict codes and statuses to German texts, never the backend message', () => {
        expect(clubErrorText({ detailsCode: 'club_already_suspended' }, 'x')).toContain('bereits gesperrt');
        expect(clubErrorText({ status: 403 }, 'x')).toContain('Berechtigung');
        expect(clubErrorText({ status: 500 }, 'Fallback')).toBe('Fallback');
        expect(isStateConflict({ detailsCode: 'club_not_suspended' })).toBe(true);
        expect(isStateConflict(new Error('x'))).toBe(false);
    });
});

describe('clubsHref', () => {
    it('omits empty filters and page 1', () => {
        expect(clubsHref({})).toBe('/clubs');
        expect(clubsHref({ q: 'tsv', status: 'suspended', page: 2 })).toBe('/clubs?q=tsv&status=suspended&page=2');
        expect(clubsHref({ page: 1 })).toBe('/clubs');
    });
});
