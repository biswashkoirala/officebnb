// Terms, Privacy Policy, Cancellation Policy and Contact.
//
// These are a reasonable starting point for an Australian sole-trader
// marketplace, NOT legal advice. Have a lawyer review them before launch —
// especially the liability, insurance and host-obligation sections.
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { SITE } from '../lib/site';
import { FREE_CANCELLATION_HOURS, SERVICE_FEE_RATE } from '../lib/utils';

function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-ink-950">{title}</h1>
      <p className="mt-2 text-sm text-ink-400">Last updated {SITE.legalUpdated}</p>
      <div className="legal mt-8 space-y-4 text-[15px] leading-relaxed text-ink-700 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-ink-950 [&_li]:ml-5 [&_li]:list-disc [&_a]:font-medium [&_a]:text-brand-600 [&_a]:underline">
        {children}
      </div>
    </div>
  );
}

const operator = (
  <>
    {SITE.brand} is operated by {SITE.legalName} (ABN {SITE.abn})
  </>
);

export function TermsPage() {
  const feePct = Math.round(SERVICE_FEE_RATE * 100);
  return (
    <LegalPage title="Terms of Service">
      <p>
        {operator} ("we", "us"). These terms apply when you use {SITE.brand} to book a space ("renter") or to list a
        space ("host"). By creating an account or making a booking you agree to them.
      </p>

      <h2>1. What {SITE.brand} does</h2>
      <p>
        {SITE.brand} is an online marketplace that connects hosts who have office space available with renters who want
        to use it by the hour. The host — not {SITE.brand} — provides the space and is responsible for it. We provide the
        platform, take payment on the host's behalf, and pass the host's share on to them.
      </p>

      <h2>2. Accounts</h2>
      <ul className="space-y-2">
      <li>You must be 18 or older and give accurate information.</li>
      <li>Keep your login secure; you're responsible for activity on your account.</li>
      <li>We may suspend accounts that break these terms or are used fraudulently.</li>

      </ul>
      <h2>3. Bookings and payment (renters)</h2>
      <ul className="space-y-2">
      <li>
        Prices are in Australian dollars. The total shown at checkout is the host's hourly price multiplied by the hours
        booked, plus a {feePct}% {SITE.brand} service fee. You won't pay anything else to us.
      </li>
      <li>Payments are processed by Stripe. We never see or store your full card details.</li>
      <li>A booking is confirmed once payment succeeds and you see the confirmation screen and receive a receipt.</li>
      <li>
        Use the space only for the booked time, for lawful purposes, with no more than the stated number of guests, and
        follow any reasonable house rules the host gives you. You're responsible for damage you or your guests cause.
      </li>
      <li>
        Cancellations and refunds follow our <Link to="/cancellation-policy">Cancellation Policy</Link>.
      </li>

      </ul>
      <h2>4. Listing a space (hosts)</h2>
      <ul className="space-y-2">
      <li>
        You must have the right to rent out the space for the hours you list — including any permission needed from your
        landlord, building manager or strata, and any council approvals.
      </li>
      <li>
        Listings must be accurate: photos, capacity, amenities and available hours must reflect the real space. The space
        must be safe, clean and available as booked.
      </li>
      <li>
        You're responsible for appropriate insurance (for example public liability) and for complying with laws that apply
        to your space.
      </li>
      <li>
        Payouts are made through Stripe Connect. You must complete Stripe's verification and agree to the{' '}
        <a href="https://stripe.com/au/legal/connect-account" target="_blank" rel="noreferrer">
          Stripe Connected Account Agreement
        </a>
        . You receive the booking price (the hourly price × hours); the renter's service fee is kept by {SITE.brand}.
      </li>
      <li>
        You're responsible for your own tax, including income tax and, if you're registered for it, GST on your earnings.
      </li>
      <li>If you cancel a confirmed booking, the renter is refunded in full and your payout for it is reversed.</li>

      </ul>
      <h2>5. Reviews and content</h2>
      <p>
        Content you post (listing text, photos) must be yours to share and must not be misleading or unlawful. You give us
        a licence to display it on {SITE.brand} for as long as it's listed.
      </p>

      <h2>6. Consumer law</h2>
      <p>
        Nothing in these terms excludes, restricts or modifies any right or remedy you have under the Australian Consumer
        Law or other law that cannot lawfully be excluded. Where our liability can lawfully be limited, it is limited to
        re-supplying the service or refunding the amount you paid for the booking concerned.
      </p>

      <h2>7. Our liability</h2>
      <p>
        Hosts are independent and are not our employees or agents for the purpose of providing the space. To the extent
        permitted by law, we aren't liable for the condition of a space, the conduct of hosts or renters, or indirect or
        consequential loss.
      </p>

      <h2>8. Disputes</h2>
      <p>
        If something goes wrong, contact us first at <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a> and
        we'll try to help resolve it. These terms are governed by the laws of {SITE.state}, Australia.
      </p>

      <h2>9. Changes</h2>
      <p>
        We may update these terms. The version in force when you make a booking applies to that booking. We'll tell
        account holders about significant changes.
      </p>
    </LegalPage>
  );
}

export function CancellationPolicyPage() {
  return (
    <LegalPage title="Cancellation Policy">
      <h2>If you're the renter</h2>
      <ul className="space-y-2">
      <li>
        <b>Cancel {FREE_CANCELLATION_HOURS} hours or more before your start time:</b> full refund, including the service
        fee.
      </li>
      <li>
        <b>Cancel less than {FREE_CANCELLATION_HOURS} hours before:</b> no refund. The host has held the time for you and
        is unlikely to rebook it at short notice.
      </li>
      <li>Cancel from <Link to="/my-bookings">My bookings</Link>. Times are Sydney time.</li>
      <li>Refunds go back to your original payment method and usually arrive within 5–10 business days.</li>

      </ul>
      <h2>If the host cancels</h2>
      <p>You always get a full refund, whenever the host cancels.</p>

      <h2>If the space isn't as described or isn't available</h2>
      <p>
        If you arrive and can't get in, or the space is significantly different from the listing, contact us within 24
        hours at <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a> with your booking reference. We'll look
        into it and refund you where the host is at fault. This doesn't limit your rights under the Australian Consumer
        Law.
      </p>

      <h2>Payment problems</h2>
      <p>
        If a payment goes through but the time slot is no longer available (rare — for example if checkout took too
        long), we refund it automatically in full.
      </p>
    </LegalPage>
  );
}

export function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        {operator}. This policy explains what personal information we collect and how we handle it, consistent with the
        Australian Privacy Principles.
      </p>

      <h2>What we collect</h2>
      <ul className="space-y-2">
      <li>Account details: your name, email address, business name (hosts) and login details.</li>
      <li>Booking details: spaces, dates, times, number of guests and amounts paid or refunded.</li>
      <li>
        Host payout details are collected and verified by Stripe, not by us. We receive only your Stripe account ID and
        whether it's ready to accept payments.
      </li>
      <li>Card details are entered directly into Stripe's secure form; we never see or store them.</li>
      <li>Technical information needed to keep you logged in and the site secure.</li>

      </ul>
      <h2>How we use it</h2>
      <ul className="space-y-2">
      <li>To run your account, process bookings and payments, and send booking confirmations and receipts.</li>
      <li>To share what's necessary with the other party to a booking (for example, your name with the host).</li>
      <li>To prevent fraud, resolve disputes and meet legal, tax and accounting obligations.</li>
      </ul>
      <p>We don't sell your personal information or use it for third-party advertising.</p>

      <h2>Who we share it with</h2>
      <ul className="space-y-2">
      <li>Stripe — payment processing and host payouts.</li>
      <li>Supabase — database, login and file storage hosting.</li>
      <li>Vercel — website hosting.</li>
      <li>Our email provider — to send booking emails.</li>
      <li>Government or law enforcement where the law requires it.</li>
      </ul>
      <p>
        Some of these providers may store or process data outside Australia (for example in the United States). We choose
        providers with strong security and privacy practices.
      </p>

      <h2>Your browser</h2>
      <p>
        We use your browser's storage to keep you logged in and to remember spaces you've saved. We don't use advertising
        or tracking cookies.
      </p>

      <h2>Access, correction and deletion</h2>
      <p>
        You can ask to see, correct or delete your personal information by emailing{' '}
        <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>. We may need to keep booking and payment records
        for as long as tax law requires (generally five years).
      </p>

      <h2>Complaints</h2>
      <p>
        If you have a privacy concern, email us first. If you're not satisfied with our response, you can contact the
        Office of the Australian Information Commissioner at{' '}
        <a href="https://www.oaic.gov.au" target="_blank" rel="noreferrer">
          oaic.gov.au
        </a>
        .
      </p>
    </LegalPage>
  );
}

export function ContactPage() {
  return (
    <LegalPage title="Contact us">
      <p>Questions about a booking, a listing or your account? We're happy to help.</p>
      <p>
        <a href={`mailto:${SITE.supportEmail}`} className="inline-flex items-center gap-2 !no-underline">
          <Mail size={16} /> {SITE.supportEmail}
        </a>
      </p>
      <p>Please include your booking reference (it starts with “OFF-”) if your question is about a booking.</p>
      <p className="text-sm text-ink-500">
        {SITE.legalName} · ABN {SITE.abn}
      </p>
    </LegalPage>
  );
}
