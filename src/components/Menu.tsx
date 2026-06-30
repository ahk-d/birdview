import { Menu as HMenu, Transition } from '@headlessui/react';
import { Fragment, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
}

/** Lightweight contextual menu (kebab / overflow actions). */
export function Menu({ trigger, items }: { trigger: ReactNode; items: (MenuItem | 'divider')[] }) {
  return (
    <HMenu as="div" className="relative inline-block text-left">
      <HMenu.Button as={Fragment}>{trigger}</HMenu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <HMenu.Items className="absolute right-0 z-30 mt-1 w-48 origin-top-right overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-pop focus:outline-none">
          {items.map((item, i) =>
            item === 'divider' ? (
              <div key={i} className="my-1 h-px bg-border" />
            ) : (
              <HMenu.Item key={i}>
                {({ active }) => (
                  <button
                    onClick={item.onClick}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm',
                      active && 'bg-surface-2',
                      item.danger ? 'text-danger' : 'text-fg',
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                )}
              </HMenu.Item>
            ),
          )}
        </HMenu.Items>
      </Transition>
    </HMenu>
  );
}
