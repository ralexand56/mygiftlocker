import { ChartLinks, ChartPage, chartMeta } from "./parts";

export const generateMetadata = () => chartMeta("hub");

export default function SizeChartsPage() {
  return (
    <ChartPage id="hub">
      <div className="mt-10">
        <ChartLinks />
      </div>
    </ChartPage>
  );
}
