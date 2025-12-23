import * as React from 'react';
import { cn } from '@/utils/cn';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    onValueChange?: (value: string) => void;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, children, onValueChange, onChange, ...props }, ref) => {
        const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
            onChange?.(e);
            onValueChange?.(e.target.value);
        };

        return (
            <div className="relative">
                <select
                    className={cn(
                        'flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                        className
                    )}
                    ref={ref}
                    onChange={handleChange}
                    {...props}
                >
                    {children}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50 pointer-events-none" />
            </div>
        );
    }
);
Select.displayName = 'Select';

// Simple wrapper components for API compatibility
interface SelectTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
}

const SelectTrigger = React.forwardRef<HTMLDivElement, SelectTriggerProps>(
    ({ className, children, ...props }, ref) => (
        <div ref={ref} className={cn('', className)} {...props}>
            {children}
        </div>
    )
);
SelectTrigger.displayName = 'SelectTrigger';

interface SelectValueProps {
    placeholder?: string;
}

const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => (
    <span className="text-muted-foreground">{placeholder}</span>
);
SelectValue.displayName = 'SelectValue';

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
    ({ className, children, ...props }, ref) => (
        <React.Fragment>{children}</React.Fragment>
    )
);
SelectContent.displayName = 'SelectContent';

interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
    children?: React.ReactNode;
}

const SelectItem = React.forwardRef<HTMLOptionElement, SelectItemProps>(
    ({ className, children, ...props }, ref) => (
        <option ref={ref} className={cn('', className)} {...props}>
            {children}
        </option>
    )
);
SelectItem.displayName = 'SelectItem';

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
