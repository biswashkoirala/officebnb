import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import { createProfile } from '../lib/api';
import { useApp } from '../context/AppContext';

type Role = 'renter' | 'owner';

export default function CompleteProfileModal() {
  const { user, needsProfileSetup, applyProfile, logout } = useApp();
  const navigate = useNavigate();

  const fallbackName =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    '';

  const [name, setName] = useState(fallbackName);
  const [role, setRole] = useState<Role>('renter');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const newProfile = await createProfile({
        id: user.id,
        role,
        name,
        businessName: role === 'owner' ? businessName : null,
      });
      applyProfile(newProfile);
      if (role === 'owner') navigate('/dashboard');
    } catch (err) {
      const isDuplicateName =
        err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === '23505';
      setError(
        isDuplicateName
          ? 'That business name is already taken. Please choose another.'
          : 'Something went wrong finishing your signup. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={needsProfileSetup} onClose={logout} maxWidth="max-w-md">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Building2 size={18} />
        </span>
        <span className="font-display text-lg font-bold text-ink-950">Officebnb</span>
      </div>
      <h2 className="mt-5 font-display text-xl font-bold text-ink-950">Finish setting up your account</h2>
      <p className="mt-1 text-sm text-ink-500">Just a couple more details before you get started.</p>

      <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
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

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <Button type="submit" fullWidth size="lg" className="mt-1" disabled={loading}>
          {loading ? 'Saving…' : 'Continue'}
        </Button>
      </form>
    </Modal>
  );
}
