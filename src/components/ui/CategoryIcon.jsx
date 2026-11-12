import {
  Film,
  Folder,
  Image as ImageIcon,
  Layers,
  Sparkles,
  Video,
  Wand2,
} from 'lucide-react';

const ICON_MAP = {
  image: ImageIcon,
  film: Film,
  video: Video,
  sparkles: Sparkles,
  layers: Layers,
  'wand-2': Wand2,
  folder: Folder,
};

export default function CategoryIcon({ name, size = 20 }) {
  const IconComponent = ICON_MAP[name] || Folder;
  return <IconComponent size={size} />;
}
