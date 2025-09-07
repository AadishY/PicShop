import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm text-white shadow-lg transition-all duration-300 hover:bg-gray-800/80 hover:shadow-indigo-500/20 hover:-translate-y-1 ${className || ''}`}
    {...props}
  />
));
Card.displayName = "Card";


// -- BUTTON COMPONENT --

const buttonVariants = {
  variant: {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500",
    secondary: "bg-gray-700 text-gray-100 hover:bg-gray-600 focus-visible:ring-gray-500",
    ghost: "bg-transparent text-gray-300 hover:bg-gray-700/50 hover:text-white focus-visible:ring-gray-500",
    icon: "bg-gray-700 text-gray-100 hover:bg-gray-600 focus-visible:ring-gray-500 rounded-full",
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
    
    const combinedClassName = `inline-flex items-center justify-center font-semibold tracking-wide transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed
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