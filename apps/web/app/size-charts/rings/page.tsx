import { convertRing, RING_SIZES } from "@mgl/core";
import { useTranslations } from "next-intl";
import { ChartPage, chartMeta, SizeTable, Tip } from "../parts";

export const generateMetadata = () => chartMeta("rings");

export default function RingChartPage() {
  const t = useTranslations("sizeCharts.rings");
  const rows = RING_SIZES.map((us) => {
    const row = convertRing(us);
    // Inside circumference in mm (same formula as convertRing, before rounding) ÷ π.
    return { ...row, diameter: `${((36.55 + us * 2.55) / Math.PI).toFixed(1)} mm` };
  });
  return (
    <ChartPage id="rings">
      <SizeTable title={t("tableTitle")} note={t("note")} rows={rows} extra={[{ key: "diameter", label: t("diameter") }]} />
      <Tip title={t("tipTitle")}>{t("tip")}</Tip>
    </ChartPage>
  );
}
