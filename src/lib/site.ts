// Business details shown on the legal and contact pages. Set these in
// Vercel → Project → Settings → Environment Variables (and in .env locally).
// Australian law expects the legal entity behind a business to be
// identifiable; for a sole trader that's your own name plus your ABN.
const env = import.meta.env;

export const SITE = {
  brand: 'Officebnb',
  /** e.g. "Jane Citizen trading as Officebnb" */
  legalName: env.VITE_BUSINESS_LEGAL_NAME || '[Business legal name — set VITE_BUSINESS_LEGAL_NAME]',
  abn: env.VITE_BUSINESS_ABN || '[ABN — set VITE_BUSINESS_ABN]',
  supportEmail: env.VITE_SUPPORT_EMAIL || 'support@example.com',
  /** State whose laws govern the Terms. */
  state: 'New South Wales',
  /** Date the current legal pages took effect — update when you change them. */
  legalUpdated: '28 September 2026',
};
