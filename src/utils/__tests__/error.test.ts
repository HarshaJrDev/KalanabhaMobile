import { normalizeError } from '../error';
import { ApiError } from '@api/types';

describe('normalizeError', () => {
    it('returns a plain string as-is', () => {
        expect(normalizeError('Network request failed')).toBe('Network request failed');
    });

    it('returns the message of a plain Error', () => {
        expect(normalizeError(new Error('boom'))).toBe('boom');
    });

    it('returns the message of an ApiError (the real shape every failed request throws)', () => {
        const err = new ApiError('Not a currently serviceable locality', 400, ['serviceAreaId must be a valid id']);
        expect(normalizeError(err)).toBe('Not a currently serviceable locality');
    });

    it('reads a .message off a plain object shape', () => {
        expect(normalizeError({ message: 'custom failure' })).toBe('custom failure');
    });

    it('falls back to a generic message for an object with no .message', () => {
        expect(normalizeError({ code: 'ECONNABORTED' })).toBe('Something went wrong. Please try again.');
    });

    it('falls back to a generic message for null/undefined', () => {
        expect(normalizeError(null)).toBe('Something went wrong. Please try again.');
        expect(normalizeError(undefined)).toBe('Something went wrong. Please try again.');
    });

    it('falls back to a generic message when .message exists but is not a string', () => {
        expect(normalizeError({ message: 404 })).toBe('Something went wrong. Please try again.');
    });
});
