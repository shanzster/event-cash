'use client';

import { useState, useEffect, useRef } from 'react';
import { useEditMode } from '@/contexts/EditModeContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface EditableTextProps {
  contentKey: string;
  defaultValue: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  multiline?: boolean;
}

export default function EditableText({
  contentKey,
  defaultValue,
  className = '',
  as = 'p',
  multiline = false,
}: EditableTextProps) {
  const { isEditMode, editingContent, setEditingContent } = useEditMode();
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState('');
  const [savedValue, setSavedValue] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const Component = as;

  // Fetch saved content from Firestore
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const docRef = doc(db, 'cms', 'content');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const value = contentKey.split('.').reduce((obj, key) => obj?.[key], data);
          if (value) {
            setSavedValue(value);
          }
        }
      } catch (error) {
        console.error('Error fetching content:', error);
      }
    };
    fetchContent();
  }, [contentKey]);

  // Get current display value
  const displayValue = editingContent[contentKey] || savedValue || defaultValue;

  const handleClick = () => {
    if (isEditMode && !isEditing) {
      setIsEditing(true);
      setLocalValue(displayValue);
    }
  };

  const handleSave = () => {
    setEditingContent(contentKey, localValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setLocalValue('');
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLTextAreaElement || inputRef.current instanceof HTMLInputElement) {
        const length = inputRef.current.value.length;
        inputRef.current.setSelectionRange(length, length);
      }
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <div className="relative inline-block w-full">
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            className="w-full p-3 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 resize-none"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                handleSave();
              }
              if (e.key === 'Escape') {
                handleCancel();
              }
            }}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            className="w-full p-2 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-900"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              }
              if (e.key === 'Escape') {
                handleCancel();
              }
            }}
          />
        )}
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleSave}
            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <Component
      className={`${className} ${
        isEditMode
          ? 'cursor-pointer hover:bg-yellow-100 hover:outline hover:outline-2 hover:outline-primary hover:outline-offset-2 rounded px-2 py-1 transition-all relative z-10'
          : ''
      }`}
      onClick={(e) => {
        if (isEditMode) {
          e.stopPropagation();
          handleClick();
        }
      }}
      title={isEditMode ? 'Click to edit' : undefined}
      style={isEditMode ? { pointerEvents: 'auto' } : undefined}
    >
      {displayValue}
    </Component>
  );
}
