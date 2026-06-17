export interface SystemShortcut {
  keys: string;
  name: string;
  description: string;
}

const systemShortcuts: SystemShortcut[] = [
  { keys: 'Ctrl+C', name: 'Ctrl+C', description: 'Copy' },
  { keys: 'Ctrl+V', name: 'Ctrl+V', description: 'Paste' },
  { keys: 'Ctrl+X', name: 'Ctrl+X', description: 'Cut' },
  { keys: 'Ctrl+A', name: 'Ctrl+A', description: 'Select all' },
  { keys: 'Ctrl+S', name: 'Ctrl+S', description: 'Save' },
  { keys: 'Ctrl+F', name: 'Ctrl+F', description: 'Find' },
  { keys: 'Ctrl+Z', name: 'Ctrl+Z', description: 'Undo' },
  { keys: 'Ctrl+Y', name: 'Ctrl+Y', description: 'Redo' },
  { keys: 'Ctrl+W', name: 'Ctrl+W', description: 'Close tab' },
  { keys: 'Ctrl+N', name: 'Ctrl+N', description: 'New window' },
  { keys: 'Alt+F4', name: 'Alt+F4', description: 'Close program' },
  { keys: 'Alt+Tab', name: 'Alt+Tab', description: 'Switch window' },
  { keys: 'F5', name: 'F5', description: 'Refresh' },
  { keys: 'F11', name: 'F11', description: 'Fullscreen' },
  { keys: 'F12', name: 'F12', description: 'Developer tools' },
];

// Also check conflicts with other registered app shortcuts
export function checkConflict(
  shortcut: string,
  currentAction?: string,
  otherShortcuts?: Record<string, string>,
): SystemShortcut[] {
  const conflicts: SystemShortcut[] = [];
  const normalized = shortcut.toLowerCase();

  // Check system shortcuts
  for (const sys of systemShortcuts) {
    if (sys.keys.toLowerCase() === normalized) {
      conflicts.push(sys);
    }
  }

  // Check other app shortcuts
  if (otherShortcuts && currentAction) {
    for (const [action, keys] of Object.entries(otherShortcuts)) {
      if (action !== currentAction && keys.toLowerCase() === normalized) {
        conflicts.push({
          keys,
          name: action,
          description: 'Another app shortcut',
        });
      }
    }
  }

  return conflicts;
}

export function parseShortcut(shortcut: string): {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  key: string;
} {
  const parts = shortcut.split('+').map(p => p.trim());
  const lower = parts.map(p => p.toLowerCase());
  return {
    ctrl: lower.includes('ctrl'),
    shift: lower.includes('shift'),
    alt: lower.includes('alt'),
    key: parts[parts.length - 1],
  };
}
