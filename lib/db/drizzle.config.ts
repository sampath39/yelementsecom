import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://postgres.ffwcjepemcvkipgjfxbb:Sampath@6139@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres",
  },
});
