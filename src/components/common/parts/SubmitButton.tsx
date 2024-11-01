import React from 'react';

type InputProps = {
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  loading?: boolean;
  children?: React.ReactNode;
};

const Input: React.FC<InputProps> = ({
  className = '',
  type = 'button',
  loading = false,
  children,
  ...props
}) => {
  return (
    <button
      type={type}
      className={`${className} flex items-center justify-center`}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      ) : (
        children
      )}
    </button>
  );
};

export default Input;