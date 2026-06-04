// Undo-popup voor laatste actie. Roep undoable() aan met label + revert-callback.
import { toast } from './toast.js';

export function undoable(label, revertFn) {
  toast(label, {
    type: 'info',
    duration: 5000,
    action: { label: 'Ongedaan', onClick: async () => { try { await revertFn(); } catch (_) {} } },
  });
}
