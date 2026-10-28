import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Avatar, initialsOf } from './Avatar';

describe('Avatar Component', () => {
  describe('initialsOf', () => {
    it('extracts up to two uppercase initials from name', () => {
      expect(initialsOf('Nguyễn Văn Nam')).toBe('VN');
      expect(initialsOf('Linh')).toBe('L');
      expect(initialsOf('')).toBe('');
      expect(initialsOf('   ')).toBe('');
    });
  });

  describe('Fallback without src', () => {
    it('renders initials on pastel container when src is not provided', () => {
      const html = renderToStaticMarkup(<Avatar name="Trần Thị Lan" size="md" />);
      expect(html).toContain('TL');
      expect(html).not.toContain('<img');
      expect(html).toContain('aria-hidden="true"');
    });

    it('sets aria-label when label is provided for fallback', () => {
      const html = renderToStaticMarkup(
        <Avatar name="Trần Thị Lan" label="Ảnh đại diện của Lan" size="md" />,
      );
      expect(html).toContain('TL');
      expect(html).toContain('aria-label="Ảnh đại diện của Lan"');
      expect(html).toContain('role="img"');
    });
  });

  describe('Image display with src', () => {
    it('renders image with meaningful alt using label if available', () => {
      const html = renderToStaticMarkup(
        <Avatar
          name="Nguyễn Văn Nam"
          src="https://example.com/avatar.jpg"
          label="Ảnh đại diện của Nam"
          size="lg"
        />,
      );
      expect(html).toContain('<img');
      expect(html).toContain('alt="Ảnh đại diện của Nam"');
    });

    it('renders image with meaningful alt using name if label is omitted', () => {
      const html = renderToStaticMarkup(
        <Avatar
          name="Nguyễn Văn Nam"
          src="https://example.com/avatar.jpg"
          size="lg"
        />,
      );
      expect(html).toContain('<img');
      expect(html).toContain('alt="Nguyễn Văn Nam"');
    });

    it('falls back to initials when src is empty string', () => {
      const html = renderToStaticMarkup(
        <Avatar
          name="Nguyễn Văn Nam"
          src=""
          size="lg"
        />,
      );
      expect(html).not.toContain('<img');
      expect(html).toContain('VN');
    });
  });
});

