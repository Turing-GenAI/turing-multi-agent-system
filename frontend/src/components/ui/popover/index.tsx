import React, { useState, useEffect } from 'react';
import { cn } from '../../../lib/utils';

interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const Popover: React.FC<PopoverProps> = ({
  open = false,
  onOpenChange,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(open);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleOpenChange = (value: boolean) => {
    setIsOpen(value);
    onOpenChange?.(value);
  };

  return (
    <PopoverContext.Provider value={{ open: isOpen, onOpenChange: handleOpenChange }}>
      {children}
    </PopoverContext.Provider>
  );
};

export const PopoverTrigger: React.FC<React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }> = ({
  children,
  asChild,
  ...props
}) => {
  const { onOpenChange } = usePopoverContext();
  
  // If asChild is true, we'll clone the children and add the onClick handler
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        // Safe access to potentially undefined onClick property
        if (children.props && typeof children.props.onClick === 'function') {
          children.props.onClick(e);
        }
        onOpenChange(true);
      },
    } as React.HTMLAttributes<HTMLElement>);
  }
  
  return (
    <div
      onClick={() => onOpenChange(true)}
      {...props}
    >
      {children}
    </div>
  );
};

export const PopoverContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  const { open, onOpenChange } = usePopoverContext();
  
  if (!open) return null;
  
  return (
    <div className="relative">
      <div
        className={cn(
          "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none animate-in zoom-in-90 bg-white",
          className
        )}
        {...props}
      >
        {children}
      </div>
      {/* Backdrop to handle clicks outside */}
      <div 
        className="fixed inset-0 z-40"
        onClick={() => onOpenChange(false)}
      />
    </div>
  );
};

// Create popover context
type PopoverContextType = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const PopoverContext = React.createContext<PopoverContextType>({
  open: false,
  onOpenChange: () => {},
});

// Hook to use popover context
const usePopoverContext = () => {
  const context = React.useContext(PopoverContext);
  if (!context) {
    throw new Error("Popover components must be used within a Popover provider");
  }
  return context;
};
