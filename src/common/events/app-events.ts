// src/common/events/app-events.ts — nama event domain & bentuk payload (PRD §11).

export const APP_EVENTS = {
  contentPublished: 'content.published',
  contentUpdated: 'content.updated',
  contentTrashed: 'content.trashed',
  commentCreated: 'comment.created',
  commentStatusChanged: 'comment.status_changed',
  mediaUploaded: 'media.uploaded',
} as const;

export type AppEventName = (typeof APP_EVENTS)[keyof typeof APP_EVENTS];

/** Payload generik yang dipancarkan ke listener internal & webhook. */
export interface DomainEvent {
  event: AppEventName;
  payload: Record<string, unknown>;
}
