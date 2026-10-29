import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';

export default function MessageBubble({
  content,
  createdAt,
  isOutgoing,
  senderName,
  isGroup = false,
  status = {},
  currentUserId,
}) {
  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  // Determine delivery/read status from the backend schema:
  // status: { [userId]: { delivered: boolean, read: boolean } }
  const getStatusIcon = () => {
    if (!status || typeof status !== 'object') return null;

    // Filter out current user's own status
    const participantStatuses = Object.entries(status).filter(
      ([uid]) => uid !== currentUserId
    );

    if (participantStatuses.length === 0) {
      return <Ionicons name="checkmark" size={14} color={COLORS.textWhite} style={styles.tick} />;
    }

    const allRead = participantStatuses.every(([, s]) => s?.read === true);
    const anyDelivered = participantStatuses.some(([, s]) => s?.delivered === true);

    if (allRead) {
      return (
        <Ionicons
          name="checkmark-done"
          size={15}
          color={COLORS.readTick}
          style={styles.tick}
        />
      );
    }

    if (anyDelivered) {
      return (
        <Ionicons
          name="checkmark-done"
          size={15}
          color="rgba(255, 255, 255, 0.75)"
          style={styles.tick}
        />
      );
    }

    return (
      <Ionicons
        name="checkmark"
        size={14}
        color="rgba(255, 255, 255, 0.7)"
        style={styles.tick}
      />
    );
  };

  return (
    <View
      style={[
        styles.row,
        isOutgoing ? styles.rowOutgoing : styles.rowIncoming,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isOutgoing ? styles.bubbleOutgoing : styles.bubbleIncoming,
        ]}
      >
        {/* Show sender name in group chats for incoming messages */}
        {!isOutgoing && isGroup && senderName ? (
          <Text style={styles.senderHeader}>{senderName}</Text>
        ) : null}

        <Text
          style={[
            styles.messageText,
            isOutgoing ? styles.textOutgoing : styles.textIncoming,
          ]}
        >
          {content}
        </Text>

        <View style={styles.metaContainer}>
          <Text
            style={[
              styles.timeText,
              isOutgoing ? styles.timeOutgoing : styles.timeIncoming,
            ]}
          >
            {formatTime(createdAt)}
          </Text>

          {isOutgoing && getStatusIcon()}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginVertical: 4,
    paddingHorizontal: 12,
    flexDirection: 'row',
  },
  rowOutgoing: {
    justifyContent: 'flex-end',
  },
  rowIncoming: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    ...SHADOWS.sm,
  },
  bubbleOutgoing: {
    backgroundColor: COLORS.outgoingBubble,
    borderBottomRightRadius: 4,
  },
  bubbleIncoming: {
    backgroundColor: COLORS.incomingBubble,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  senderHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 3,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  textOutgoing: {
    color: COLORS.outgoingText,
  },
  textIncoming: {
    color: COLORS.incomingText,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 3,
    gap: 4,
  },
  timeText: {
    fontSize: 11,
  },
  timeOutgoing: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  timeIncoming: {
    color: COLORS.textMuted,
  },
  tick: {
    marginLeft: 2,
  },
});
