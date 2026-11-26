import { convertShoe, shoeSizes, type Fit } from "@mgl/core";
import { useTranslations } from "next-intl";
import { ChartPage, chartMeta, SizeTable, Tip } from "../parts";

export const generateMetadata = () => chartMeta("shoes");

const FITS: Fit[] = ["womens", "mens", "kids"];

export default function ShoeChartPage() {
  const t = useTranslations("sizeCharts.shoes");
  return (
    <ChartPage id="shoes">
      {FITS.map((fit) => (
        <SizeTable
          key={fit}
          title={t(fit)}
          note={fit === "mens" ? undefined : fit === "kids" ? t("kidsNote") : t("cmNote")}
          rows={shoeSizes(fit).flatMap((us) => convertShoe(us, fit) ?? [])}
        />
      ))}
      <Tip title={t("tipTitle")}>{t("tip")}</Tip>
    </ChartPage>
  );
}
