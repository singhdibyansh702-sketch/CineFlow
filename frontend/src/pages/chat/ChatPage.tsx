import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { DirectMessage, ChatUserConversation } from '../../types';
import {
  MessageSquare,
  Send,
  Users,
  Film,
  ShieldCheck,
  Building2,
  CheckCircle,
  Search,
  User,
} from 'lucide-react';

export function ChatPage() {
  const { user } = useAuth();
  const { addToast } = useNotifications();
  const role = user?.role;

  // Admin state
  const [activeTab, setActiveTab] = useState<'CLIENTS' | 'EDITORS'>('CLIENTS');
  const [conversations, setConversations] = useState<{
    clientChats: ChatUserConversation[];
    editorChats: ChatUserConversation[];
  }>({ clientChats: [], editorChats: [] });
  const [selectedUser, setSelectedUser] = useState<ChatUserConversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Messages state
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of message thread
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Fetch conversations for Admin
  const fetchConversations = async () => {
    if (role !== 'ADMIN') return;
    try {
      const res = await api.get('/chat/conversations');
      setConversations({
        clientChats: res.clientChats || [],
        editorChats: res.editorChats || [],
      });

      // Auto-select first user if none selected
      if (!selectedUser) {
        if (res.clientChats?.length > 0) {
          setSelectedUser(res.clientChats[0]);
        } else if (res.editorChats?.length > 0) {
          setSelectedUser(res.editorChats[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 2. Fetch messages for active conversation
  const fetchMessages = async (targetId?: string) => {
    try {
      const idToFetch = role === 'ADMIN' ? (targetId || selectedUser?.id) : 'admin';
      if (!idToFetch && role === 'ADMIN') return;

      const res = await api.get(`/chat/messages/${idToFetch}`);
      setMessages(res.messages || []);
      setContactInfo(res.contact || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (role === 'ADMIN') {
      fetchConversations().then(() => setLoading(false));
    } else {
      fetchMessages();
    }
  }, [role]);

  // When admin selects a user
  useEffect(() => {
    if (role === 'ADMIN' && selectedUser) {
      fetchMessages(selectedUser.id);
    }
  }, [selectedUser]);

  // Auto-poll messages every 3 seconds for live chat experience
  useEffect(() => {
    const interval = setInterval(() => {
      if (role === 'ADMIN') {
        if (selectedUser) fetchMessages(selectedUser.id);
        fetchConversations();
      } else {
        fetchMessages();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [role, selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setSending(true);
    const content = messageText.trim();
    setMessageText('');

    try {
      await api.post('/chat/messages', {
        receiverId: role === 'ADMIN' ? selectedUser?.id : undefined,
        content,
      });

      // Immediate refresh
      if (role === 'ADMIN' && selectedUser) {
        await fetchMessages(selectedUser.id);
        fetchConversations();
      } else {
        await fetchMessages();
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  // Filter conversations for admin
  const currentList = activeTab === 'CLIENTS' ? conversations.clientChats : conversations.editorChats;
  const filteredConversations = currentList.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.clientProfile?.companyName && c.clientProfile.companyName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-card-foreground">
            {role === 'ADMIN' ? 'Unified Agency Chat' : 'Chat with Agency Management'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {role === 'ADMIN'
              ? 'Real-time isolated communication with Clients and Editors. Client and Editor directories remain 100% segregated.'
              : 'Direct communication with CineFlow Agency management and creative directors.'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="font-semibold">Privacy Intermediated</span>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="flex-1 min-h-0 border border-border rounded-3xl bg-card shadow-sm overflow-hidden flex">
        {/* ADMIN VIEW: LEFT SIDEBAR WITH CLIENTS & EDITORS LIST */}
        {role === 'ADMIN' && (
          <div className="w-80 sm:w-96 border-r border-border flex flex-col bg-secondary/20">
            {/* Tabs for Clients and Editors */}
            <div className="p-3 border-b border-border space-y-3">
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-secondary rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('CLIENTS');
                    const first = conversations.clientChats[0];
                    if (first) setSelectedUser(first);
                  }}
                  className={`py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'CLIENTS'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Clients ({conversations.clientChats.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('EDITORS');
                    const first = conversations.editorChats[0];
                    if (first) setSelectedUser(first);
                  }}
                  className={`py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'EDITORS'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Editors ({conversations.editorChats.length})</span>
                </button>
              </div>

              {/* Search bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${activeTab.toLowerCase()}...`}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto divide-y divide-border">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No {activeTab.toLowerCase()} found.
                </div>
              ) : (
                filteredConversations.map((c) => {
                  const isSelected = selectedUser?.id === c.id;

                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedUser(c)}
                      className={`p-3.5 transition-colors cursor-pointer flex items-start justify-between gap-2.5 ${
                        isSelected
                          ? 'bg-primary/10 border-l-4 border-primary'
                          : 'hover:bg-secondary/40'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-card-foreground truncate">
                            {c.name}
                          </span>
                          {c.unreadCount > 0 && (
                            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                          )}
                        </div>

                        {c.clientProfile?.companyName && (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                            <Building2 className="w-3 h-3 shrink-0" />
                            <span>{c.clientProfile.companyName}</span>
                          </div>
                        )}

                        <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1">
                          {c.lastMessage || 'No messages yet'}
                        </p>
                      </div>

                      {c.lastMessageAt && (
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {new Date(c.lastMessageAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* RIGHT CHAT AREA */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Thread Header */}
          <div className="p-4 border-b border-border bg-card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shadow-sm">
                {role === 'ADMIN' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-primary" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-card-foreground">
                    {role === 'ADMIN'
                      ? selectedUser?.name || 'Select a user'
                      : 'CineFlow Agency Management (Admin)'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-card-foreground border border-border">
                    {role === 'ADMIN' ? selectedUser?.role : 'Official Support'}
                  </span>
                </div>

                <span className="text-[11px] text-muted-foreground block">
                  {role === 'ADMIN'
                    ? selectedUser?.email
                    : 'Confidential channel between you and agency directors.'}
                </span>
              </div>
            </div>
          </div>

          {/* Messages Bubble Stream */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-secondary/10">
            {loading ? (
              <LoadingSpinner text="Loading message history..." />
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2 text-muted-foreground">
                <MessageSquare className="w-8 h-8 text-muted-foreground/60" />
                <p className="text-sm font-semibold text-card-foreground">No messages yet</p>
                <p className="text-xs max-w-sm">
                  {role === 'ADMIN'
                    ? `Start a conversation with ${selectedUser?.name || 'the user'} by typing below.`
                    : 'Reach out to our agency management team regarding new project quotes, revision questions, or updates.'}
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.senderId === user?.id;

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] text-muted-foreground">
                      <span className="font-semibold">{isMe ? 'You' : m.sender?.name}</span>
                      <span>•</span>
                      <span>
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div
                      className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                        isMe
                          ? 'bg-primary text-primary-foreground rounded-br-xs'
                          : 'bg-card border border-border text-card-foreground rounded-bl-xs'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box */}
          <div className="p-3 sm:p-4 border-t border-border bg-card">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                required
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={
                  role === 'ADMIN'
                    ? `Message ${selectedUser?.name || 'user'}...`
                    : 'Type your message to Agency Management...'
                }
                className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-background text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground placeholder:text-muted-foreground"
              />

              <button
                type="submit"
                disabled={sending || !messageText.trim()}
                className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm hover:bg-primary/90 shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">{sending ? 'Sending...' : 'Send'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

