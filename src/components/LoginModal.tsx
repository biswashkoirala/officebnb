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

      <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
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
