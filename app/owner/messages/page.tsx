'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useManager } from '@/contexts/ManagerContext';
import ManagerSidebar from '@/components/ManagerSidebar';
import { motion } from 'framer-motion';
import { Mail, MailOpen, Trash2, Search, Phone, User, Clock } from 'lucide-react';
import { collection, getDocs, orderBy, query, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';

interface Message {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: 'unread' | 'read';
  createdAt: any;
}

export default function MessagesPage() {
  const router = useRouter();
  const { managerUser, loading, isManager } = useManager();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    if (!loading && (!managerUser || !isManager)) {
      router.push('/owner/login');
    }
  }, [managerUser, loading, isManager, router]);

  useEffect(() => {
    if (managerUser) fetchMessages();
  }, [managerUser]);

  const fetchMessages = async () => {
    try {
      const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Message[]);
    } catch (e) {
      console.error('Error fetching messages:', e);
    } finally {
      setLoadingMessages(false);
    }
  };

  const markAsRead = async (msg: Message) => {
    if (msg.status === 'unread') {
      await updateDoc(doc(db, 'messages', msg.id), { status: 'read' });
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'read' } : m));
    }
    setSelectedMessage({ ...msg, status: 'read' });
  };

  const deleteMessage = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    await deleteDoc(doc(db, 'messages', id));
    setMessages(prev => prev.filter(m => m.id !== id));
    if (selectedMessage?.id === id) setSelectedMessage(null);
  };

  const filtered = messages.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filter === 'all' || m.status === filter;
    return matchSearch && matchFilter;
  });

  const unreadCount = messages.filter(m => m.status === 'unread').length;

  const getDate = (ts: any) => {
    if (!ts) return '';
    try {
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      return format(d, 'MMM dd, yyyy hh:mm a');
    } catch { return ''; }
  };

  if (loading || loadingMessages) {
    return (
      <ManagerSidebar>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary" />
        </div>
      </ManagerSidebar>
    );
  }

  return (
    <ManagerSidebar>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <Mail size={36} className="text-primary" />
              Messages
              {unreadCount > 0 && (
                <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </h1>
            <p className="text-gray-600 mt-2">Customer inquiries from the contact form</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Message List */}
            <div className="lg:col-span-1 space-y-4">
              {/* Search & Filter */}
              <div className="bg-white rounded-xl shadow-lg p-4 space-y-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary text-black"
                  />
                </div>
                <div className="flex gap-2">
                  {(['all', 'unread', 'read'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                        filter === f ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="bg-white rounded-xl p-8 text-center text-gray-500 shadow-lg">
                    <Mail size={40} className="mx-auto mb-3 text-gray-300" />
                    <p>No messages found</p>
                  </div>
                ) : (
                  filtered.map(msg => (
                    <motion.div
                      key={msg.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => markAsRead(msg)}
                      className={`bg-white rounded-xl p-4 shadow cursor-pointer transition-all border-2 ${
                        selectedMessage?.id === msg.id ? 'border-primary' : 'border-transparent'
                      } ${msg.status === 'unread' ? 'border-l-4 border-l-primary' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {msg.status === 'unread'
                            ? <Mail size={16} className="text-primary flex-shrink-0" />
                            : <MailOpen size={16} className="text-gray-400 flex-shrink-0" />
                          }
                          <div className="min-w-0">
                            <p className={`text-sm truncate ${msg.status === 'unread' ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                              {msg.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{msg.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); deleteMessage(msg.id); }}
                          className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 flex-shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 mt-2 line-clamp-2">{msg.message}</p>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Clock size={10} />
                        {getDate(msg.createdAt)}
                      </p>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Message Detail */}
            <div className="lg:col-span-2">
              {selectedMessage ? (
                <motion.div
                  key={selectedMessage.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-xl shadow-lg p-6"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <User size={24} className="text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{selectedMessage.name}</h2>
                        <p className="text-sm text-gray-500">{getDate(selectedMessage.createdAt)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteMessage(selectedMessage.id)}
                      className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail size={16} className="text-primary" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <a href={`mailto:${selectedMessage.email}`} className="text-sm font-medium text-primary hover:underline">
                          {selectedMessage.email}
                        </a>
                      </div>
                    </div>
                    {selectedMessage.phone && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone size={16} className="text-primary" />
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="text-sm font-medium">{selectedMessage.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Message</h3>
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <a
                      href={`mailto:${selectedMessage.email}`}
                      className="flex-1 py-3 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-xl font-semibold text-center hover:shadow-lg transition-all"
                    >
                      Reply via Email
                    </a>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center text-gray-500">
                  <MailOpen size={64} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Select a message to view</p>
                  <p className="text-sm mt-1">Click on any message from the list</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ManagerSidebar>
  );
}
