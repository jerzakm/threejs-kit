import {
  ClampToEdgeWrapping,
  DataArrayTexture,
  FloatType,
  LinearFilter,
  RepeatWrapping,
} from "three";
import rawDictionary from "./glint_dict.raw?raw";

function loaderTextRaw(text: string) {
  const BufferScalar: any = {
    last: 0,
    push: function (v: number) {
      this[this.last++] = v;
    },
  };

  const create_float_buffer = (nb: number) => {
    return Object.assign(new Float32Array(nb), BufferScalar);
  };
  const separator = (c: string) => {
    return c == " " || c == "\n" || c == "\r";
  };

  let index = 0;

  const read_word = () => {
    while (separator(text[index])) {
      index++;
    }
    const k = index;
    while (!separator(text[index])) {
      index++;
    }
    return text.substring(k, index);
  };

  const nbl = parseInt(read_word());
  const nbd = parseInt(read_word());
  const w = parseInt(read_word());

  const tot = 3 * w * nbl * nbd;
  const data = create_float_buffer(tot);
  for (let i = 0; i < tot; ++i) {
    data.push(parseFloat(read_word()));
  }

  return { nbl, nbd, w, data };
}

export const loadGlintDictionaryQuality = () => {
  const addAlphaChannel = (rgbArray: Float32Array) => {
    const length = rgbArray.length;
    const rgbaArray = new Float32Array((length / 3) * 4);

    for (let i = 0, j = 0; i < length; i += 3, j += 4) {
      rgbaArray[j] = rgbArray[i];
      rgbaArray[j + 1] = rgbArray[i + 1];
      rgbaArray[j + 2] = rgbArray[i + 2];
      rgbaArray[j + 3] = 1;
    }

    return rgbaArray;
  };

  const { data, nbd, nbl, w } = loaderTextRaw(rawDictionary);
  const rgbaData = addAlphaChannel(data);

  console.log({ nbd, nbl, w });

  const dictionaryTexture = new DataArrayTexture(rgbaData, w, nbd, nbl);
  dictionaryTexture.type = FloatType;
  dictionaryTexture.minFilter = LinearFilter;
  dictionaryTexture.magFilter = LinearFilter;
  dictionaryTexture.wrapS = ClampToEdgeWrapping;
  dictionaryTexture.wrapT = RepeatWrapping;
  dictionaryTexture.needsUpdate = true;

  return { dictionaryTexture };
};
