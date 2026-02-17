'use client';

import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, X, Edit3 } from 'lucide-react';

interface EditableContentProps {
  contentKey: string; // Unique identifier for this content (e.g., "home.hero.title")
  defaultValue: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  className?: string;
  children?: React.ReactNode;
}

export default function EditableContent({
  contentKey,
  defaultValue,
  as: Component = 'p',
  className = '',
  children,
}: EditableContentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(defaultValue);
  const [isCMSMode, setIsCMSMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Check if we're in CMS mode
    const urlParams = new URLSearchParams(window.location.search);
    setIsCMSMode(urlParams.get('cms') === 'true');

    // Fetch content from Firestore
    fetchContent();
  }, [contentKey]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const fetchContent = async () => {
    try {
      const docRef = doc(db, 'cms', 'content');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const value = getNestedValue(data, contentKey);
        if (value) {
          setContent(value);
        }
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    }
  };

  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const setNestedValue = (obj: any, path: string, value: string) => {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const docRef = doc(db, 'cms', 'content');
      const docSnap = await getDoc(docRef);
      
      let data = docSnap.exists() ? docSnap.data() : {};
      setNestedValue(data, contentKey, content);

      await setDoc(docRef, data, { merge: true });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Failed to save content');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    fetchContent(); // Reset to saved value
    setIsEditing(false);
  };

  if (!isCMSMode) {
    // Normal mode - just render the content
    return <Component className={className}>{children || content}</Component>;
  }

  // CMS mode - make it editable
  return (
    <div className="relative group">
      {!isEditing ? (
        <Component
          className={`${className} cursor-pointer transition-all hover:bg-yellow-100 hover:outline hover:outline-2 hover:outline-primary hover:outline-offset-2 rounded`}
          onClick={() => setIsEditing(true)}
        >
          {children || content}
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute -top-8 left-0 bg-primary text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 shadow-lg"
          >
            <Edit3 size={12} />
            Click to edit
          </motion.div>
        </Component>
      ) : (
        <div className="relative">
          <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-3 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 font-inherit resize-none"
            rows={Math.max(3, content.split('\n').length)}
            style={{ fontSize: 'inherit', lineHeight: 'inherit' }}
          />
          <div className="flex gap-2 mt-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCancel}
              className="flex items-center gap-1 px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700"
            >
              <X size={16} />
              Cancel
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
