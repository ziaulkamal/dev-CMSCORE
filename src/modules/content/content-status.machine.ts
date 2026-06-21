/**
 * src/modules/content/content-status.machine.ts
 * State machine status editorial (PRD §6) + capability yang dibutuhkan tiap transisi.
 */
import { ContentStatus } from '@prisma/client';

/** Transisi legal: from → set of allowed to. */
const TRANSITIONS: Record<ContentStatus, ContentStatus[]> = {
  draft: ['pending_review', 'trashed'],
  pending_review: ['draft', 'scheduled', 'published', 'trashed'],
  scheduled: ['published', 'trashed'],
  published: ['archived', 'trashed'],
  archived: ['published', 'trashed'],
  trashed: ['draft'],
};

/** Capability yang ditegakkan per transisi (PRD §6). */
const TRANSITION_CAPABILITY: Partial<Record<`${ContentStatus}->${ContentStatus}`, string>> = {
  'draft->pending_review': 'edit_post',
  'pending_review->draft': 'publish_post',
  'pending_review->scheduled': 'publish_post',
  'pending_review->published': 'publish_post',
  'scheduled->published': 'publish_post',
  'published->archived': 'publish_post',
  'archived->published': 'publish_post',
  'draft->trashed': 'delete_post',
  'pending_review->trashed': 'delete_post',
  'scheduled->trashed': 'delete_post',
  'published->trashed': 'delete_post',
  'archived->trashed': 'delete_post',
  'trashed->draft': 'delete_post',
};

export function isLegalTransition(from: ContentStatus, to: ContentStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function requiredCapabilityFor(from: ContentStatus, to: ContentStatus): string | null {
  return TRANSITION_CAPABILITY[`${from}->${to}`] ?? null;
}
