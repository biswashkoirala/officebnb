import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="font-display text-2xl font-bold text-ink-950">Page not found</h1>
      <p className="mt-2 text-ink-500">That page doesn't exist or has moved.</p>
      <Button className="mt-6" onClick={() => navigate('/')}>
        Go home
      </Button>
    </div>
  );
}
