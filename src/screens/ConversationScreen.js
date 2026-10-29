import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getMessages, sendMessageApi, getAllUsers } from '../api/chatApi';
import MessageBubble from '../components/MessageBubble';
import ChatInput from '../components/ChatInput';
import Avatar from '../components/Avatar';
import { COLORS, SHADOWS, RADIUS } from '../constants/theme';

export default function ConversationScreen({ route, navigation }) {
  const { conversationId, title = 'Chat', type = 'DM', participants_ids = [] } =
    route.params || {};

  const { serverUrl, username, password, currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const flatListRef = useRef(null);
  const isGroup = type === 'GROUP';

  // Load user directory for resolving sender names
  useEffect(() => {
    async function loadDirectory() {
      try {
        const users = await getAllUsers(serverUrl, username, password);
        const map = {};
        if (Array.isArray(users)) {
          users.forEach((u) => {
            map[u.id] = u;
          });
        }
        setUsersMap(map);
      } catch (e) {
        // Silent directory load error
      }
    }
    loadDirectory();
  }, [serverUrl, username, password]);

  // 1. Initial load messages
  const loadInitialMessages = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getMessages(serverUrl, username, password, conversationId);
      // Response: { data: MessageResponseDto[], nextCursor, count }
      const fetched = Array.isArray(res?.data) ? res.data : [];
      const sorted = [...fetched].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      setMessages(sorted);
      setNextCursor(res?.nextCursor || null);
    } catch (err) {
      console.warn('Failed loading messages:', err.message);
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [conversationId, serverUrl, username, password]);

  // 2. Poll for new messages periodically (every 4 seconds)
  const pollNewMessages = useCallback(async () => {
    if (!conversationId || sending) return;
    try {
      const res = await getMessages(serverUrl, username, password, conversationId);
      const latest = Array.isArray(res?.data) ? res.data : [];
      if (latest.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newOnes = latest.filter((m) => !existingIds.has(m.id));
          if (newOnes.length === 0) return prev;
          const merged = [...prev, ...newOnes];
          return merged.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        });
      }
    } catch (e) {
      // Background poll failure is silent
    }
  }, [conversationId, serverUrl, username, password, sending]);

  useEffect(() => {
    loadInitialMessages();
    const interval = setInterval(pollNewMessages, 4000);
    return () => clearInterval(interval);
  }, [loadInitialMessages, pollNewMessages]);

  // 3. Load older messages via nextCursor pagination
  const handleLoadOlder = async () => {
    if (!nextCursor || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const res = await getMessages(
        serverUrl,
        username,
        password,
        conversationId,
        nextCursor
      );
      const older = Array.isArray(res?.data) ? res.data : [];
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newOlder = older.filter((m) => !existingIds.has(m.id));
        const merged = [...newOlder, ...prev];
        return merged.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      });
      setNextCursor(res?.nextCursor || null);
    } catch (err) {
      console.warn('Failed loading older messages:', err.message);
    } finally {
      setLoadingOlder(false);
    }
  };

  // 4. Send message (POST /message)
  const handleSendMessage = async (text) => {
    if (!text.trim() || sending) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      content: text,
      createdAt: new Date().toISOString(),
      senderId: currentUser?.id || 'me',
      conversationId,
      status: {},
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setSending(true);

    try {
      const res = await sendMessageApi(
        serverUrl,
        username,
        password,
        conversationId,
        text
      );
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? res : m))
      );
    } catch (err) {
      console.warn('Error sending message:', err.message);
      alert(`Send failed: ${err.message}`);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const getSenderDisplayName = (senderId) => {
    if (!senderId) return 'User';
    if (senderId === currentUser?.id) return 'You';
    if (usersMap[senderId]?.name) {
      return usersMap[senderId].name;
    }
    return `User ${senderId.slice(-4)}`;
  };

  const renderHeader = () => {
    if (!nextCursor) return null;
    return (
      <View style={styles.loadOlderContainer}>
        <TouchableOpacity
          style={styles.loadOlderBtn}
          onPress={handleLoadOlder}
          disabled={loadingOlder}
        >
          {loadingOlder ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <>
              <Ionicons name="time-outline" size={15} color={COLORS.primary} />
              <Text style={styles.loadOlderText}>Load older messages</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>

          <Avatar name={title} size="sm" isGroup={isGroup} />

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {isGroup
                ? `${participants_ids.length || 'Group'} participants`
                : 'Direct Message'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={loadInitialMessages}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Message list or loading/error states */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Fetching messages from backend...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={44} color={COLORS.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadInitialMessages}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={renderHeader}
            renderItem={({ item }) => {
              const isOutgoing =
                item.senderId === currentUser?.id ||
                item.senderId === 'me' ||
                item.senderId === username;
              return (
                <MessageBubble
                  content={item.content}
                  createdAt={item.createdAt}
                  isOutgoing={isOutgoing}
                  senderName={isGroup ? getSenderDisplayName(item.senderId) : undefined}
                  isGroup={isGroup}
                  status={item.status}
                  currentUserId={currentUser?.id}
                />
              );
            }}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="chatbubble-outline"
                  size={42}
                  color={COLORS.textMuted}
                />
                <Text style={styles.emptyTitle}>No messages yet</Text>
                <Text style={styles.emptySubtitle}>
                  Type a message below to start the conversation!
                </Text>
              </View>
            }
          />
        )}

        {/* Bottom Input */}
        <ChatInput onSend={handleSendMessage} isSending={sending} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 10,
  },
  backBtn: {
    padding: 6,
    marginLeft: -4,
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  headerActionBtn: {
    padding: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceSubtle,
  },
  messageList: {
    paddingVertical: 12,
    flexGrow: 1,
  },
  loadOlderContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  loadOlderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
    ...SHADOWS.sm,
  },
  loadOlderText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 12,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});
