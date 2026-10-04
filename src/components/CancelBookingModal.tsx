import { useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from './Modal';
import Button from './Button';
import { cancelBooking } from '../lib/api';
import { FREE_CANCELLATION_HOURS, formatCurrency, formatDate, formatTime, renterRefundAmount } from '../lib/utils';
import type { Booking } from '../types';

interface CancelBookingModalProps {
  booking: Booking | null;
  /** Who is cancelling — decides the refund shown and the wording. */
  actor: 'renter' | 'owner';
  onClose: () => void;
  onCancelled: (bookingId: string, refundAmount: number) => void;
}

export default function CancelBookingModal({ booking, actor, onClose, onCancelled }: CancelBookingModalProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!booking) return <Modal open={false} onClose={onClose}>{null}</Modal>;

  const refund =
    actor === 'owner' ? booking.total : booking.startsAt ? renterRefundAmount(booking.total, booking.startsAt) : 0;

  const close = () => {
    if (submitting) return;
    setReason('');
    setError('');
    onClose();
  };

  const confirm = async () => {
    setSubmitting(true);
    setError('');
    try {
      const result = await cancelBooking(booking.id, reason);
      onCancelled(booking.id, result.refundAmount);
      setReason('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={close} maxWidth="max-w-md">
      <h2 className="font-display text-lg font-bold text-ink-950">Cancel this booking?</h2>
      <p className="mt-2 text-sm text-ink-600">
        {booking.listingName} · {formatDate(booking.date)} · {formatTime(booking.startTime)} –{' '}
        {formatTime(booking.endTime)}
      </p>

      <div className="mt-4 rounded-xl bg-ink-50 p-4 text-sm text-ink-700">
        {actor === 'owner' ? (
          <p>
            The renter will be refunded <b>{formatCurrency(refund)}</b> in full and your payout for this booking will be
            reversed. Please only cancel when you genuinely can't host.
          </p>
        ) : refund > 0 ? (
          <p>
            You'll get a full refund of <b>{formatCurrency(refund)}</b> to your original payment method (usually 5–10
            business days).
          </p>
        ) : (
          <p>
            Your booking starts in less than {FREE_CANCELLATION_HOURS} hours, so under the{' '}
            <Link to="/cancellation-policy" className="font-medium text-brand-600 underline" target="_blank">
              cancellation policy
            </Link>{' '}
            <b>no refund</b> applies. The time will be released for others to book.
          </p>
        )}
      </div>

      <label className="mt-4 block text-sm font-medium text-ink-700">
        Reason {actor === 'owner' ? '(shared with the renter)' : '(optional)'}
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
          rows={2}
          className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />
      </label>

      {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
        <Button fullWidth onClick={confirm} disabled={submitting} className="!bg-red-600 hover:!bg-red-700">
          {submitting ? 'Cancelling…' : 'Cancel booking'}
        </Button>
        <Button fullWidth variant="outline" onClick={close} disabled={submitting}>
          Keep booking
        </Button>
      </div>
    </Modal>
  );
}
