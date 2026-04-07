import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RankingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/ranking");
  }

  return children;
}
