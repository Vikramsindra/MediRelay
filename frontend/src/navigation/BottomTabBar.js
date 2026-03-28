import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius, shadow } from '../theme';
import { AppIcon } from '../components/AppIcon';

const TABS = [
  { name: 'Home',     iconName: 'home', label: 'Home' },
  { name: 'Patients', iconName: 'users', label: 'Patients' },
  { name: 'History',  iconName: 'clock', label: 'History' },
];

export default function BottomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.bar}>
      {TABS.map((tab, index) => {
        const isFocused = state.index === index;
        return (
          <TouchableOpacity
            key={tab.name}
            onPress={() => navigation.navigate(tab.name)}
            style={styles.tab}
            activeOpacity={0.75}
          >
            <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
              <AppIcon
                name={tab.iconName}
                size={18}
                color={isFocused ? colors.primary : colors.outline}
              />
            </View>
            <Text style={[
              typography.labelMd,
              { color: isFocused ? colors.primary : colors.outline, marginTop: 2 },
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLowest,
    borderTopWidth: 0,
    paddingBottom: 12,
    paddingTop: spacing[2],
    ...shadow.md,
  },
  tab: {
    flex: 1, alignItems: 'center', paddingVertical: spacing[1],
  },
  iconWrap: {
    width: 48, height: 32, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.secondaryContainer,
  },
});
