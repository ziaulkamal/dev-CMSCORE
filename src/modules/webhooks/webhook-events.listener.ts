/**
 * src/modules/webhooks/webhook-events.listener.ts
 * Jembatan event domain (EventEmitter) → enqueue webhook delivery (PRD §11).
 */
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WebhookService } from './webhooks.service';
import { APP_EVENTS } from '../../common/events/app-events';

@Injectable()
export class WebhookEventsListener {
  constructor(private readonly webhooks: WebhookService) {}

  // Wildcard tidak dipakai; daftarkan tiap event eksplisit agar jelas & aman.
  @OnEvent(APP_EVENTS.contentPublished)
  onContentPublished(payload: Record<string, unknown>) {
    return this.webhooks.dispatch(APP_EVENTS.contentPublished, payload);
  }

  @OnEvent(APP_EVENTS.contentUpdated)
  onContentUpdated(payload: Record<string, unknown>) {
    return this.webhooks.dispatch(APP_EVENTS.contentUpdated, payload);
  }

  @OnEvent(APP_EVENTS.contentTrashed)
  onContentTrashed(payload: Record<string, unknown>) {
    return this.webhooks.dispatch(APP_EVENTS.contentTrashed, payload);
  }

  @OnEvent(APP_EVENTS.commentCreated)
  onCommentCreated(payload: Record<string, unknown>) {
    return this.webhooks.dispatch(APP_EVENTS.commentCreated, payload);
  }

  @OnEvent(APP_EVENTS.commentStatusChanged)
  onCommentStatusChanged(payload: Record<string, unknown>) {
    return this.webhooks.dispatch(APP_EVENTS.commentStatusChanged, payload);
  }

  @OnEvent(APP_EVENTS.mediaUploaded)
  onMediaUploaded(payload: Record<string, unknown>) {
    return this.webhooks.dispatch(APP_EVENTS.mediaUploaded, payload);
  }
}
