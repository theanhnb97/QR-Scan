import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

/** Dismisses a sheet when the dimmed area is tapped, while keeping the card interactive. */
export const DismissibleBackdrop: React.FC<React.PropsWithChildren<{
  onDismiss: () => void;
  style?: StyleProp<ViewStyle>;
}>> = ({ onDismiss, style, children }) => (
  <View style={style}>
    <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} accessible={false} />
    {children}
  </View>
);
