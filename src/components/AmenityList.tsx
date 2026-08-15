import {
  Wifi,
  Projector,
  PenSquare,
  Video,
  Snowflake,
  Coffee,
  Plug,
  ParkingCircle,
  MonitorPlay,
  Check,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  'Wi-Fi': Wifi,
  Projector: Projector,
  Whiteboard: PenSquare,
  'Video conferencing': Video,
  'Air conditioning': Snowflake,
  Kitchen: Coffee,
  'Kitchen access': Coffee,
  'Power outlets': Plug,
  Parking: ParkingCircle,
  'Large display': MonitorPlay,
};

interface AmenityListProps {
  amenities: string[];
  columns?: 1 | 2;
}

export default function AmenityList({ amenities, columns = 2 }: AmenityListProps) {
  return (
    <ul className={`grid gap-x-6 gap-y-3 ${columns === 2 ? 'sm:grid-cols-2' : ''}`}>
      {amenities.map((amenity) => {
        const Icon = ICON_MAP[amenity] ?? Check;
        return (
          <li key={amenity} className="flex items-center gap-3 text-sm text-ink-700">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-50 text-ink-600">
              <Icon size={16} />
            </span>
            {amenity}
          </li>
        );
      })}
    </ul>
  );
}
