import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 允许局域网 IP 访问 Next.js dev 资源（_next/*、HMR），方便在 iPhone / 其他设备调试
  allowedDevOrigins: ["192.168.5.157"],
};

export default nextConfig;
