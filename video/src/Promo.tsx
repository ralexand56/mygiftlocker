import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Fragment, type ReactNode } from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { type Copy, COPY, type Lang, LangContext } from "./copy";
import { Exit, Notification, TRANSITION, Wash } from "./parts";
import { Brand, Convert, Cta, EmailCard, Hook, ScreenScene } from "./scenes";

const FPS = 30;
const T = TRANSITION;
const CUT = 8; // quick dissolve between app screens shown in the same window

/**
 * The story: the yearly size guessing → the locker → a person's card → AI gift ideas for them →
 * a reminder before the next birthday → they fill in their own sizes → sizes abroad →
 * Secret Santa → call to action. scripts/music.mjs times its chimes to these frames.
 * `cut`: a quick dissolve into this scene, for app screens that follow each other in the same window.
 */
function scenes(c: Copy, screen: (name: string) => string): { frames: number; el: ReactNode; cut?: boolean }[] {
  const tap = c.taps;
  return [
    { frames: 150, el: <Exit><Hook /></Exit> },
    { frames: 90, el: <Exit><Brand /></Exit> },
    {
      frames: 140,
      el: (
        <ScreenScene
          {...c.locker}
          desktop={{ src: screen("desktop-locker"), focus: [0.3, 0.45] }}
          mobile={{ src: screen("mobile-locker"), focus: [0.5, 0.7] }}
          desktopTap={{ ...tap.maya.d, at: 114 }}
          mobileTap={{ ...tap.maya.m, at: 114 }}
          continues
        />
      ),
    },
    {
      cut: true,
      frames: 135,
      el: (
        <ScreenScene
          {...c.person}
          desktop={{ src: screen("desktop-person"), focus: [0.5, 0.45] }}
          mobile={{ src: screen("mobile-person"), focus: [0.5, 0.45] }}
          desktopTap={{ ...tap.find.d, at: 108 }}
          mobileTap={{ ...tap.find.m, at: 108 }}
          enter={false}
          continues
        />
      ),
    },
    {
      cut: true,
      frames: 165,
      el: (
        <ScreenScene
          {...c.ai}
          desktop={{ src: screen("desktop-gifts-loading"), swapTo: screen("desktop-gifts"), swapAt: 46, swapFrames: 14, zoom: 1.25, focus: [0.5, 0.45] }}
          mobile={{ src: screen("mobile-gifts-loading"), swapTo: screen("mobile-gifts"), swapAt: 46, swapFrames: 14, focus: [0.5, 0.3] }}
          enter={false}
          continues
        />
      ),
    },
    {
      cut: true,
      frames: 165,
      el: (
        <ScreenScene
          kicker={c.dates.kicker}
          title={c.dates.title}
          sub={c.dates.sub}
          desktop={{ src: screen("desktop-calendar"), focus: [0.5, 0.4] }}
          mobile={{ src: screen("mobile-calendar"), swapTo: screen("mobile-email"), swapAt: 64, swapFrames: 8, focus: [0.5, 0.3] }}
          desktopExtra={
            <div style={{ position: "absolute", top: 0, right: 0, width: "40%", height: "30%" }}>
              <Notification at={20} hideAt={64} scale={1.1} now={c.dates.now} {...c.dates.notification} />
            </div>
          }
          mobileExtra={<Notification at={20} hideAt={62} scale={1.44} now={c.dates.now} {...c.dates.notification} />}
          desktopTap={{ x: 0.8, y: 0.085, at: 60 }}
          mobileTap={{ x: 0.5, y: 0.07, at: 58 }}
          aside={<EmailCard at={66} />}
          enter={false}
          continues
        />
      ),
    },
    {
      cut: true,
      frames: 150,
      el: (
        <ScreenScene
          {...c.invite}
          desktop={{ src: screen("desktop-join-shoes-before"), swapTo: screen("desktop-join-shoes"), swapAt: 66, focus: [0.75, 0.35] }}
          mobile={{ src: screen("mobile-join-shoes-before"), swapTo: screen("mobile-join-shoes"), swapAt: 66, focus: [0.35, 0.6] }}
          desktopTap={{ ...tap.shoe.d, at: 66 }}
          mobileTap={{ ...tap.shoe.m, at: 66 }}
          enter={false}
        />
      ),
    },
    { frames: 150, el: <Exit><Convert /></Exit> },
    {
      frames: 135,
      el: (
        <ScreenScene
          {...c.santa}
          desktop={{ src: screen("desktop-santa"), focus: [0.75, 0.8] }}
          mobile={{ src: screen("mobile-santa"), focus: [0.5, 0.5] }}
          desktopTap={{ ...tap.draw.d, at: 100 }}
        />
      ),
    },
    { frames: 180, el: <Cta /> },
  ];
}

const TIMING = scenes(COPY.en, (n) => n);
const overlap = (i: number) => (i === 0 ? 0 : TIMING[i]!.cut ? CUT : T);

export const PROMO = {
  fps: FPS,
  durationInFrames: TIMING.reduce((n, s, i) => n + s.frames - overlap(i), 0),
};

export function Promo({ lang }: { lang: Lang }) {
  const list = scenes(COPY[lang], (name) => `screens/${lang}/${name}.jpg`);
  return (
    <LangContext.Provider value={lang}>
      <AbsoluteFill>
        <Wash />
        {/* Original track from scripts/music.mjs; its fades are baked in. */}
        <Audio src={staticFile("music.m4a")} volume={0.9} />
        <TransitionSeries>
          {list.map((s, i) => (
            <Fragment key={i}>
              {i > 0 && <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: overlap(i) })} />}
              <TransitionSeries.Sequence durationInFrames={s.frames}>{s.el}</TransitionSeries.Sequence>
            </Fragment>
          ))}
        </TransitionSeries>
      </AbsoluteFill>
    </LangContext.Provider>
  );
}
