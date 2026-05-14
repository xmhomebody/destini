"use client";

import { useEffect } from "react";
import { consumeUrlToken } from "@/lib/userAuth";

/**
 * 应用挂载时执行 URL 唤回链接处理：
 *  - 若 URL 含 ?token=...，解码后写入 localStorage 并清除 URL 中的 token
 *  - 该组件不渲染任何 DOM
 */
export function UrlTokenInit() {
  useEffect(() => {
    consumeUrlToken();
  }, []);
  return null;
}
