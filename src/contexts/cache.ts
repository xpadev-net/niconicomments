let imageCache: {
  [key: string]: { image: HTMLCanvasElement; timeout: number };
} = {};
const resetImageCache = () => {
  imageCache = {};
};
export { imageCache, resetImageCache };
