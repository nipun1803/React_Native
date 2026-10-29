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
import { getAllUsers, createConversation } from '../api/chatApi';
import Avatar from '../components/Avatar';
import { COLORS, SHADOWS, RADIUS } from '../constants/theme';

export default function UsersScreen({ navigation }) {
  const { serverUrl, username, password, currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [startingChatId, setStartingChatId] = useState(null);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const data = await getAllUsers(serverUrl, username, password);
      // Backend returns Array of UserResponseDto: { id, name, bio }
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Error loading users:', err.message);
      setError(err.message || 'Failed to fetch registered users.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [serverUrl, username, password]);

  useEffect(() => {
    fetchUsers();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUsers(true);
    });
    return unsubscribe;
  }, [navigation, fetchUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers(true);
  };

  const handleStartChat = async (targetUser) => {
    if (startingChatId) return;
    setStartingChatId(targetUser.id);
    try {
      // POST /conversation
      // Create or find conversation with target user
      const conv = await createConversation(serverUrl, username, password, {
        type: 'DM',
        participants_ids: [targetUser.id],
      });

      const convId = conv.id || conv.conversationId || conv._id;
      navigation.navigate('Conversation', {
        conversationId: convId,
        title: targetUser.name || 'Chat',
        type: conv.type || 'DM',
        participants_ids: conv.participants_ids || [targetUser.id],
      });
    } catch (err) {
      alert(`Could not open conversation: ${err.message}`);
    } finally {
      setStartingChatId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    // Exclude current user from the listing if id matches
    if (currentUser?.id && u.id === currentUser.id) return false;
    const nameMatch = (u.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const bioMatch = (u.bio || '').toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || bioMatch;
  });

  const renderUserItem = ({ item }) => {
    const isStarting = startingChatId === item.id;
    return (
      <View style={styles.userCard}>
        <Avatar name={item.name || 'User'} size="md" showOnline={true} />

        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.name || 'Anonymous User'}
          </Text>
          <Text style={styles.userBio} numberOfLines={2}>
            {item.bio || 'No bio provided'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.chatBtn, isStarting && styles.chatBtnDisabled]}
          onPress={() => handleStartChat(item)}
          disabled={isStarting}
          activeOpacity={0.8}
        >
          {isStarting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Ionicons name="chatbubble" size={14} color="#ffffff" />
              <Text style={styles.chatBtnText}>Chat</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.headerCategory}>Community</Text>
            <Text style={styles.headerTitle}>Discover Users</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshIconBtn}
            onPress={() => fetchUsers(false)}
          >
            <Ionicons name="sync-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or bio..."
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
      </View>

      {/* List */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading registered users from {serverUrl}...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color={COLORS.danger} />
          <Text style={styles.errorTitle}>Could not load users</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchUsers()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
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
              <Ionicons name="people-outline" size={44} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No other users found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'No users match your search keyword.'
                  : 'You are the first registered user or no other users exist yet.'}
              </Text>
            </View>
          }
        />
      )}
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
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerCategory: {
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
  refreshIconBtn: {
    padding: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceSubtle,
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
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  listContent: {
    padding: 12,
    paddingBottom: 30,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: RADIUS.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    gap: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  userBio: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    gap: 5,
    ...SHADOWS.sm,
  },
  chatBtnDisabled: {
    opacity: 0.7,
  },
  chatBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
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
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
    paddingHorizontal: 20,
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
    textAlign: 'center',
    marginTop: 4,
  },
});
