import { describe, it, expect } from "vitest";
import { generateId, nowISO, cn } from "../utils";

describe("generateId", () => {
  it("ユニークなIDを生成する", () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it("文字列を返す", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("UUID形式のIDを返す", () => {
    const id = generateId();
    // UUID v4 形式にマッチ
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  it("高速な連続呼び出しでも衝突しない", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(100);
  });
});

describe("nowISO", () => {
  it("ISO 8601 形式の文字列を返す", () => {
    const result = nowISO();
    // ISO 8601 形式にマッチするかチェック
    expect(result).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );
  });

  it("現在時刻に近い値を返す", () => {
    const before = Date.now();
    const result = new Date(nowISO()).getTime();
    const after = Date.now();
    expect(result).toBeGreaterThanOrEqual(before);
    expect(result).toBeLessThanOrEqual(after);
  });
});

describe("cn", () => {
  it("複数のクラス名をマージする", () => {
    const result = cn("foo", "bar");
    expect(result).toBe("foo bar");
  });

  it("条件付きクラス名を処理する", () => {
    const result = cn("base", true && "active", false && "hidden");
    expect(result).toBe("base active");
  });

  it("Tailwind クラスの重複を解消する", () => {
    const result = cn("px-2", "px-4");
    expect(result).toBe("px-4");
  });

  it("空文字列やundefinedを除外する", () => {
    const result = cn("foo", "", undefined, "bar");
    expect(result).toBe("foo bar");
  });
});
