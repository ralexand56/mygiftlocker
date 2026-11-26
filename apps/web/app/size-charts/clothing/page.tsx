import { ALPHA_SIZES, convertAlpha, convertWaist, convertWomensNumeric, MENS_CHEST_IN, MENS_WAIST, WOMENS_NUMERIC, womensNumericToAlpha } from "@mgl/core";
import { useTranslations } from "next-intl";
import { ChartPage, chartMeta, SizeTable, Tip } from "../parts";

export const generateMetadata = () => chartMeta("clothing");

export default function ClothingChartPage() {
  const t = useTranslations("sizeCharts.clothing");
  const womens = WOMENS_NUMERIC.flatMap((us) => {
    const row = convertWomensNumeric(us);
    return row ? [{ ...row, letter: womensNumericToAlpha(us) }] : [];
  });
  const tops = ALPHA_SIZES.map((s) => ({ ...convertAlpha(s), chest: MENS_CHEST_IN[s] ?? "–" }));
  const pants = MENS_WAIST.map((w) => convertWaist(w));
  return (
    <ChartPage id="clothing">
      <SizeTable title={t("womens")} note={t("womensNote")} rows={womens} extra={[{ key: "letter", label: t("letter") }]} />
      <SizeTable title={t("tops")} note={t("topsNote")} rows={tops} extra={[{ key: "chest", label: t("chest") }]} />
      <SizeTable title={t("pants")} note={t("pantsNote")} rows={pants} />
      <Tip title={t("tipTitle")}>{t("tip")}</Tip>
    </ChartPage>
  );
}
