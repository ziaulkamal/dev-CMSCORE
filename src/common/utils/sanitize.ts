// src/common/utils/sanitize.ts — sanitasi HTML body content (cegah XSS, PRD §13).
import sanitizeHtml from 'sanitize-html';

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'figure', 'figcaption', 'iframe']),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ['src', 'alt', 'title', 'width', 'height'],
    iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder'],
    a: ['href', 'name', 'target', 'rel'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
};

/** Bersihkan HTML untrusted sebelum disimpan/serve. */
export function sanitizeBody(html?: string | null): string | null {
  if (!html) return html ?? null;
  return sanitizeHtml(html, OPTIONS);
}
