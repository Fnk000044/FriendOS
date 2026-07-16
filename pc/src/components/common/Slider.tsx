interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  ariaLabel?: string;
  disabled?: boolean;
}

/**
 * 通用 Slider 组件
 * 原生 input[type=range] 包装，配色用 CSS 变量
 */
export default function Slider({
  value, min, max, step = 1, onChange, ariaLabel, disabled = false,
}: SliderProps) {
  return (
    <input
      type="range"
      value={value}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-2 rounded-full appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${
          ((value - min) / (max - min)) * 100
        }%, var(--bg-hover) ${((value - min) / (max - min)) * 100}%, var(--bg-hover) 100%)`,
      }}
      // 滑块 thumb 样式在 index.css 用 ::-webkit-slider-thumb 覆盖
    />
  );
}
