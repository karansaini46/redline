"use client";

import { useState } from "react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, User, Building2, CreditCard, ShieldAlert, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { updateSettings } from "../actions";

const PRESET_AVATARS = [
  "https://api.dicebear.com/9.x/micah/svg?seed=Alexander&backgroundColor=transparent",
  "https://api.dicebear.com/9.x/micah/svg?seed=Luna&backgroundColor=transparent",
  "https://api.dicebear.com/9.x/micah/svg?seed=Felix&backgroundColor=transparent",
  "https://api.dicebear.com/9.x/micah/svg?seed=Sophia&backgroundColor=transparent",
  "https://api.dicebear.com/9.x/micah/svg?seed=James&backgroundColor=transparent"
];

export function SettingsClient({ 
  initialOrgName = "Organization",
  initialUserName = "User",
  initialUserEmail = "user@example.com"
}: { 
  initialOrgName?: string;
  initialUserName?: string;
  initialUserEmail?: string;
}) {
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0]);
  const [isSaving, setIsSaving] = useState(false);

  const [userName, setUserName] = useState(initialUserName || "");
  const [userEmail, setUserEmail] = useState(initialUserEmail || "");
  const [orgName, setOrgName] = useState(initialOrgName || "");

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({ name: userName, email: userEmail, orgName });
      localStorage.setItem("userAvatar", selectedAvatar);
      window.dispatchEvent(new CustomEvent("avatarChanged", { detail: selectedAvatar }));
      toast.success("Settings saved successfully.");
    } catch (error) {
      toast.error("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in max-w-4xl">
      {/* Top Header */}
      <FadeIn className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2 mb-8 border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight mb-1 text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground font-light">Manage your organization and personal preferences.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={isSaving}
            className="shadow-none bg-foreground hover:bg-foreground/90 text-background rounded-xl gap-2 transition-all w-[140px]"
          >
            {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </FadeIn>

      <StaggerContainer className="flex flex-col gap-8">
        
        {/* Profile Settings */}
        <StaggerItem>
          <div className="rounded-xl border border-border/50 bg-surface shadow-sm flex flex-col hover:border-foreground/20 transition-colors overflow-hidden">
            <div className="flex items-center gap-2 p-6 border-b border-border/50 bg-muted/20">
              <User className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-medium font-serif tracking-tight">Personal Profile</h3>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground uppercase tracking-wider">Full Name</label>
                <Input value={userName} onChange={(e) => setUserName(e.target.value)} className="rounded-xl bg-background border-border/50 focus-visible:ring-1 focus-visible:border-foreground" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground uppercase tracking-wider">Email Address</label>
                <Input value={userEmail} onChange={(e) => setUserEmail(e.target.value)} type="email" className="rounded-xl bg-background border-border/50 focus-visible:ring-1 focus-visible:border-foreground" />
              </div>
            </div>

            {/* Avatar Selection */}
            <div className="px-6 pb-6 pt-2">
              <div className="border-t border-border/50 pt-6">
                <label className="text-xs font-medium text-foreground uppercase tracking-wider block mb-4">Profile Avatar</label>
                <div className="flex items-center gap-4">
                  {PRESET_AVATARS.map((url) => (
                    <div 
                      key={url}
                      onClick={() => setSelectedAvatar(url)}
                      className={`rounded-full p-1 cursor-pointer transition-all duration-300 ease-out ${
                        selectedAvatar === url 
                          ? "ring-2 ring-foreground scale-110 shadow-md bg-background" 
                          : "hover:scale-110 opacity-60 hover:opacity-100 ring-1 ring-transparent hover:ring-border"
                      }`}
                    >
                      <Avatar className="size-12">
                        <AvatarImage src={url} alt="Preset Avatar" />
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </StaggerItem>

        {/* Organization Settings */}
        <StaggerItem>
          <div className="rounded-xl border border-border/50 bg-surface shadow-sm flex flex-col hover:border-foreground/20 transition-colors overflow-hidden">
            <div className="flex items-center gap-2 p-6 border-b border-border/50 bg-muted/20">
              <Building2 className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-medium font-serif tracking-tight">Organization Workspace</h3>
            </div>
            <div className="p-6 grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground uppercase tracking-wider">Workspace Name</label>
                <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} className="rounded-xl bg-background border-border/50 focus-visible:ring-1 focus-visible:border-foreground max-w-md" />
                <p className="text-xs text-muted-foreground font-light pt-1">This is your company's visible name across the platform.</p>
              </div>
            </div>
          </div>
        </StaggerItem>

        {/* Billing */}
        <StaggerItem>
          <div className="rounded-xl border border-border/50 bg-surface shadow-sm flex flex-col hover:border-foreground/20 transition-colors overflow-hidden">
            <div className="flex items-center gap-2 p-6 border-b border-border/50 bg-muted/20">
              <CreditCard className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-medium font-serif tracking-tight">Billing & Subscription</h3>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between p-4 border border-border/50 bg-background rounded-xl">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-foreground">Enterprise Plan</h4>
                    <span className="text-[10px] font-medium px-2 py-0.5 bg-primary/10 text-primary uppercase tracking-widest border border-primary/20 rounded-full">Active</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-light">Unlimited AI extractions and team members.</p>
                </div>
                <Button variant="outline" size="sm" className="rounded-xl border-border shadow-none bg-transparent hover:bg-muted/50">
                  Manage Billing
                </Button>
              </div>
            </div>
          </div>
        </StaggerItem>

        {/* Danger Zone */}
        <StaggerItem>
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 shadow-sm flex flex-col transition-colors overflow-hidden">
            <div className="flex items-center gap-2 p-6 border-b border-destructive/20 bg-destructive/10">
              <ShieldAlert className="size-4 text-destructive" />
              <h3 className="text-sm font-medium font-serif tracking-tight text-destructive">Danger Zone</h3>
            </div>
            <div className="p-6 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-foreground mb-1">Delete Workspace</h4>
                <p className="text-xs text-muted-foreground font-light">Permanently delete this organization and all its data. This action cannot be undone.</p>
              </div>
              <Button variant="destructive" size="sm" className="rounded-xl shadow-none bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                Delete Organization
              </Button>
            </div>
          </div>
        </StaggerItem>

      </StaggerContainer>
    </div>
  );
}
