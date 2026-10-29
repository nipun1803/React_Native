import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getAllUsers, createConversation } from '../api/chatApi';
import Avatar from '../components/Avatar';
import { COLORS, SHADOWS, RADIUS } from '../constants/theme';

export default function NewConversationModal({ navigation }) {
  const { serverUrl, username, password, currentUser } = useAuth();
  const [mode, setMode] = useState('DM'); // 'DM' | 'GROUP'
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Group creation state
  const [groupName, setGroupName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      try {
        const data = await getAllUsers(serverUrl, username, password);
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn('Failed loading users:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, [serverUrl, username, password]);

  const toggleUserSelection = (userId) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleStartDM = async (targetUser) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const conv = await createConversation(serverUrl, username, password, {
        type: 'DM',
        participants_ids: [targetUser.id],
      });

      const convId = conv.id || conv.conversationId || conv._id;
      navigation.replace('Conversation', {
        conversationId: convId,
        title: targetUser.name || 'Chat',
        type: 'DM',
        participants_ids: conv.participants_ids || [targetUser.id],
      });
    } catch (err) {
      alert(`Could not create DM: ${err.message}`);
      setSubmitting(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert('Please enter a group name');
      return;
    }
    if (selectedUserIds.length === 0) {
      alert('Please select at least 1 participant');
      return;
    }

    setSubmitting(true);
    try {
      const conv = await createConversation(serverUrl, username, password, {
        type: 'GROUP',
        name: groupName.trim(),
        participants_ids: selectedUserIds,
      });

      const convId = conv.id || conv.conversationId || conv._id;
      navigation.replace('Conversation', {
        conversationId: convId,
        title: conv.name || groupName.trim(),
        type: 'GROUP',
        participants_ids: conv.participants_ids || selectedUserIds,
      });
    } catch (err) {
      alert(`Could not create group: ${err.message}`);
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (currentUser?.id && u.id === currentUser.id) return false;
    return (u.name || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Modal Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Conversation</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Mode Selector */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, mode === 'DM' && styles.segmentBtnActive]}
            onPress={() => setMode('DM')}
          >
            <Ionicons
              name="person"
              size={15}
              color={mode === 'DM' ? '#ffffff' : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.segmentText,
                mode === 'DM' && styles.segmentTextActive,
              ]}
            >
              Direct Message
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              mode === 'GROUP' && styles.segmentBtnActive,
            ]}
            onPress={() => setMode('GROUP')}
          >
            <Ionicons
              name="people"
              size={16}
              color={mode === 'GROUP' ? '#ffffff' : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.segmentText,
                mode === 'GROUP' && styles.segmentTextActive,
              ]}
            >
              New Group
            </Text>
          </TouchableOpacity>
        </View>

        {/* Group Name input if GROUP mode */}
        {mode === 'GROUP' && (
          <View style={styles.groupInputSection}>
            <Text style={styles.fieldLabel}>Group Name</Text>
            <View style={styles.groupInputWrapper}>
              <Ionicons name="pencil-outline" size={18} color={COLORS.textSecondary} />
              <TextInput
                style={styles.groupTextInput}
                placeholder="e.g. Study Circle, Project Team"
                placeholderTextColor={COLORS.textMuted}
                value={groupName}
                onChangeText={setGroupName}
              />
            </View>
            <Text style={styles.helperText}>
              Selected: {selectedUserIds.length} participant(s)
            </Text>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={17} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Filter users..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* User List */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Fetching available users...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isSelected = selectedUserIds.includes(item.id);
              return (
                <TouchableOpacity
                  style={[
                    styles.userRow,
                    isSelected && styles.userRowSelected,
                  ]}
                  onPress={() => {
                    if (mode === 'DM') {
                      handleStartDM(item);
                    } else {
                      toggleUserSelection(item.id);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Avatar name={item.name} size="md" />

                  <View style={styles.rowInfo}>
                    <Text style={styles.rowName}>{item.name}</Text>
                    <Text style={styles.rowBio} numberOfLines={1}>
                      {item.bio || 'Available to chat'}
                    </Text>
                  </View>

                  {mode === 'DM' ? (
                    <Ionicons
                      name="arrow-forward-circle-outline"
                      size={24}
                      color={COLORS.primary}
                    />
                  ) : (
                    <View
                      style={[
                        styles.checkbox,
                        isSelected && styles.checkboxActive,
                      ]}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color="#ffffff" />
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No users found.</Text>
              </View>
            }
          />
        )}

        {/* Bottom submit button for Group mode */}
        {mode === 'GROUP' && (
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[
                styles.submitGroupBtn,
                (selectedUserIds.length === 0 || !groupName.trim() || submitting) &&
                  styles.submitGroupBtnDisabled,
              ]}
              onPress={handleCreateGroup}
              disabled={
                selectedUserIds.length === 0 || !groupName.trim() || submitting
              }
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                  <Text style={styles.submitGroupBtnText}>
                    Create Group ({selectedUserIds.length})
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  segmentContainer: {
    flexDirection: 'row',
    margin: 14,
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  segmentTextActive: {
    color: '#ffffff',
  },
  groupInputSection: {
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  groupInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  groupTextInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  helperText: {
    fontSize: 11,
    color: COLORS.primary,
    marginTop: 4,
    fontWeight: '600',
  },
  searchSection: {
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    height: 38,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 80,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: RADIUS.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    ...SHADOWS.sm,
  },
  userRowSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  rowBio: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  bottomBar: {
    padding: 14,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: RADIUS.md,
    gap: 8,
    ...SHADOWS.sm,
  },
  submitGroupBtnDisabled: {
    opacity: 0.5,
  },
  submitGroupBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
