import SearchBar from '../common/SearchBar';
import { useLanguage } from '../../i18n/useLanguage';

interface MemorySearchProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MemorySearch({ value, onChange }: MemorySearchProps) {
  const { t } = useLanguage();

  return (
    <SearchBar
      value={value}
      onChange={onChange}
      placeholder={t('memory.search_placeholder')}
    />
  );
}
