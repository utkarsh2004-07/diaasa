export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import AdminSettingsClient from "@/components/admin/AdminSettingsClient";

async function getSettings() {
  const settings = await prisma.setting.findMany();
  return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);
}

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  return <AdminSettingsClient settings={settings} />;
}
