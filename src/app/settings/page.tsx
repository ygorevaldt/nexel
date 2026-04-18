import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { findProfileByUserId, upsertProfile } from "@/repositories/ProfileRepository";
import { findUserById } from "@/repositories/UserRepository";
import { ProfileNameForm } from "./_components/ProfileNameForm";
import { PasswordForm } from "./_components/PasswordForm";
import { ContactInfoForm } from "./_components/ContactInfoForm";
import { Settings } from "lucide-react";

export const metadata = {
  title: "Configurações | Nexel",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  let profile = await findProfileByUserId(session.user.id);
  if (!profile) {
    const user = await findUserById(session.user.id);
    if (!user) redirect("/login");
    profile = await upsertProfile(session.user.id, {
      game_id: user.freefire_id,
      nickname: user.name,
    });
  }

  const contactInfo = {
    discord: profile.contact_info?.discord ?? "",
    whatsapp: profile.contact_info?.whatsapp ?? "",
    email: profile.contact_info?.email ?? "",
    instagram: profile.contact_info?.instagram ?? "",
  };

  return (
    <div className="container max-w-2xl mx-auto py-8 md:py-12 px-4 md:px-8 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Configurações</h1>
          <p className="text-sm text-muted-foreground">Gerencie seu perfil e informações de conta.</p>
        </div>
      </div>

      <ProfileNameForm initialNickname={profile.nickname} />
      <PasswordForm />
      <ContactInfoForm initialContactInfo={contactInfo} />
    </div>
  );
}
