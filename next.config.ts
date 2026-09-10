import type { NextConfig } from "next";

// Article covers live in the public Supabase storage bucket. Allowing that one host lets
// next/image resize them per device — the originals are 1536×1024 JPEGs and a listing card
// shows them at roughly 400px wide, so serving the original to a phone wastes most of the bytes.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  // Self-hosted on a Jino VPS behind nginx rather than on Vercel. "standalone" emits a
  // .next/standalone directory carrying its own minimal node_modules, so a release is a single
  // tarball and the server never needs a full npm install.
  output: "standalone",
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

export default nextConfig;
