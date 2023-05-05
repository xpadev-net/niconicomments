import type { nicoScript } from "@/@types/";

let nicoScripts: nicoScript = {
  reverse: [],
  default: [],
  replace: [],
  ban: [],
  seekDisable: [],
  jump: [],
};
const resetNicoScripts = () => {
  nicoScripts = {
    reverse: [],
    default: [],
    replace: [],
    ban: [],
    seekDisable: [],
    jump: [],
  };
};
export { nicoScripts, resetNicoScripts };
