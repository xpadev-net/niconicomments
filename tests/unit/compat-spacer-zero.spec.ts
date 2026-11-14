import { beforeEach, describe, expect, test } from "vitest";

import type { BaseConfig } from "@/@types";
import { defaultConfig } from "@/definition/config";
import { initConfig } from "@/definition/initConfig";
import { parseContent as parseFlashContent } from "@/utils/flash";
import { addHTML5PartToResult } from "@/utils/niconico";
import { getCompatSpacerWidth } from "@/utils/spacer";

describe("compatSpacer: undefined は未指定、0 は幅 0 (flash / html5 共通)", () => {
  beforeEach(() => initConfig());

  test("getCompatSpacerWidth", () => {
    expect(getCompatSpacerWidth(undefined, "defont")).toBeUndefined();
    expect(getCompatSpacerWidth({}, "defont")).toBeUndefined();
    expect(getCompatSpacerWidth({ defont: 0 }, "defont")).toBe(0);
    expect(getCompatSpacerWidth({ defont: 1.5 }, "defont")).toBe(1.5);
  });

  test("flash: 0 指定は幅 0 の spacer になり、未指定の文字は spacer 化されない", () => {
    const config: BaseConfig = {
      ...defaultConfig,
      compatSpacer: {
        ...defaultConfig.compatSpacer,
        flash: { "　": { defont: 0 } },
      },
    };
    const content = parseFlashContent("a　b", config);
    const spacers = content.filter((i) => i.type === "spacer");
    expect(spacers).toHaveLength(1);
    expect(spacers[0]).toMatchObject({ char: "　", charWidth: 0, count: 1 });
  });

  test("flash: 継承したフォントの幅が 0 の場合も幅 0 に更新される", () => {
    const config: BaseConfig = {
      ...defaultConfig,
      compatSpacer: {
        ...defaultConfig.compatSpacer,
        flash: { "\u3000": { defont: 1, gulim: 0 } },
      },
    };
    // 先頭の text が gulim になり、フォント未確定だった spacer(defont: 1)が gulim を継承する
    const content = parseFlashContent("한a\u3000", config);
    expect(content[0]).toMatchObject({ type: "text", font: "gulim" });
    const spacer = content.find((i) => i.type === "spacer");
    expect(spacer).toMatchObject({ font: "gulim", charWidth: 0 });
  });

  test("html5: 0 指定は幅 0 の spacer になる", () => {
    const config: BaseConfig = {
      ...defaultConfig,
      compatSpacer: {
        ...defaultConfig.compatSpacer,
        html5: { "　": { defont: 0 } },
      },
    };
    const out: Parameters<typeof addHTML5PartToResult>[0] = [];
    addHTML5PartToResult(out, "a　b", config, "defont");
    expect(out.map((i) => i.type)).toEqual(["text", "spacer", "text"]);
    expect(out[1]).toMatchObject({ charWidth: 0 });
  });
});
