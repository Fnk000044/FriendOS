import { Sun, CloudSun, CloudRain, CloudSnow, CloudLightning } from 'lucide-react';

interface WeatherGlyphProps {
  weather: string;
}

const PRESET: Record<string, { Icon: typeof Sun; color: string }> = {
  sunny: { Icon: Sun, color: '#F59E0B' },
  cloudy: { Icon: CloudSun, color: '#94A3B8' },
  rainy: { Icon: CloudRain, color: '#3B82F6' },
  snowy: { Icon: CloudSnow, color: '#60A5FA' },
  stormy: { Icon: CloudLightning, color: '#8B5CF6' },
};

/** 日记天气小图标：预设天气用图标，自定义天气只显示文字（由调用方渲染文字） */
export default function WeatherGlyph({ weather }: WeatherGlyphProps) {
  const preset = PRESET[weather];
  if (!preset) return null;
  const { Icon, color } = preset;
  return <Icon className="w-3 h-3" style={{ color }} aria-hidden="true" />;
}
