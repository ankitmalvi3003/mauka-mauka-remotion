import { Composition } from "remotion";
import { Scene, calculateMetadata, SceneProps } from "./Composition";

export const Root: React.FC = () => (
  <Composition
    id="MaukaMaukaDecoded"
    component={Scene}
    durationInFrames={2310}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={
      {
        narrationSrc: undefined,
        musicSrc: undefined,
        captions: [],
      } as SceneProps
    }
    calculateMetadata={calculateMetadata}
  />
);