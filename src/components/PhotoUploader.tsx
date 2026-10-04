import { useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface PhotoUploaderProps {
  ownerId: string;
  value: string[];
  onChange: (urls: string[]) => void;
}

const BUCKET = 'listing-photos';
const MAX_PHOTOS = 8;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

async function downscaleToJpeg(file: File, maxWidth = 1600): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? file), 'image/jpeg', 0.85);
  });
}

export default function PhotoUploader({ ownerId, value, onChange }: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');

    const remaining = MAX_PHOTOS - value.length;
    if (remaining <= 0) {
      setError(`You can add up to ${MAX_PHOTOS} photos.`);
      return;
    }
    const selected = Array.from(files).slice(0, remaining);

    setUploading(true);
    const uploaded: string[] = [];
    for (const file of selected) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError('Only JPEG, PNG, or WebP images are supported.');
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        setError('Each photo must be under 5MB.');
        continue;
      }
      try {
        const blob = await downscaleToJpeg(file);
        const path = `${ownerId}/${crypto.randomUUID()}.jpg`;
        const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, blob, {
          contentType: 'image/jpeg',
        });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        uploaded.push(data.publicUrl);
      } catch (err) {
        console.error('Photo upload failed', err);
        setError('One or more photos failed to upload. Please try again.');
      }
    }
    if (uploaded.length > 0) onChange([...value, ...uploaded]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removePhoto = (url: string) => onChange(value.filter((u) => u !== url));

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {value.map((url) => (
          <div key={url} className="relative aspect-square overflow-hidden rounded-xl border border-ink-200">
            <img src={url} alt="Uploaded space photo" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(url)}
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink-950/70 text-white hover:bg-ink-950"
              aria-label="Remove photo"
            >
              <X size={13} />
            </button>
          </div>
        ))}
        {value.length < MAX_PHOTOS && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-ink-200 text-ink-400 hover:border-ink-400 hover:text-ink-600">
            {uploading ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
            <span className="text-xs font-medium">{uploading ? 'Uploading…' : 'Upload'}</span>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        )}
      </div>
      <p className="mt-3 text-xs text-ink-400">
        {value.length} photo{value.length === 1 ? '' : 's'} added · up to {MAX_PHOTOS}, 5MB each
      </p>
      {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
