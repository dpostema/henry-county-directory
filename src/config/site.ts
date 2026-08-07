export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Henry County Directory",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://henrycountydirectory.com",
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "Find great places to stay, eat, shop, or visit from local experts.",
  domain: process.env.NEXT_PUBLIC_SITE_DOMAIN || "henrycountydirectory.com",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "support@henrycountydirectory.com",
  cookieConsentKey: process.env.NEXT_PUBLIC_COOKIE_CONSENT_KEY || "app_cookie_consent"
};
