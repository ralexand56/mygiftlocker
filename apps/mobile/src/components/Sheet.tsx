import type { ReactNode } from "react";
import { KeyboardAvoidingView, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/lib/theme";

/**
 * Body of a modal screen: a scrolling form with a footer bar (Save) that stays above the keyboard.
 * Modals are presented outside the root view, so they apply the side insets themselves (the folded
 * iPhone Duo's camera strip on the right edge).
 */
export function Sheet({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: colors.cream, paddingLeft: insets.left, paddingRight: insets.right }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, paddingBottom: 24, maxWidth: 640, width: "100%", alignSelf: "center" }}
      >
        {children}
      </ScrollView>
      {footer && (
        <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: insets.bottom + 10, maxWidth: 640, width: "100%", alignSelf: "center" }}>{footer}</View>
      )}
    </KeyboardAvoidingView>
  );
}
