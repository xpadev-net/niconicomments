import type { NicoScript } from "@/@types/";

let nicoScripts: NicoScript = {
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
