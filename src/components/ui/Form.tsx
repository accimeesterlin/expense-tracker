"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
}

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  required?: boolean;
}

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
}

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  children: React.ReactNode;
}

interface FormErrorProps {
  children: React.ReactNode;
  className?: string;
}

export function FormField({ children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {children}
    </div>
  );
}

export function FormLabel({ children, required, className, ...props }: FormLabelProps) {
  return (
    <label 
      className={cn("block text-sm font-medium text-gray-700", className)} 
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

export function FormInput({ icon, error, className, ...props }: FormInputProps) {
  const baseClasses = cn(
    "w-full px-3 py-2 border border-gray-300 rounded-lg",
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
    "disabled:bg-gray-50 disabled:text-gray-500",
    "transition-colors",
    {
      "border-red-300 focus:ring-red-500": error,
      "pl-10": icon,
    },
    className
  );

  if (icon) {
    return (
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          {icon}
        </div>
        <input className={baseClasses} {...props} />
      </div>
    );
  }

  return <input className={baseClasses} {...props} />;
}

export function FormTextarea({ error, className, ...props }: FormTextareaProps) {
  return (
    <textarea
      className={cn(
        "w-full px-3 py-2 border border-gray-300 rounded-lg",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
        "disabled:bg-gray-50 disabled:text-gray-500",
        "transition-colors resize-vertical",
        {
          "border-red-300 focus:ring-red-500": error,
        },
        className
      )}
      {...props}
    />
  );
}

export function FormSelect({ error, children, className, ...props }: FormSelectProps) {
  return (
    <select
      className={cn(
        "w-full px-3 py-2 border border-gray-300 rounded-lg",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
        "disabled:bg-gray-50 disabled:text-gray-500",
        "transition-colors",
        {
          "border-red-300 focus:ring-red-500": error,
        },
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function FormError({ children, className }: FormErrorProps) {
  return (
    <p className={cn("text-sm text-red-600", className)}>
      {children}
    </p>
  );
}