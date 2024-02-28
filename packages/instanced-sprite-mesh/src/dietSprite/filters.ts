export const checkPointAlpha =
  (_threshold: number) =>
  (...rgba: number[]) => {
    return rgba[3] / 255 > 0;
  };

export const checkPointLuminance =
  (threshold: number) =>
  (...rgba: number[]) => {
    const [R, G, B] = rgba;

    return (
      0.2126 * (R / 255) + 0.7152 * (G / 255) + 0.0722 * (B / 255) > threshold
    );
  };

export const checkPointValue =
  (threshold: number) =>
  (...rgba: number[]) => {
    const [R, G, B] = rgba;

    return (R + G + B) / (255 * 3) > threshold;
  };
