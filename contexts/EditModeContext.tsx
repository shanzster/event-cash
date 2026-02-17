'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface EditModeContextType {
  isEditMode: boolean;
  setIsEditMode: (value: boolean) => void;
  editingContent: { [key: string]: string };
  setEditingContent: (key: string, value: string) => void;
  hasChanges: boolean;
  setHasChanges: (value: boolean) => void;
}

const EditModeContext = createContext<EditModeContextType | undefined>(undefined);

export function EditModeProvider({ children }: { children: ReactNode }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingContent, setEditingContentState] = useState<{ [key: string]: string }>({});
  const [hasChanges, setHasChanges] = useState(false);

  const setEditingContent = (key: string, value: string) => {
    setEditingContentState(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  return (
    <EditModeContext.Provider
      value={{
        isEditMode,
        setIsEditMode,
        editingContent,
        setEditingContent,
        hasChanges,
        setHasChanges,
      }}
    >
      {children}
    </EditModeContext.Provider>
  );
}

export function useEditMode() {
  const context = useContext(EditModeContext);
  if (context === undefined) {
    throw new Error('useEditMode must be used within an EditModeProvider');
  }
  return context;
}
