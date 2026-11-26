import { Composition } from "remotion";
import { PROMO, Promo } from "./Promo";

export function Root() {
  return (
    <>
      <Composition id="Landscape" component={Promo} width={1920} height={1080} defaultProps={{ lang: "en" as const }} {...PROMO} />
      <Composition id="Vertical" component={Promo} width={1080} height={1920} defaultProps={{ lang: "en" as const }} {...PROMO} />
      <Composition id="LandscapeES" component={Promo} width={1920} height={1080} defaultProps={{ lang: "es" as const }} {...PROMO} />
      <Composition id="VerticalES" component={Promo} width={1080} height={1920} defaultProps={{ lang: "es" as const }} {...PROMO} />
    </>
  );
}
