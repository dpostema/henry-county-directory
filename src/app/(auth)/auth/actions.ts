"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const role = formData.get("role") as string; // 'visitor' or 'owner'
  const origin = formData.get("origin") as string || process.env.NEXT_PUBLIC_SITE_URL;
  const avatar = formData.get("avatar") as File | null;

  if (!email || !password || !fullName || !role) {
    return { error: "All fields are required." };
  }

  let avatarUrl: string | undefined = undefined;

  // Try to upload the avatar if provided
  if (avatar && avatar.size > 0) {
    const fileExt = avatar.name.split('.').pop() || 'jpg';
    const fileName = `avatar_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('business-images')
      .upload(fileName, avatar);
      
    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage
        .from('business-images')
        .getPublicUrl(fileName);
      if (publicUrlData) {
        avatarUrl = publicUrlData.publicUrl;
      }
    } else {
      console.error("Avatar upload error during signup:", uploadError);
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: origin ? `${origin}/dashboard` : undefined,
      data: {
        full_name: fullName,
        role: role,
        avatar_url: avatarUrl,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data?.session) {
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  return { success: "Account created successfully! Check your email for verification link." };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth/login");
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const origin = formData.get("origin") as string;

  if (!email) {
    return { error: "Email is required." };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Reset link has been sent to your email." };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = formData.get("password") as string;

  if (!password) {
    return { error: "Password is required." };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  return { success: "Password updated successfully!" };
}
