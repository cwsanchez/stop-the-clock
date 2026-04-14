import React from 'react';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';

const ToggleGroup = React.forwardRef(({ className = '', ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={`inline-flex items-center gap-0.5 rounded-lg bg-dark-900/60 p-0.5 ${className}`}
    {...props}
  />
));
ToggleGroup.displayName = 'ToggleGroup';

const ToggleGroupItem = React.forwardRef(({ className = '', ...props }, ref) => (
  <ToggleGroupPrimitive.Item
    ref={ref}
    className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-mono uppercase tracking-wider transition-all text-gray-500 hover:text-gray-300 data-[state=on]:bg-neon-cyan/10 data-[state=on]:text-neon-cyan data-[state=on]:border data-[state=on]:border-neon-cyan/20 ${className}`}
    {...props}
  />
));
ToggleGroupItem.displayName = 'ToggleGroupItem';

export { ToggleGroup, ToggleGroupItem };
