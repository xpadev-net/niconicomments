import { beforeEach, describe, expect, test } from "vitest";

import type { BaseConfig, FormattedComment } from "@/@types";
import { defaultConfig } from "@/definition/config";
import { initConfig } from "@/definition/initConfig";
import { changeCALayer } from "@/utils/commentArt";

const formattedComment = (
  id: number,
  overrides: Partial<FormattedComment> = {},
): FormattedComment => ({
  id,
  vpos: id,
  content: `comment ${id}`,
  date: 1_700_000_000 + id,
  date_usec: 0,
  owner: false,
  premium: false,
  mail: ["ca"],
  user_id: 1,
  layer: -1,
  is_my_post: false,
  ...overrides,
});

const createConfig = (overrides: Partial<BaseConfig> = {}): BaseConfig => ({
  ...defaultConfig,
  ...overrides,
});

describe("comment art resource bounds", () => {
  beforeEach(() => {
    initConfig();
  });

  test("groups one user's many distinct timestamps without scanning prior groups", () => {
    const comments = Array.from({ length: 500 }, (_, index) =>
      formattedComment(index + 1, {
        content: `comment art ${index}`,
        date: 1_700_000_000 + index * 2,
        user_id: 1,
      }),
    );
    const config = createConfig({
      sameCATimestampRange: 0,
      sameCAMinScore: 10,
    });
    const originalFind = Array.prototype.find;
    let findPredicateCalls = 0;
    Array.prototype.find = function findWithCount<T>(
      this: T[],
      predicate: (value: T, index: number, obj: T[]) => unknown,
      thisArg?: unknown,
    ) {
      return originalFind.call(
        this,
        (value: T, index: number, obj: T[]) => {
          findPredicateCalls++;
          return predicate.call(thisArg, value, index, obj);
        },
        thisArg,
      );
    } as typeof Array.prototype.find;

    try {
      expect(changeCALayer(comments, config)).toHaveLength(comments.length);
    } finally {
      Array.prototype.find = originalFind;
    }

    expect(findPredicateCalls).toBe(0);
  });

  test("keeps encounter-order layer grouping for non-monotonic timestamps", () => {
    const comments = [
      formattedComment(1, {
        content: "first art",
        date: 0,
      }),
      formattedComment(2, {
        content: "second art",
        date: 20,
      }),
      formattedComment(3, {
        content: "third art",
        date: 10,
      }),
    ];
    const result = changeCALayer(
      comments,
      createConfig({
        sameCATimestampRange: 10,
      }),
    );

    expect(result.map((comment) => comment.layer)).toEqual([0, 1, 0]);
  });

  test("does not expand buckets without bounds for infinite timestamp range", () => {
    const comments = Array.from({ length: 20 }, (_, index) =>
      formattedComment(index + 1, {
        content: `wide range art ${index}`,
        date: index * 10_000,
      }),
    );
    const result = changeCALayer(
      comments,
      createConfig({
        sameCATimestampRange: Infinity,
      }),
    );

    expect(result.map((comment) => comment.layer)).toEqual(
      Array.from({ length: comments.length }, () => 0),
    );
  });

  test("uses bounded duplicate keys for long comment art content", () => {
    const longContent = "x".repeat(100_000);
    const comments = [
      formattedComment(1, {
        content: longContent,
        date: 1_700_000_000,
        vpos: 100,
      }),
      formattedComment(2, {
        content: longContent,
        date: 1_700_003_600,
        vpos: 150,
        mail: ["ca", "ca"],
      }),
    ];
    const config = createConfig();
    const originalSet = Map.prototype.set;
    const stringKeyLengths: number[] = [];
    Map.prototype.set = function setWithKeyLength<K, V>(
      this: Map<K, V>,
      key: K,
      value: V,
    ) {
      if (typeof key === "string") {
        stringKeyLengths.push(key.length);
      }
      return originalSet.call(this, key, value);
    } as typeof Map.prototype.set;

    try {
      expect(changeCALayer(comments, config)).toHaveLength(1);
    } finally {
      Map.prototype.set = originalSet;
    }

    expect(stringKeyLengths.length).toBeGreaterThan(0);
    expect(Math.max(...stringKeyLengths)).toBeLessThan(160);
  });

  test("deduplicates comment art after normalizing mail order and duplicates", () => {
    const comments = [
      formattedComment(1, {
        content: "same art",
        date: 1_700_000_000,
        vpos: 200,
        mail: ["red", "blue", "ca"],
      }),
      formattedComment(2, {
        content: "same art",
        date: 1_700_003_600,
        vpos: 250,
        mail: ["ca", "blue", "red", "red", "ca"],
      }),
    ];

    const result = changeCALayer(comments, createConfig());

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(1);
  });
});
