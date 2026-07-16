import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../utils';

interface FieldWrapperProps {
  label?: string;
  error?: string;
  children: React.ReactNode;
}

function FieldWrapper({ label, error, children }: FieldWrapperProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium text-slate-300">{label}</label>}
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className, ...props }, ref) => (
  <FieldWrapper label={label} error={error}>
    <input ref={ref} className={cn('input-base', error && 'border-red-500/60', className)} {...props} />
  </FieldWrapper>
));
Input.displayName = 'Input';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(({ label, error, className, ...props }, ref) => (
  <FieldWrapper label={label} error={error}>
    <textarea ref={ref} className={cn('input-base resize-none', error && 'border-red-500/60', className)} {...props} />
  </FieldWrapper>
));
TextArea.displayName = 'TextArea';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, options, placeholder, ...props }, ref) => (
    <FieldWrapper label={label} error={error}>
      <select ref={ref} className={cn('input-base', error && 'border-red-500/60', className)} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  )
);
Select.displayName = 'Select';
