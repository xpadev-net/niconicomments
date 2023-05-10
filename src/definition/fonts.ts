import { FontItem } from "@/@types";

/**
 * フォントを構築する
 * @param fonts フォントの配列
 * @returns フォントの文字列
 */
const build = (fonts: FontItem[]): FontItem => {
  return fonts.reduce(
    (pv, val, index) => {
      if (index === 0) {
        return { ...val };
      }
      pv.font += `, ${val.font}`;
      return pv;
    },
    { font: "", offset: 0, weight: 600 }
  );
};

const fontTemplates = {
  arial: {
    font: 'Arial, "ＭＳ Ｐゴシック", "MS PGothic", MSPGothic, MS-PGothic',
    offset: 0.01,
    weight: 600,
  },
  gothic: {
    font: '"游ゴシック体", "游ゴシック", "Yu Gothic", YuGothic, yugothic, YuGo-Medium',
    offset: -0.04,
    weight: 400,
  },
  gulim: {
    font: 'Gulim, "黑体", SimHei',
    offset: 0.03,
    weight: 400,
  },
  mincho: {
    font: '"游明朝体", "游明朝", "Yu Mincho", YuMincho, yumincho, YuMin-Medium',
    offset: -0.01,
    weight: 400,
  },
  simsun: {
    font: '"宋体", SimSun',
    offset: 0.135,
    weight: 400,
  },
  macGothicPro6: {
    font: '"ヒラギノ角ゴ ProN W6", HiraKakuProN-W6, "ヒラギノ角ゴ ProN", HiraKakuProN, "Hiragino Kaku Gothic ProN"',
    offset: -0.05,
    weight: 600,
  },
  macGothicPro3: {
    font: '"ヒラギノ角ゴ ProN W3", HiraKakuProN-W3, "ヒラギノ角ゴ ProN", HiraKakuProN, "Hiragino Kaku Gothic ProN"',
    offset: -0.04,
    weight: 300,
  },
  macMincho: {
    font: '"ヒラギノ明朝 ProN W3", HiraMinProN-W3, "ヒラギノ明朝 ProN", HiraMinProN, "Hiragino Mincho ProN"',
    offset: -0.02,
    weight: 300,
  },
  macGothic1: {
    font: '"ヒラギノ角ゴシック", "Hiragino Sans", HiraginoSans',
    offset: -0.05,
    weight: 600,
  },
  macGothic2: {
    font: '"ヒラギノ角ゴシック", "Hiragino Sans", HiraginoSans',
    offset: -0.04,
    weight: 300,
  },
  sansSerif600: {
    font: "sans-serif",
    offset: 0,
    weight: 600,
  },
  sansSerif400: {
    font: "sans-serif",
    offset: 0,
    weight: 400,
  },
  serif: {
    font: "serif",
    offset: 0,
    weight: 400,
  },
};

const fonts = {
  win7: {
    //win8
    defont: build([fontTemplates.arial]),
    gothic: build([
      fontTemplates.gothic,
      fontTemplates.gulim,
      fontTemplates.arial,
    ]),
    mincho: build([
      fontTemplates.mincho,
      fontTemplates.simsun,
      fontTemplates.arial,
    ]),
  },
  win8_1: {
    //win10
    defont: build([fontTemplates.arial]),
    gothic: build([
      fontTemplates.gothic,
      fontTemplates.simsun,
      fontTemplates.arial,
    ]),
    mincho: build([
      fontTemplates.mincho,
      fontTemplates.simsun,
      fontTemplates.arial,
    ]),
  },
  win: {
    defont: build([fontTemplates.arial]),
    gothic: build([fontTemplates.gulim, fontTemplates.arial]),
    mincho: build([fontTemplates.simsun, fontTemplates.arial]),
  },
  mac10_9: {
    //mac10_10
    defont: build([fontTemplates.macGothicPro6]),
    gothic: build([fontTemplates.gothic, fontTemplates.macGothicPro3]),
    mincho: build([
      fontTemplates.mincho,
      fontTemplates.macMincho,
      fontTemplates.macGothicPro3,
    ]),
  },
  mac10_11: {
    //mac10_12-19
    defont: build([fontTemplates.macGothic1]),
    gothic: build([fontTemplates.gothic, fontTemplates.macGothic2]),
    mincho: build([
      fontTemplates.mincho,
      fontTemplates.macMincho,
      fontTemplates.macGothic2,
    ]),
  },
  mac: {
    defont: build([fontTemplates.macGothicPro6]),
    gothic: build([fontTemplates.macGothicPro3]),
    mincho: build([fontTemplates.macMincho]),
  },
  other: {
    //android,ios,other
    defont: build([fontTemplates.sansSerif600]),
    gothic: build([fontTemplates.sansSerif400]),
    mincho: build([fontTemplates.serif]),
  },
};
export { fonts, fontTemplates };
