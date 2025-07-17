import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`p-4 rounded shadow bg-white ${className}`}>
      {children}
    </div>
  );
}
