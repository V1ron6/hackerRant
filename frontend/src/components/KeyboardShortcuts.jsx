/**
 * KeyboardShortcuts Component - Provides keyboard shortcuts help and command palette
 */

import { useState, useEffect } from 'react';
import { Command, X } from 'lucide-react';

export const useKeyboardShortcuts = () => {
  const [showHelp, setShowHelp] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K for command palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(!showSearch);
      }
      // Cmd/Ctrl + ? for help
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '?') {
        e.preventDefault();
        setShowHelp(!showHelp);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showHelp, showSearch]);

  return { showHelp, setShowHelp, showSearch, setShowSearch };
};

export const KeyboardShortcutsHelp = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { keys: 'Cmd/Ctrl + K', action: 'Open command palette' },
    { keys: 'Cmd/Ctrl + ?', action: 'Show keyboard shortcuts' },
    { keys: 'Esc', action: 'Close modal' },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold">Keyboard Shortcuts</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>
          <div className="p-6 space-y-3">
            {shortcuts.map((shortcut, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">{shortcut.action}</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                  {shortcut.keys}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export const CommandPalette = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-start justify-center z-50 p-4 pt-20">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Command size={20} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search commands, pages, users..."
                className="flex-1 bg-transparent outline-none text-lg"
                autoFocus
              />
            </div>
          </div>
          <div className="p-4 text-center text-gray-500 py-8">
            Start typing to search...
          </div>
        </div>
      </div>
    </>
  );
};
