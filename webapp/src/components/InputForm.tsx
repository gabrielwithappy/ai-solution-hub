import React, { useState } from 'react';
import Button from './ui/Button';

interface InputFormProps {
  label: string;
  placeholder: string;
  onSubmit: (value: string) => void;
  isLoading?: boolean;
  maxLength?: number;
}

export default function InputForm({ label, placeholder, onSubmit, isLoading = false, maxLength = 500 }: InputFormProps) {
  const [value, setValue] = useState('');

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={e => {
        e.preventDefault();
        if (value.trim()) onSubmit(value);
      }}
    >
      <label className="font-semibold">{label}</label>
      <textarea
        className="border rounded p-2 resize-none"
        placeholder={placeholder}
        value={value}
        maxLength={maxLength}
        onChange={e => setValue(e.target.value)}
        disabled={isLoading}
      />
      <Button type="submit" disabled={isLoading || !value.trim()}>
        {isLoading ? '생성 중...' : '생성'}
      </Button>
      <div className="text-xs text-gray-500 text-right">{value.length} / {maxLength}자</div>
    </form>
  );
}
