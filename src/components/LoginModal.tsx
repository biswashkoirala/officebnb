import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import { supabase } from '../lib/supabaseClient';
import { createProfile, fetchProfile } from '../lib/api';
import { useApp } from '../context/AppContext';

type Mode = 'login' | 'signup';
type Role = 'renter' | 'owner';

export default function LoginModal() {
  const { loginModalOpen, closeLoginModal, applyProfile } = useApp();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('renter');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setName('');
    setRole('renter');
    setBusinessName('');
    setEmail('');
    setPassword('');
    setError('');
  };

  const handleClose = () => {
    closeLoginModal();
    setMode('login');
    resetForm();
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
  };

  const handleGoogleAuth = async () => {
    setError('');
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (oauthError) setError(oauthError.message);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        const loggedInProfile = data.user ? await fetchProfile(data.user.id) : null;
        if (loggedInProfile) applyProfile(loggedInProfile);
        handleClose();
        if (loggedInProfile?.role === 'owner') navigate('/dashboard');
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        if (!data.session || !data.user) {
          setError('Check your email to confirm your account, then log in.');
          setLoading(false);
          return;
        }
        try {
          const newProfile = await createProfile({
            id: data.user.id,
            role,
            name,
            businessName: role === 'owner' ? businessName : null,
          });
          applyProfile(newProfile);
        } catch (profileErr) {
          await supabase.auth.signOut();
          const isDuplicateName =
            profileErr &&
            typeof profileErr === 'object' &&
            'code' in profileErr &&
            (profileErr as { code: string }).code === '23505';
          throw new Error(
            isDuplicateName
              ? 'That business name is already taken. Please choose another.'
              : 'Something went wrong finishing your signup. Please try again.',
          );
        }
        handleClose();
        if (role === 'owner') navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={loginModalOpen} onClose={handleClose}>
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Building2 size={18} />
        </span>
        <span className="font-display text-lg font-bold text-ink-950">Officebnb</span>
      </div>
      <h2 className="mt-5 font-display text-xl font-bold text-ink-950">
        {mode === 'login' ? 'Welcome back' : 'Create your account'}
      </h2>
      <p className="mt-1 text-sm text-ink-500">
        {mode === 'login'
          ? 'Log in to book a space or manage your listings.'
          : 'Sign up to start booking spaces or listing your own.'}
      </p>

      <button
        type="button"
        onClick={handleGoogleAuth}
        className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-xl border border-ink-200 bg-white py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18z"
          />
          <path
            fill="#FBBC05"
            d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03l2.97-2.33z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58z"
          />
        </svg>
        Continue with Google
      </button>

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-ink-100" />
        <span className="text-xs font-medium uppercase tracking-wide text-ink-400">or</span>
        <div className="h-px flex-1 bg-ink-100" />
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        {mode === 'signup' && (
          <>
            <Input
              label="Full name"
              placeholder="Alex Renter"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">I'm signing up as</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('renter')}
                  className={`rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-colors ${
                    role === 'renter'
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-ink-200 text-ink-600 hover:border-ink-400'
                  }`}
                >
                  Renter
                </button>
                <button
                  type="button"
                  onClick={() => setRole('owner')}
                  className={`rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-colors ${
                    role === 'owner'
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-ink-200 text-ink-600 hover:border-ink-400'
                  }`}
                >
                  Space owner
                </button>
              </div>
            </div>
            {role === 'owner' && (
              <Input
                label="Business name"
                placeholder="Sarah's Workspace"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
            )}
          </>
        )}

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <Button type="submit" fullWidth size="lg" className="mt-1" disabled={loading}>
          {loading
            ? mode === 'login'
              ? 'Logging in…'
              : 'Creating account…'
            : mode === 'login'
              ? 'Log in'
              : 'Create account'}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-ink-500">
        {mode === 'login' ? (
          <>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className="font-semibold text-brand-600 hover:text-brand-700"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="font-semibold text-brand-600 hover:text-brand-700"
            >
              Log in
            </button>
          </>
        )}
      </p>
    </Modal>
  );
}
