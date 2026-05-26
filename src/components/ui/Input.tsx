"use client";

import { forwardRef, useState } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = "", id, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const inputId = id || label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="relative w-full">
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none z-10">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              peer w-full bg-bg-surface border border-border rounded-input
              px-4 pt-5 pb-2 text-text-primary text-sm
              placeholder-transparent
              transition-all duration-200
              hover:border-border/80
              focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30
              disabled:opacity-50 disabled:cursor-not-allowed
              ${icon ? "pl-11" : ""}
              ${error ? "border-error focus:border-error focus:ring-error/30" : ""}
              ${className}
            `}
            placeholder={label}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...props}
          />
          <label
            htmlFor={inputId}
            className={`
              absolute top-1/2 -translate-y-1/2 text-text-muted text-sm
              transition-all duration-200 pointer-events-none select-none
              peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm
              peer-focus:top-2.5 peer-focus:text-xs peer-focus:text-accent
              peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:text-xs
              ${icon ? "left-11" : "left-4"}
              ${error ? "peer-focus:text-error" : ""}
              ${focused ? "text-accent" : ""}
            `}
          >
            {label}
          </label>
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-error animate-fade-in">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
