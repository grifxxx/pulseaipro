import type { NextConfig } from "next";

// Article covers live in the public Supabase storage bucket. Allowing that one host lets
// next/image resize them per device — the originals are 1536×1024 JPEGs and a listing card
// shows them at roughly 400px wide, so serving the original to a phone wastes most of the bytes.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

export default nextConfig;
