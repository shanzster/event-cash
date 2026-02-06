'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import Navigation from '@/components/Navigation';

export default function TestFirebase() {
  const [status, setStatus] = useState<any>({});

  useEffect(() => {
    const testConfig = async () => {
      const results: any = {
        timestamp: new Date().toISOString(),
        firebase: {},
        auth: {},
        firestore: {},
      };

      // Test Firebase App
      try {
        results.firebase.initialized = !!auth.app;
        results.firebase.name = auth.app?.name;
        results.firebase.projectId = auth.app?.options?.projectId;
        results.firebase.authDomain = auth.app?.options?.authDomain;
        results.firebase.apiKey = auth.app?.options?.apiKey ? '✓ Present' : '✗ Missing';
      } catch (error: any) {
        results.firebase.error = error.message;
      }

      // Test Auth
      try {
        results.auth.initialized = !!auth;
        results.auth.currentUser = auth.currentUser?.email || 'Not logged in';
        results.auth.config = auth.config;
        results.auth.name = auth.name;
      } catch (error: any) {
        results.auth.error = error.message;
      }

      // Test Firestore
      try {
        results.firestore.initialized = !!db;
        results.firestore.type = db.type;
      } catch (error: any) {
        results.firestore.error = error.message;
      }

      setStatus(results);
    };

    testConfig();
  }, []);

  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-gray-900">Firebase Configuration Test</h1>
          
          <div className="backdrop-blur-xl bg-white/90 border-2 border-primary/30 rounded-3xl p-8 shadow-lg">
            <pre className="text-sm overflow-auto bg-gray-100 p-4 rounded-xl">
              {JSON.stringify(status, null, 2)}
            </pre>
          </div>

          <div className="mt-8 backdrop-blur-xl bg-white/90 border-2 border-primary/30 rounded-3xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Quick Checks</h2>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span className={status.firebase?.initialized ? 'text-green-600' : 'text-red-600'}>
                  {status.firebase?.initialized ? '✓' : '✗'}
                </span>
                <span>Firebase App Initialized</span>
              </li>
              <li className="flex items-center gap-2">
                <span className={status.auth?.initialized ? 'text-green-600' : 'text-red-600'}>
                  {status.auth?.initialized ? '✓' : '✗'}
                </span>
                <span>Auth Service Initialized</span>
              </li>
              <li className="flex items-center gap-2">
                <span className={status.firestore?.initialized ? 'text-green-600' : 'text-red-600'}>
                  {status.firestore?.initialized ? '✓' : '✗'}
                </span>
                <span>Firestore Initialized</span>
              </li>
              <li className="flex items-center gap-2">
                <span className={status.firebase?.projectId === 'eventcash-74a3a' ? 'text-green-600' : 'text-red-600'}>
                  {status.firebase?.projectId === 'eventcash-74a3a' ? '✓' : '✗'}
                </span>
                <span>Correct Project ID: {status.firebase?.projectId}</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 backdrop-blur-xl bg-yellow-50 border-2 border-yellow-300 rounded-3xl p-8 shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-yellow-900">If You See Errors:</h2>
            <ol className="list-decimal list-inside space-y-2 text-yellow-800">
              <li>Go to <a href="https://console.firebase.google.com/project/eventcash-74a3a/authentication/providers" target="_blank" className="text-blue-600 underline">Firebase Console</a></li>
              <li>Make sure <strong>Email/Password</strong> provider is enabled (not just "Email native")</li>
              <li>Check that your web app is registered in Project Settings</li>
              <li>Restart your dev server after making changes</li>
            </ol>
          </div>
        </div>
      </main>
    </>
  );
}
