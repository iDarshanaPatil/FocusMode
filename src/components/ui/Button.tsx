import { cn } from "../../lib/utils";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all rounded-xl disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "primary" &&
          "bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/25",
        variant === "secondary" &&
          "glass hover:bg-white/10 text-slate-200",
        variant === "ghost" && "hover:bg-white/5 text-slate-300",
        variant === "danger" &&
          "bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30",
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-5 py-2.5 text-sm",
        size === "lg" && "px-8 py-3.5 text-base",
        className
      )}
      {...props}
    />
  );
}
