import React, { useState } from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';

interface Props {
  title: React.ReactNode;
  defaultOpen?: boolean;
  children?: React.ReactNode;
}

export const Collapsible: React.FC<Props> = ({ title, defaultOpen = true, children }) => {
  const [open, setOpen] = useState<boolean>(defaultOpen);

  return (
    <CollapsiblePrimitive.Root open={open} onOpenChange={setOpen}>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <CollapsiblePrimitive.Trigger className="w-full text-left px-4 py-2 bg-gray-50 flex justify-between items-center">
          <div className="font-medium flex items-center gap-3">{title}</div>
          <div className={`transform transition-transform duration-200 ${open ? 'rotate-90' : 'rotate-0'}`} aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </CollapsiblePrimitive.Trigger>
        <CollapsiblePrimitive.Content className="p-4 bg-white">
          {children}
        </CollapsiblePrimitive.Content>
      </div>
    </CollapsiblePrimitive.Root>
  );
};

export default Collapsible;
