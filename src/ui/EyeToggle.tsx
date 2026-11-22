import type { ChangeEvent, ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * 보이기/숨기기 토글(Lucide 눈 아이콘). input[type=checkbox]는 화면에서만 숨겨서 키보드와 화면 낭독기에는 남긴다.
 * 줄 전체가 label이라 아이콘과 글자 어디를 눌러도 바뀐다.
 */
export function EyeToggle({ checked, disabled = false, title, onChange, children }: {
  checked: boolean;
  disabled?: boolean;
  title?: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  children: ReactNode;
}) {
  return (
    <label className={disabled ? 'eye-toggle disabled' : 'eye-toggle'} title={title}>
      <input type="checkbox" className="visually-hidden" checked={checked} disabled={disabled} onChange={onChange} />
      {checked ? <Eye className="eye-icon" size={16} aria-hidden /> : <EyeOff className="eye-icon" size={16} aria-hidden />}
      <span>{children}</span>
    </label>
  );
}
