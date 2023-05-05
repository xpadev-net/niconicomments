import { Canvas } from "@/@types";

let imageCache: {
  [key: string]: { image: Canvas; timeout: number | NodeJS.Timeout };
} = {};
const resetImageCache = () => {
  imageCache = {};
};
export { imageCache, resetImageCache };
