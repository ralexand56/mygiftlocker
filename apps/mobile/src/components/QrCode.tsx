import QRCode from "qrcode";
import { useMemo } from "react";
import Svg, { Path } from "react-native-svg";
import { colors } from "@/lib/theme";

/** A QR code drawn natively (one SVG path), so someone can scan an invite in person. */
export function QrCode({ value, size = 140 }: { value: string; size?: number }) {
  const { d, n } = useMemo(() => {
    const qr = QRCode.create(value, { errorCorrectionLevel: "M" });
    const count = qr.modules.size;
    let path = "";
    for (let y = 0; y < count; y++) for (let x = 0; x < count; x++) if (qr.modules.get(y, x)) path += `M${x} ${y}h1v1h-1z`;
    return { d: path, n: count };
  }, [value]);
  return (
    <Svg width={size} height={size} viewBox={`-1 -1 ${n + 2} ${n + 2}`}>
      <Path d={d} fill={colors.ink} />
    </Svg>
  );
}
