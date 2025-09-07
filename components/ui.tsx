import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-lg transition-all duration-300 hover:bg-white/10 hover:border-white/20 ${className || ''}`}
    {...props}
  />
));
Card.displayName = "Card";


// -- BUTTON COMPONENT --

const buttonVariants = {
  variant: {
    primary: "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90 active:scale-[0.98] focus-visible:ring-indigo-400",
    secondary: "bg-white/10 text-gray-100 hover:bg-white/20 active:scale-[0.98] focus-visible:ring-white/20",
    ghost: "bg-transparent text-gray-300 hover:bg-white/10 hover:text-white active:scale-[0.98] focus-visible:ring-white/20",
    icon: "bg-white/10 text-gray-100 hover:bg-white/20 active:scale-[0.98] focus-visible:ring-white/20 rounded-full",
  },
  size: {
    sm: "h-9 px-3 rounded-md text-sm",
    md: "h-10 px-4 py-2 rounded-md",
    lg: "h-12 px-6 rounded-lg text-base",
    icon: "h-10 w-10",
  },
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants.variant;
  size?: keyof typeof buttonVariants.size;
  isLoading?: boolean;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, loadingText, children, ...props }, ref) => {
    
    const combinedClassName = `inline-flex items-center justify-center font-semibold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F19] disabled:opacity-50 disabled:cursor-not-allowed
      ${buttonVariants.variant[variant]}
      ${buttonVariants.size[size]}
      ${className || ''}
    `;

    return (
      <button ref={ref} className={combinedClassName} disabled={isLoading || props.disabled} {...props}>
        {isLoading && <LoadingSpinner className="mr-2 h-4 w-4" />}
        {isLoading ? loadingText || 'Loading...' : children}
      </button>
    );
  }
);
Button.displayName = "Button";


export { Card, Button };