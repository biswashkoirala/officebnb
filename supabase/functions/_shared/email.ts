// Booking emails, sent through Resend (https://resend.com) when the
// RESEND_API_KEY and EMAIL_FROM secrets are set. If they aren't, emails are
// skipped and bookings still work — Stripe's own receipt still goes to the
// renter. Email failures are logged, never thrown: a flaky mail provider
// must never undo a confirmed payment.
import { admin, siteUrl } from './http.ts';

const apiKey = Deno.env.get('RESEND_API_KEY');
const from = Deno.env.get('EMAIL_FROM'); // e.g. "Officebnb <bookings@yourdomain.com.au>"

export interface BookingForEmail {
  id: string;
  reference: string;
  listing_name: string;
  location: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  guests: number;
  total: number | string;
  host_payout: number | string;
  refund_amount: number | string;
  renter_name: string | null;
  host_name: string;
  user_id: string | null;
  owner_id: string | null;
  cancelled_by?: string | null;
}

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const money = (n: number | string) =>
  Number(n).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });

const hhmm = (t: string) => t.slice(0, 5);

async function emailFor(userId: string | null): Promise<string | null> {
  if (!userId) return null;
  const { data } = await admin.auth.admin.getUserById(userId);
  return data.user?.email ?? null;
}

async function send(to: string | null, subject: string, html: string) {
  if (!apiKey || !from || !to) return;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) console.error('Email send failed', res.status, await res.text());
  } catch (err) {
    console.error('Email send failed', err);
  }
}

function details(b: BookingForEmail) {
  return `
    <table cellpadding="4" style="font-family:sans-serif;font-size:14px">
      <tr><td><b>Space</b></td><td>${esc(b.listing_name)}, ${esc(b.location)}</td></tr>
      <tr><td><b>Date</b></td><td>${esc(b.booking_date)}</td></tr>
      <tr><td><b>Time</b></td><td>${esc(hhmm(b.start_time))} – ${esc(hhmm(b.end_time))} (Sydney time)</td></tr>
      <tr><td><b>Guests</b></td><td>${esc(b.guests)}</td></tr>
      <tr><td><b>Reference</b></td><td>${esc(b.reference)}</td></tr>
    </table>`;
}

export async function sendBookingConfirmedEmails(b: BookingForEmail) {
  try {
    await confirmedEmails(b);
  } catch (err) {
    console.error('Booking confirmed emails failed', err);
  }
}

export async function sendBookingCancelledEmails(b: BookingForEmail) {
  try {
    await cancelledEmails(b);
  } catch (err) {
    console.error('Booking cancelled emails failed', err);
  }
}

async function confirmedEmails(b: BookingForEmail) {
  if (!apiKey || !from) return;
  const site = siteUrl();
  const [renterEmail, ownerEmail] = await Promise.all([emailFor(b.user_id), emailFor(b.owner_id)]);
  await Promise.all([
    send(
      renterEmail,
      `Booking confirmed: ${b.listing_name} on ${b.booking_date}`,
      `<p style="font-family:sans-serif">Hi ${esc(b.renter_name ?? 'there')}, your booking is confirmed.</p>
       ${details(b)}
       <p style="font-family:sans-serif">Total paid: <b>${money(b.total)}</b>. You can cancel for a full refund up to 48 hours before your start time from <a href="${site}/my-bookings">My bookings</a>.</p>`,
    ),
    send(
      ownerEmail,
      `New booking: ${b.listing_name} on ${b.booking_date}`,
      `<p style="font-family:sans-serif">You have a new booking from ${esc(b.renter_name ?? 'a renter')}.</p>
       ${details(b)}
       <p style="font-family:sans-serif">Your payout: <b>${money(b.host_payout)}</b>. See it on your <a href="${site}/dashboard">dashboard</a>.</p>`,
    ),
  ]);
}

async function cancelledEmails(b: BookingForEmail) {
  if (!apiKey || !from) return;
  const site = siteUrl();
  const [renterEmail, ownerEmail] = await Promise.all([emailFor(b.user_id), emailFor(b.owner_id)]);
  const who = b.cancelled_by === 'owner' ? 'the host' : b.cancelled_by === 'renter' ? 'the renter' : 'Officebnb';
  const refund = Number(b.refund_amount);
  await Promise.all([
    send(
      renterEmail,
      `Booking cancelled: ${b.listing_name} on ${b.booking_date}`,
      `<p style="font-family:sans-serif">This booking was cancelled by ${who}.</p>
       ${details(b)}
       <p style="font-family:sans-serif">${
         refund > 0
           ? `A refund of <b>${money(refund)}</b> is on its way to your original payment method (usually 5–10 business days).`
           : 'No refund applies under the cancellation policy.'
       } <a href="${site}/my-bookings">My bookings</a></p>`,
    ),
    send(
      ownerEmail,
      `Booking cancelled: ${b.listing_name} on ${b.booking_date}`,
      `<p style="font-family:sans-serif">This booking was cancelled by ${who}.</p>
       ${details(b)}
       <p style="font-family:sans-serif">${
         refund > 0 ? 'The renter has been refunded and the payout for this booking has been reversed.' : 'You keep the payout for this booking.'
       }</p>`,
    ),
  ]);
}
