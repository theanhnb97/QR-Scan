import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { APP_ICON_SIZES, AppIcon, AppIconName } from './AppIcon';

export interface SwipeAction {
  key: string;
  label: string;
  color: string;
  icon?: AppIconName;
  onPress: () => void;
}

let closeActiveRow: (() => void) | null = null;

interface SwipeableRowProps {
  children: React.ReactNode;
  actions: SwipeAction[];
  direction?: 'left' | 'right';
  backgroundColor: string;
  borderColor: string;
}

/** Lightweight native-only swipe row so the app does not need a gesture framework just for list actions. */
export const SwipeableRow: React.FC<SwipeableRowProps> = ({ children, actions, direction = 'left', backgroundColor, borderColor }) => {
  const [open, setOpen] = useState(false);
  const translate = useRef(new Animated.Value(0)).current;
  const actionWidth = Math.min(184, Math.max(104, actions.length * 92));
  const sign = direction === 'left' ? -1 : 1;
  const target = sign * actionWidth;

  const animateTo = useCallback((value: number) => {
    Animated.spring(translate, { toValue: value, useNativeDriver: true, bounciness: 0, speed: 22 }).start(() => setOpen(value !== 0));
  }, [translate]);

  const closeRow = useCallback(() => {
    animateTo(0);
    if (closeActiveRow === closeRow) closeActiveRow = null;
  }, [animateTo]);

  const openRow = useCallback(() => {
    if (closeActiveRow && closeActiveRow !== closeRow) closeActiveRow();
    closeActiveRow = closeRow;
    animateTo(target);
  }, [animateTo, closeRow, target]);

  useEffect(() => () => {
    if (closeActiveRow === closeRow) closeActiveRow = null;
  }, [closeRow]);

  const panResponder = useMemo(() => PanResponder.create({
    // Capture only horizontal movement so FlatList keeps vertical scrolling.
    onMoveShouldSetPanResponderCapture: (_, gesture) => Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderMove: (_, gesture) => {
      const next = sign === -1 ? Math.min(0, Math.max(-actionWidth, gesture.dx)) : Math.max(0, Math.min(actionWidth, gesture.dx));
      translate.setValue(next);
    },
    onPanResponderRelease: (_, gesture) => {
      const shouldOpen = sign === -1 ? gesture.dx < -actionWidth * 0.32 : gesture.dx > actionWidth * 0.32;
      shouldOpen ? openRow() : closeRow();
    },
    onPanResponderTerminate: () => (open ? openRow() : closeRow()),
    onPanResponderTerminationRequest: () => false,
  }), [actionWidth, closeRow, open, openRow, sign, translate]);

  return (
    <View {...panResponder.panHandlers} style={[styles.root, { backgroundColor, borderColor }]}>
      <View style={[styles.actions, direction === 'left' ? styles.actionsRight : styles.actionsLeft, { width: actionWidth }]}>
        {actions.map((action) => (
          <Pressable key={action.key} style={[styles.action, { backgroundColor: action.color }]} onPress={() => { closeRow(); action.onPress(); }} accessibilityRole="button" accessibilityLabel={action.label}>
            {action.icon ? <AppIcon name={action.icon} color="#FFFFFF" size={APP_ICON_SIZES.action} /> : null}
            <Text style={styles.actionText}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
      <Animated.View style={[styles.content, { backgroundColor, transform: [{ translateX: translate }] }]}>
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { overflow: 'hidden', borderRadius: 16, borderWidth: 1 },
  content: { minHeight: 82 },
  actions: { position: 'absolute', top: 0, bottom: 0, flexDirection: 'row', gap: 1 },
  actionsRight: { right: 0 },
  actionsLeft: { left: 0 },
  action: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 6 },
  actionText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', textAlign: 'center' },
});
