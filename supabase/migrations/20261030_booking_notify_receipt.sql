-- Notification receipt on estadía reserve-requests (2026-10-30)
--
-- Context: /api/room-bookings notifies staff fail-soft (Telegram + venue
-- WhatsApp). A failed send was only visible in 24h-retention runtime logs, so
-- a request could sit unseen ("cayó una reserva pero no me llegó mensaje",
-- Daniel Magaña, Oct 2026). These columns make the outcome durable so the
-- admin Habitaciones view can show which requests never notified anyone.
--
-- notified_at  — set when the staff Telegram send was accepted (message_id).
-- notify_error — the failure reason when it was not.
ALTER TABLE room_bookings ADD COLUMN IF NOT EXISTS notified_at timestamptz;
ALTER TABLE room_bookings ADD COLUMN IF NOT EXISTS notify_error text;

COMMENT ON COLUMN room_bookings.notified_at IS 'Staff Telegram notification accepted at (null = not notified)';
COMMENT ON COLUMN room_bookings.notify_error IS 'Last staff-notification failure reason (null = none recorded)';
