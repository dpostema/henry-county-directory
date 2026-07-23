"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function createListingAction(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in to create a listing." };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const address = formData.get("address") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const website = formData.get("website") as string;
  const categoryId = formData.get("categoryId") as string;
  const cityId = formData.get("cityId") as string;

  if (!name || !categoryId || !cityId) {
    return { error: "Name, Category, and City are required fields." };
  }

  // Compile default hours JSON
  const hoursJson: Record<string, { open: string; close: string }> = {};
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  days.forEach((day) => {
    hoursJson[day] = {
      open: "09:00",
      close: "17:00",
    };
  });

  // Generate a basic slug
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "") + "-" + Math.floor(Math.random() * 1000);

  const { error } = await supabase
    .from("businesses")
    .insert({
      name,
      slug,
      description: description || null,
      address: address || null,
      phone: phone || null,
      email: email || null,
      website: website || null,
      category_id: categoryId,
      city_id: cityId,
      hours_json: hoursJson,
      owner_id: user.id,
      status: "claimed_unverified", // Soft claim, pending admin approval
      verification_level: "unverified",
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/directory");
  redirect("/dashboard");
}
