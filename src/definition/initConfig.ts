import type { BaseConfig, Platform } from "@/@types/";
import { FlashComment } from "@/comments/";
import { colors } from "@/definition/colors";
import { updateConfig } from "@/definition/config";
import { fonts } from "@/definition/fonts";
import { isFlashComment } from "@/utils/comment";

/**
 * コンフィグを初期化する
 */
const initConfig = () => {
  const platform: Platform = ((ua) => {
    if (RegExp(/windows nt 6\.[12]/i).exec(ua)) {
      return "win7";
    }
    if (RegExp(/windows nt (6\.3|10\.\d+)|win32/i).exec(ua)) {
      return "win8_1";
    }
    if (RegExp(/windows nt/i).exec(ua)) {
      return "win";
    }
    if (RegExp(/mac os x 10(.|_)(9|10)/i).exec(ua)) {
      return "mac10_9";
    }
    if (RegExp(/mac os x 10(.|_)\d{2}|darwin/i).exec(ua)) {
      return "mac10_11";
    }
    if (RegExp(/mac os x/i).exec(ua)) {
      return "mac";
    }
    return "other";
  })(typeof navigator !== "undefined" ? navigator.userAgent : process.platform);
  const defaultConfig: BaseConfig = {
    /**
     * 色コマンド・カラコ対応
     * -> src/definition/color.ts
     */
    colors: colors,
    /**
     * fillColorが#000000以外の時の枠線の色
     */
    contextStrokeColor: "#000000",
    /**
     * fillColorが#000000の時の枠線の色
     */
    contextStrokeInversionColor: "#FFFFFF",
    /**
     * 枠線の透明度
     */
    contextStrokeOpacity: 0.4,
    /**
     * _liveコマンドの透明度
     */
    contextFillLiveOpacity: 0.5,
    /**
     * 縁取り線の太さ
     */
    contextLineWidth: {
      html5: 2.8,
      flash: 4,
    },

    /**
     * コメントのリサイズ
     */
    commentScale: {
      html5: 1920 / 683,
      flash: 1920 / 683,
    },

    /**
     * 描画範囲(リサイズ前)
     */
    commentStageSize: {
      html5: {
        width: 512,
        fullWidth: 683,
        height: 384,
      },
      flash: {
        width: 512, //512?
        fullWidth: 640, //640?
        height: 385,
      },
    },

    /**
     * フォントサイズ
     */
    fontSize: {
      html5: {
        small: {
          default: 18,
          resized: 10,
        },
        medium: {
          default: 27,
          resized: 14,
        },
        big: {
          default: 39,
          resized: 19.5,
        },
      },
      flash: {
        small: {
          default: 15,
          resized: 7.5,
        },
        medium: {
          default: 24,
          resized: 12,
        },
        big: {
          default: 39,
          resized: 19.5,
        },
      },
    },

    /**
     * 行高
     */
    html5LineCounts: {
      default: {
        big: 8.4,
        medium: 13.1,
        small: 21,
      },
      resized: {
        big: 16,
        medium: 25.4,
        small: 38,
      },
      doubleResized: {
        big: 7.8,
        medium: 11.3,
        small: 16.6,
      },
    },
    /**
     * 高解像度時のズレ補正値 @html5?
     */
    html5HiResCommentCorrection: 20,
    /**
     * 最小フォントサイズ @html5
     * 描画時のフォントサイズはこれ以上小さくならない
     * これ以上縮小する場合はコメントのズレが発生する
     */
    html5MinFontSize: 10,
    fonts: {
      /**
       * フォント @html5?
       */
      html5: fonts[platform],
      /**
       * 描画に使うフォント
       * [size]に数値が入る
       */
      flash: {
        gulim: `normal 600 [size]px gulim, ${fonts[platform].gothic.font}, Arial`,
        simsun: `normal 400 [size]px simsun, batang, "PMingLiU", MingLiU-ExtB, ${fonts[platform].mincho.font}, Arial`,
      },
    },

    /**
     * fpsを更新する間隔(ms)
     */
    fpsInterval: 500,

    /**
     * キャッシュの追加保持期間(ms)
     */
    cacheAge: 2000,

    /**
     * キャンバスの横幅
     */
    canvasWidth: 1920,
    /**
     * キャンバスの高さ
     */
    canvasHeight: 1080,
    /**
     * コメントの処理範囲
     */
    commentDrawRange: 1530,
    /**
     * コメントの処理範囲外(片側)の幅
     * (config.canvasWidth - config.commentDrawRange) / 2,
     */
    commentDrawPadding: 195,
    /**
     * 当たり判定の左右幅
     * left: collisionWidth,
     * right: canvasWidth - collisionWidth
     */
    collisionRange: {
      left: 235,
      right: 1685,
    },
    /**
     * コメント間の横の余白
     */
    collisionPadding: 5,
    /**
     * 同一CAと判定する投下経過時間の最大値(秒)
     */
    sameCARange: 3600,
    /**
     * 同一CAと判定するvposの範囲(vpos)
     */
    sameCAGap: 100,
    /**
     * レイヤーを分離する基準値
     */
    sameCAMinScore: 10,
    /**
     * レイヤーを分ける際に同一CAとして扱う時間(範囲)
     */
    sameCATimestampRange: 300,
    /**
     * プラグインを保持するようの変数
     */
    plugins: [],
    /**
     * コメントをFlash版として処理する上限値
     * 初期値はHTML5版のリリース日
     */
    flashThreshold: 1499871600,

    /**
     * Flash版のフォント変化文字
     * todo: ゴシック保護文字を探す
     */
    flashChar: {
      gulim:
        "[\u0126\u0127\u0132\u0133\u0138\u013f\u0140\u0149-\u014b\u0166\u0167\u02d0\u02da\u2074\u207f\u2081-\u2084\u2113\u2153\u2154\u215c-\u215e\u2194\u2195\u223c\u249c-\u24b5\u24d0-\u24e9\u25a3-\u25a9\u25b6\u25b7\u25c0\u25c1\u25c8\u25d0\u25d1\u260e\u260f\u261c\u261e\u2660\u2661\u2663-\u2665\u2667-\u2669\u266c\u3131-\u316e\u3200-\u321c\u3260-\u327b\u3380-\u3384\u3388-\u338d\u3390-\u339b\u339f\u33a0\u33a2-\u33ca\u33cf\u33d0\u33d3\u33d6\u33d8\u33db-\u33dd\uac00-\ud7a3\uf900-\uf928\uf92a-\uf994\uf996\ufa0b\uffe6]",
      simsunStrong:
        "[\u01ce\u01d0\u01d2\u01d4\u01d6\u01d8\u01da\u01dc\u0251\u0261\u02ca\u02cb\u2016\u2035\u216a\u216b\u2223\u2236\u2237\u224c\u226e\u226f\u2295\u2483-\u249b\u2504-\u250b\u256d-\u2573\u2581-\u2583\u2585-\u2587\u2589-\u258b\u258d-\u258f\u2594\u2595\u25e2-\u25e5\u2609\u3016\u3017\u301e\u3021-\u3029\u3105-\u3129\u3220-\u3229\u32a3\u33ce\u33d1\u33d2\u33d5\ue758-\ue864\ufa0c\ufa0d\ufe30\ufe31\ufe33-\ufe44\ufe49-\ufe52\ufe54-\ufe57\ufe59-\ufe66\ufe68-\ufe6b]",
      simsunWeak:
        "[\u02c9\u2105\u2109\u2196-\u2199\u220f\u2215\u2248\u2264\u2265\u2299\u2474-\u2482\u250d\u250e\u2511\u2512\u2515\u2516\u2519\u251a\u251e\u251f\u2521\u2522\u2526\u2527\u2529\u252a\u252d\u252e\u2531\u2532\u2535\u2536\u2539\u253a\u253d\u253e\u2540\u2541\u2543-\u254a\u2550-\u256c\u2584\u2588\u258c\u2593]",
      gothic: "[\u03fb\uff9f\u30fb]",
    },

    /**
     * Flash版の文字変化規則を設定
     * xp -> フォント変化文字全て適用
     * vista -> 1又は2種類のみに制限
     * 参考: https://w.atwiki.jp/commentart/pages/44.html
     */
    flashMode: "vista",

    /**
     * Flash版の上付き・下付き文字
     * super: 上付き sub: 下付き
     * todo: 対象文字を探す
     */
    flashScriptChar: {
      super:
        "[\u00aa\u00b2\u00b3\u00b9\u00ba\u02b0\u02b2\u02b3\u02b7\u02b8\u02e1-\u02e3\u0304\u1d2c-\u1d43\u1d45-\u1d61\u1d9b-\u1da1\u1da3-\u1dbf\u2070\u2071\u2074-\u207f\u2c7d]",
      sub: "[\u0320\u1d62-\u1d6a\u2080-\u208e\u2090-\u209c\u2c7c]",
    },
    /**
     * Flash版コメントの高さを計算するための定数
     */
    lineHeight: {
      small: {
        default: 18 / 15,
        resized: 10 / 7.5,
      },
      medium: {
        default: 29 / 25,
        resized: 15 / 12,
      },
      big: {
        default: 45 / 39,
        resized: 24 / 19.5,
      },
    },
    /**
     * Flash版コメントの上空白
     */
    flashCommentYPaddingTop: {
      default: 5,
      resized: 3,
    },
    /**
     * Flash版コメントの上下補正値
     */
    flashCommentYOffset: {
      small: { default: -0.2, resized: -0.2 },
      medium: { default: -0.2, resized: -0.2 },
      big: { default: -0.2, resized: -0.2 },
    },
    /**
     * 文字間の空白
     */
    flashLetterSpacing: 1,
    /**
     * コメントの上下補正値
     */
    flashScriptCharOffset: 0.12,
    /**
     * コメント描画数の上限
     * undefinedの場合は無制限
     */
    commentLimit: undefined,
    /**
     * コメント描画上限に達した際に消す順番
     * asc: 新しい方から上限まで(ニコニコ公式同様)
     * desc: 古い方から上限まで
     */
    hideCommentOrder: "asc",
    /**
     * 改行リサイズの行数
     */
    lineBreakCount: {
      big: 3,
      medium: 5,
      small: 7,
    },
    /**
     * 独自のコメントを追加するための拡張
     * 多分画像流したりコメントに背景つけたりできる
     * class: コメント描画クラス
     * condition: コメント描画クラスを適用する条件
     */
    commentPlugins: [
      {
        class: FlashComment,
        condition: isFlashComment,
      },
    ],
    /**
     * nakaコメントの速度補正値
     */
    nakaCommentSpeedOffset: 0.95,
    /**
     * \@ボタンのボタンに適用する余白
     */
    atButtonPadding: 5,
    atButtonRadius: 7,
    flashDoubleResizeHeights: {
      big: {
        9: 392,
        10: 384,
        11: 389,
        12: 388,
        13: 381,
        14: 381,
        15: 384,
      },
    },
    flashLineBreakScale: {
      small: 0.557,
      medium: 0.519,
      big: 0.535,
    },
    compatSpacer: {
      flash: {
        "\u3000": {
          simsun: 0.98,
          defont: 0.645,
          gulim: 0.95,
        },
        "\u00a0": {
          simsun: 0.25,
        },
        "\u0020": {
          defont: 0.3,
        },
        "\u2001": {
          defont: 0.95,
        },
        "\u2004": {
          defont: 1.6,
        },
        "\u2007": {
          defont: 1.6,
        },
        "\u202a": {
          defont: 0.59,
        },
      },
      html5: {},
    },
  };
  updateConfig(defaultConfig);
};
export { initConfig };
