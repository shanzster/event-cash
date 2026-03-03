'use client';

import { useState } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { additionalFoodItems, additionalServices } from '@/lib/packages';

export default function SeedAddonsPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const seedAddons = async () => {
    setLoading(true);
    setMessage('Seeding add-ons...');

    try {
      const addOnsRef = collection(db, 'addOns');

      // Seed food items
      for (const item of additionalFoodItems) {
        await addDoc(addOnsRef, {
          name: item.name,
          description: `Delicious ${item.name.toLowerCase()} for your event`,
          price: item.price,
          category: item.category,
          available: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Seed service items
      for (const service of additionalServices) {
        await addDoc(addOnsRef, {
          name: service.name,
          description: `${service.name} - ${service.unit}`,
          price: service.pricePerUnit,
          category: 'service',
          available: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      setMessage(`Successfully seeded ${additionalFoodItems.length + additionalServices.length} add-ons!`);
    } catch (error) {
      console.error('Error seeding add-ons:', error);
      setMessage('Error seeding add-ons. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const clearAddons = async () => {
    if (!confirm('Are you sure you want to delete ALL add-ons from Firestore?')) return;

    setLoading(true);
    setMessage('Clearing add-ons...');

    try {
      const addOnsRef = collection(db, 'addOns');
      const snapshot = await getDocs(addOnsRef);
      
      for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, 'addOns', docSnap.id));
      }

      setMessage(`Successfully deleted ${snapshot.docs.length} add-ons!`);
    } catch (error) {
      console.error('Error clearing add-ons:', error);
      setMessage('Error clearing add-ons. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Seed Add-ons to Firestore</h1>
          <p className="text-gray-600 mb-8">
            This utility will migrate the hardcoded add-ons from lib/packages.ts to your Firestore database.
          </p>

          <div className="space-y-4">
            <button
              onClick={seedAddons}
              disabled={loading}
              className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Seed Add-ons to Firestore'}
            </button>

            <button
              onClick={clearAddons}
              disabled={loading}
              className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Clear All Add-ons'}
            </button>
          </div>

          {message && (
            <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <p className="text-blue-900 font-semibold">{message}</p>
            </div>
          )}

          <div className="mt-8 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
            <h3 className="font-bold text-yellow-900 mb-2">⚠️ Important Notes:</h3>
            <ul className="text-yellow-800 text-sm space-y-1 list-disc list-inside">
              <li>This will add {additionalFoodItems.length} food items</li>
              <li>This will add {additionalServices.length} service items</li>
              <li>Total: {additionalFoodItems.length + additionalServices.length} add-ons</li>
              <li>Use "Clear All Add-ons" first if you want to re-seed</li>
              <li>After seeding, manage add-ons in Content Management</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
