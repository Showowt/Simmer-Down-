'use client'

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center font-semibold transition-colors',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
      'disabled:cursor-not-allowed disabled:opacity-50'
    )

    const variants = {
      primary: 'bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700',
      secondary: 'bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700 active:bg-zinc-600',
      ghost: 'bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-800',
      danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
    }

    const sizes = {
      sm: 'min-h-[40px] px-4 py-2 text-sm gap-2',
      md: 'min-h-[48px] px-6 py-3 text-base gap-2',
      lg: 'min-h-[56px] px-8 py-4 text-lg gap-3', // WCAG touch target
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="w-5 h-5 border-2 border-current/30 border-t-current animate-spin" />
            <span>Cargando...</span>
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
            <span>{children}</span>
            {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
