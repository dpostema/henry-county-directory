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

  const { getOwnerBusinessLimit } = await import("@/utils/entitlements");
  const limitCheck = await getOwnerBusinessLimit(user.id, supabase);
  if (!limitCheck.canAdd) {
    return { error: `You have reached your limit of ${limitCheck.maxAllowed} businesses for your current plan. Please upgrade to add more.` };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const streetAddress = formData.get("streetAddress") as string;
  const state = formData.get("state") as string;
  const postalCode = formData.get("postalCode") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const website = formData.get("website") as string;
  const categoryId = formData.get("categoryId") as string;
  const cityId = formData.get("cityId") as string;
  const hoursJsonStr = formData.get("hours_json") as string;
  const coverImage = formData.get("coverImage") as File | null;

  if (!name || !categoryId || !cityId) {
    return { error: "Name, Category, and City are required fields." };
  }

  // Combine address fields
  let fullAddress = streetAddress || "";
  if (state || postalCode) {
    fullAddress += (fullAddress ? ", " : "") + (state ? state + " " : "") + (postalCode || "");
  }

  // Parse hours JSON
  let hoursJson: Record<string, any> = {};
  try {
    if (hoursJsonStr) {
      hoursJson = JSON.parse(hoursJsonStr);
    } else {
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      days.forEach((day) => {
        hoursJson[day] = { open: "09:00", close: "17:00", closed: day === "Sunday" };
      });
    }
  } catch (e) {
    console.error("Failed to parse hours_json", e);
  }

  // Generate a basic slug
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "") + "-" + Math.floor(Math.random() * 1000);

  let coverImageUrl = null;
  let media: { url: string }[] = [];

  if (coverImage && coverImage.size > 0) {
    const fileExt = coverImage.name.split('.').pop() || 'jpg';
    const fileName = `${slug}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('business-images')
      .upload(fileName, coverImage);

    if (uploadError) {
      console.error("Error uploading image:", uploadError);
      // Non-fatal, we can still create the business but without the image
    } else {
      const { data: publicUrlData } = supabase.storage
        .from('business-images')
        .getPublicUrl(fileName);

      if (publicUrlData) {
        coverImageUrl = publicUrlData.publicUrl;
        media = [{ url: coverImageUrl }];
      }
    }
  }

  const { error } = await supabase
    .from("businesses")
    .insert({
      name,
      slug,
      description: description || null,
      address: fullAddress || null,
      phone: phone || null,
      email: email || null,
      website: website || null,
      category_id: categoryId,
      city_id: cityId,
      hours_json: hoursJson,
      cover_image_url: coverImageUrl,
      media: media.length > 0 ? media : null,
      owner_id: user.id,
      status: "claimed",
      verification_level: "claimed_unverified", // Soft claim, pending admin approval
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/listings");
  redirect("/dashboard");
}
