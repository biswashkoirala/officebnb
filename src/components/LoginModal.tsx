import { useNavigate } from 'react-router-dom';
import { Building2, UserRound } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import { useApp } from '../context/AppContext';

export default function LoginModal() {
  const { loginModalOpen, closeLoginModal, login } = useApp();
  const navigate = useNavigate();

  const handleLogin = (asOwner: boolean) => {
    login(asOwner ? 'owner' : 'renter');
    if (asOwner) navigate('/dashboard');
  };

  return (
    <Modal open={loginModalOpen} onClose={closeLoginModal}>
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Building2 size={18} />
        </span>
        <span className="font-display text-lg font-bold text-ink-950">Officebnb</span>
      </div>
      <h2 className="mt-5 font-display text-xl font-bold text-ink-950">Welcome back</h2>
      <p className="mt-1 text-sm text-ink-500">
        This is a demo login — no real account required.
      </p>

      <form
        className="mt-5 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin(false);
        }}
      >
        <Input label="Email" type="email" placeholder="sarah@example.com" defaultValue="sarah@officebnb.demo" />
        <Input label="Password" type="password" placeholder="••••••••" defaultValue="demo1234" />
        <Button type="submit" fullWidth size="lg" className="mt-1">
          Log in as renter
        </Button>
      </form>

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-ink-100" />
        <span className="text-xs text-ink-400">or</span>
        <div className="h-px flex-1 bg-ink-100" />
      </div>

      <Button
        variant="outline"
        fullWidth
        size="lg"
        onClick={() => handleLogin(true)}
        className="flex items-center justify-center gap-2"
      >
        <UserRound size={16} />
        Continue as Sarah (Space Owner)
      </Button>

      <p className="mt-4 text-center text-xs text-ink-400">
        Demo Mode — any credentials will work.
      </p>
    </Modal>
  );
}
