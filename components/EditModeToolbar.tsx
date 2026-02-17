'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3, Save, X, Eye, EyeOff } from 'lucide-react';
import { useEditMode } from '@/contexts/EditModeContext';
import { useManager } from '@/contexts/ManagerContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function EditModeToolbar() {
  const { managerUser, isManager } = useManager();
  const { isEditMode, setIsEditMode, editingContent, hasChanges, setHasChanges } = useEditMode();
  const [isSaving, setIsSaving] = useState(false);

  // Only show toolbar if user is a manager
  if (!isManager || !managerUser) {
    return null;
  }

  const handleToggleEditMode = () => {
    if (isEditMode && hasChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to exit edit mode?')) {
        return;
      }
    }
    setIsEditMode(!isEditMode);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // Convert flat editingContent to nested structure
      const nestedContent: any = {};
      
      Object.entries(editingContent).forEach(([key, value]) => {
        const keys = key.split('.');
        let current = nestedContent;
        
        keys.forEach((k, index) => {
          if (index === keys.length - 1) {
            current[k] = value;
          } else {
            if (!current[k]) current[k] = {};
            current = current[k];
          }
        });
      });

      const docRef = doc(db, 'cms', 'content');
      await setDoc(docRef, nestedContent, { merge: true });
      
      setHasChanges(false);
      alert('All changes saved successfully!');
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          exit={{ y: -100 }}
          className="fixed top-4 right-4 z-50 flex items-center gap-3"
        >
          {/* Edit Mode Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleEditMode}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold shadow-lg transition-all ${
              isEditMode
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gradient-to-r from-primary to-yellow-600 text-white hover:shadow-xl'
            }`}
          >
            {isEditMode ? (
              <>
                <EyeOff size={20} />
                Exit Edit Mode
              </>
            ) : (
              <>
                <Edit3 size={20} />
                Edit Website
              </>
            )}
          </motion.button>

          {/* Save Button (only show when in edit mode and has changes) */}
          {isEditMode && hasChanges && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveAll}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-bold shadow-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Save size={20} />
              {isSaving ? 'Saving...' : 'Save All Changes'}
            </motion.button>
          )}

          {/* Edit Mode Indicator */}
          {isEditMode && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-bold shadow-lg"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                EDIT MODE
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Full-width banner when in edit mode */}
      {isEditMode && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-20 left-0 right-0 z-40 bg-yellow-400 text-gray-900 py-3 px-4 shadow-lg"
        >
          <div className="max-w-7xl mx-auto text-center">
            <p className="font-bold text-lg">
              🎨 Edit Mode Active - Click on any highlighted text to edit it
            </p>
          </div>
        </motion.div>
      )}
    </>
  );
}
