import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

const PALETTES = [
  ['#6366f1', '#4f46e5'],
  ['#ec4899', '#db2777'],
  ['#8b5cf6', '#7c3aed'],
  ['#06b6d4', '#0891b2'],
  ['#10b981', '#059669'],
  ['#f59e0b', '#d97706'],
  ['#3b82f6', '#2563eb'],
];

export default function Avatar({
  name = 'User',
  size = 'md',
  isGroup = false,
  showOnline = false,
  isOnline = true,
  style,
}) {
  const sizeMap = {
    sm: 34,
    md: 46,
    lg: 58,
    xl: 80,
  };
  const dimension = sizeMap[size] || 46;

  // Pick deterministic color based on name hash
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const colorIndex = Math.abs(hash) % PALETTES.length;
  const [bgStart] = PALETTES[colorIndex];

  const getInitials = (str) => {
    if (!str) return '?';
    const parts = str.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <View style={[{ width: dimension, height: dimension }, styles.wrapper, style]}>
      <View
        style={[
          styles.circle,
          {
            width: dimension,
            height: dimension,
            borderRadius: dimension / 2,
            backgroundColor: isGroup ? '#475569' : bgStart,
          },
        ]}
      >
        {isGroup ? (
          <Ionicons name="people" size={dimension * 0.5} color="#ffffff" />
        ) : (
          <Text
            style={[
              styles.initials,
              {
                fontSize: dimension * 0.38,
              },
            ]}
          >
            {getInitials(name)}
          </Text>
        )}
      </View>

      {showOnline && !isGroup && (
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: isOnline ? COLORS.online : COLORS.textMuted,
              width: Math.max(10, dimension * 0.26),
              height: Math.max(10, dimension * 0.26),
              borderRadius: dimension * 0.13,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});
