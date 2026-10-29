import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getConversations, getAllUsers } from '../api/chatApi';
import Avatar from '../components/Avatar';
import { COLORS, SHADOWS, RADIUS } from '../constants/theme';

export default function ChatListScreen({ navigation }) {
  const { serverUrl, username, password, currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'DM' | 'GROUP'
  const [error, setError] = useState(null);

  const fetchChatList = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const [convData, usersData] = await Promise.all([
        getConversations(serverUrl, username, password),
        getAllUsers(serverUrl, username, password).catch(() => []),
      ]);

      const map = {};
      if (Array.isArray(usersData)) {
        usersData.forEach((u) => {
          map[u.id] = u;
        });
      }
      setUsersMap(map);

      // Backend returns Array of ConversationResponseDto
      setConversations(Array.isArray(convData) ? convData : []);
    } catch (err) {
      console.warn('Error loading conversations:', err.message);
      setError(err.message || 'Failed to fetch conversations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [serverUrl, username, password]);

  useEffect(() => {
    fetchChatList();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchChatList(true);
    });
    return unsubscribe;
  }, [navigation, fetchChatList]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchChatList(true);
  };

  const getConversationTitle = (c) => {
    if (c.name && c.name.trim().length > 0) {
      return c.name;
    }
    const isGroup = c.type === 'GROUP';
    if (isGroup) {
      return `Group (${c.participants_ids?.length || 0} members)`;
    }

    // For DM without a name, resolve other participant's name
    const otherId = (c.participants_ids || []).find((id) => id !== currentUser?.id);
    if (otherId && usersMap[otherId]?.name) {
      return usersMap[otherId].name;
    }
    return 'Direct Message';
  };

  const filteredConversations = conversations.filter((c) => {
    const matchesFilter =
      filterType === 'ALL' ||
      (filterType === 'DM' && (c.type === 'DM' || !c.type)) ||
      (filterType === 'GROUP' && c.type === 'GROUP');

    const title = getConversationTitle(c);
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  const renderConversationItem = ({ item }) => {
    const isGroup = item.type === 'GROUP';
    const title = getConversationTitle(item);
    const participantCount = item.participants_ids?.length || 2;
    const convId = item.id || item.conversationId || item._id;

    return (
      <TouchableOpacity
        style={styles.chatCard}
        onPress={() =>
          navigation.navigate('Conversation', {
            conversationId: convId,
            title,
            type: item.type || (isGroup ? 'GROUP' : 'DM'),
            participants_ids: item.participants_ids || [],
          })
        }
        activeOpacity={0.7}
      >
        <Avatar name={title} size="md" isGroup={isGroup} showOnline={!isGroup} />

        <View style={styles.cardContent}>
          <View style={styles.topRow}>
            <Text style={styles.chatTitle} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.timestamp}>{formatTime(item.createdAt)}</Text>
          </View>

          <View style={styles.bottomRow}>
            <View style={styles.snippetContainer}>
              {isGroup && (
                <View style={styles.groupBadge}>
                  <Text style={styles.groupBadgeText}>GROUP • {participantCount}</Text>
                </View>
              )}
              <Text style={styles.lastMessage} numberOfLines={1}>
                Tap to open chat
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.headerGreeting}>Connected as @{username}</Text>
            <Text style={styles.headerTitle}>Conversations</Text>
          </View>
          <TouchableOpacity
            style={styles.newChatBtn}
            onPress={() => navigation.navigate('NewConversation')}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={19} color="#ffffff" />
            <Text style={styles.newChatBtnText}>New</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <View style={styles.pillRow}>
          {[
            { id: 'ALL', label: 'All' },
            { id: 'DM', label: 'Direct Messages' },
            { id: 'GROUP', label: 'Groups' },
          ].map((pill) => (
            <TouchableOpacity
              key={pill.id}
              style={[
                styles.pill,
                filterType === pill.id && styles.pillActive,
              ]}
              onPress={() => setFilterType(pill.id)}
            >
              <Text
                style={[
                  styles.pillText,
                  filterType === pill.id && styles.pillTextActive,
                ]}
              >
                {pill.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Fetching conversations from backend...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color={COLORS.danger} />
          <Text style={styles.errorTitle}>Could not load conversations</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchChatList()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id || item._id}
          renderItem={renderConversationItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="chatbubbles-outline" size={40} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'No results match your search.'
                  : 'Start a direct message or group chat to begin messaging!'}
              </Text>
              <TouchableOpacity
                style={styles.startChatBtn}
                onPress={() => navigation.navigate('NewConversation')}
              >
                <Ionicons name="add" size={18} color="#ffffff" />
                <Text style={styles.startChatBtnText}>Start New Chat</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NewConversation')}
        activeOpacity={0.85}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.surface,
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerGreeting: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  newChatBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  pillTextActive: {
    color: COLORS.primary,
  },
  listContent: {
    padding: 12,
    paddingBottom: 90,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: RADIUS.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    gap: 12,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  snippetContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupBadge: {
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  groupBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  lastMessage: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 12,
  },
  errorSubtitle: {
    fontSize: 13,
    color: COLORS.danger,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  startChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  startChatBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },
});
