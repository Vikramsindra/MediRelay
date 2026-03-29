import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius, shadow } from '../theme';
import { AppIcon } from '../components/AppIcon';

const TABS = [
  { name: 'Home', iconName: 'home', label: 'Home' },
  { name: 'History', iconName: 'clock', label: 'History' },
];

export default function PatientBottomTabBar({ state, navigation }) {
  return (
    <View style={styles.barWrap}>
      <View style={styles.bar}>
        {TABS.map((tab, index) => {
          const isFocused = state.index === index;
          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => navigation.navigate(tab.name)}
              style={styles.tab}
              activeOpacity={0.8}
            >
              <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
                <AppIcon
                  name={tab.iconName}
                  size={20}
                  color={isFocused ? colors.primary : '#6f7684'}
                />
              </View>
              <Text style={[styles.tabText, isFocused && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barWrap: {
    backgroundColor: colors.background,
    paddingTop: spacing[2],
    paddingBottom: spacing[2],
  },
  bar: {
    flexDirection: 'row',
    marginHorizontal: spacing[5],
    backgroundColor: '#f1f3fa',
    borderRadius: 28,
    paddingVertical: spacing[2],
    ...shadow.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 48,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  iconWrapActive: {
    backgroundColor: '#d6e3ff',
  },
  tabText: {
    ...typography.headlineSm,
    color: '#6f7684',
    marginTop: 2,
  },
  tabTextActive: {
    color: colors.primary,
  },
});
