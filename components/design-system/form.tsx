import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";
import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <Label htmlFor={htmlFor} className="text-sm">
          {label}
          {required ? <span className="text-destructive ml-0.5">*</span> : null}
        </Label>
      ) : null}
      {children}
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
      {!error && hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
    </div>
  );
}

export { Input as FormInput } from "@/components/ui/input";
export { Textarea as FormTextarea } from "@/components/ui/textarea";

type FormSelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function FormSelect({ className, children, ...props }: FormSelectProps) {
  return (
    <select
      className={cn(
        "border-input bg-background flex h-10 w-full rounded-[var(--radius-md)] border px-3 text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/30 focus-visible:ring-2 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-45 sm:h-11 sm:px-4",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

type FormCheckboxProps = InputHTMLAttributes<HTMLInputElement> & { label: string };

export function FormCheckbox({ label, className, id, ...props }: FormCheckboxProps) {
  const inputId = id ?? props.name;

  return (
    <label htmlFor={inputId} className={cn("flex cursor-pointer items-start gap-2.5", className)}>
      <input
        id={inputId}
        type="checkbox"
        className="border-input accent-primary mt-0.5 size-4 shrink-0 rounded-[var(--radius-xs)] border"
        {...props}
      />
      <span className="text-sm leading-snug">{label}</span>
    </label>
  );
}
