import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

/** Floating action button for quick add — bottom-right, always reachable. */
export function FAB({ onClick, label = 'Quick add' }: { onClick: () => void; label?: string }) {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      onClick={onClick}
      className="fixed bottom-5 right-5 z-40 flex h-13 w-13 items-center justify-center rounded-2xl bg-accent p-3.5 text-accent-fg shadow-pop hover:opacity-90"
      aria-label={label}
      title={label}
    >
      <Plus size={22} />
    </motion.button>
  );
}
