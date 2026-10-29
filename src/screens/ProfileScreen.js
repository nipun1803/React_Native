import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { COLORS, SHADOWS, RADIUS } from '../constants/theme';
import { DEFAULT_API_URL } from '../api/chatApi';

export default function ProfileScreen({ navigation }) {
  const {
    currentUser,
    username,
    password,
    serverUrl,
    setServerUrl,
    refreshProfile,
    logout,
  } = useAuth();

  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState(serverUrl || DEFAULT_API_URL);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  const handleSaveUrl = () => {
    setServerUrl(urlInput.trim());
    setIsEditingUrl(false);
    Alert.alert('Server Updated', `Connecting to ${urlInput.trim()}`);
  };

  const displayName = currentUser?.name || username || 'My Profile';
  const displayBio = currentUser?.bio || 'Building cool stuff 🚀';
  const displayId = currentUser?.id || 'Provisioning...';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Profile Hero Card */}
      <View style={styles.heroCard}>
        <Avatar name={displayName} size="xl" showOnline={true} />
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.handle}>@{username}</Text>
        <Text style={styles.bio}>{displayBio}</Text>

        <View style={styles.idBadge}>
          <Ionicons name="finger-print-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.idText} numberOfLines={1}>
            ID: {displayId}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={handleRefresh}
          disabled={refreshing}
          activeOpacity={0.7}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <>
              <Ionicons name="refresh" size={14} color={COLORS.primary} />
              <Text style={styles.refreshBtnText}>Refresh from Backend</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Backend API Connection Info */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="server-outline" size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>NestJS Backend Connection</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Status</Text>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Connected</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Authentication</Text>
          <Text style={styles.metaValue}>Basic {username}:••••••••</Text>
        </View>

        <View style={styles.urlRow}>
          <Text style={styles.metaLabel}>API Base URL</Text>
          {isEditingUrl ? (
            <View style={styles.editUrlBox}>
              <TextInput
                style={styles.urlInput}
                value={urlInput}
                onChangeText={setUrlInput}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.saveUrlBtn} onPress={handleSaveUrl}>
                <Text style={styles.saveUrlText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.urlDisplayRow}>
              <Text style={styles.urlText}>{serverUrl}</Text>
              <TouchableOpacity onPress={() => setIsEditingUrl(true)}>
                <Ionicons name="pencil" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Logout button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={19} color={COLORS.danger} />
        <Text style={styles.logoutText}>Log Out / Disconnect</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingTop: 54,
    paddingBottom: 40,
  },
  heroCard: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    ...SHADOWS.md,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 12,
  },
  handle: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  bio: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
    lineHeight: 19,
  },
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 12,
    gap: 6,
    maxWidth: '90%',
  },
  idText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    gap: 6,
  },
  refreshBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    ...SHADOWS.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  metaLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.online,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
  },
  urlRow: {
    marginTop: 8,
    paddingTop: 4,
  },
  urlDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    backgroundColor: COLORS.surfaceSubtle,
    padding: 8,
    borderRadius: RADIUS.sm,
  },
  urlText: {
    fontSize: 12,
    color: COLORS.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  editUrlBox: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 8,
  },
  urlInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    height: 38,
    fontSize: 13,
  },
  saveUrlBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  saveUrlText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    height: 48,
    borderRadius: RADIUS.md,
    gap: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
    marginTop: 10,
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: 15,
    fontWeight: '700',
  },
});
