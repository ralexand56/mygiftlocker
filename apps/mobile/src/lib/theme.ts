export const colors = {
  cream: "#FFFAF7",
  blush: "#FBD3E3",
  rose: "#E9779F",
  peach: "#FFC9A8",
  lavender: "#D9C8FF",
  plum: "#7A5AA6",
  ink: "#4A3B66",
  inkSoft: "#7D7096",
  mint: "#CDEFE3",
  butter: "#FFE7B8",
  sky: "#D4E9FF",
  white: "#FFFFFF",
};

export const fonts = {
  display: "Fraunces_600SemiBold",
  body: "Nunito_400Regular",
  bold: "Nunito_700Bold",
  black: "Nunito_800ExtraBold",
};

export const shadow = {
  shadowColor: "#4A3B66",
  shadowOpacity: 0.12,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 10 },
  elevation: 4,
};

/** Spring configs shared across screens so motion feels consistent. */
export const springs = {
  gentle: { damping: 18, stiffness: 120, mass: 1 },
  snappy: { damping: 22, stiffness: 320, mass: 0.8 },
};
