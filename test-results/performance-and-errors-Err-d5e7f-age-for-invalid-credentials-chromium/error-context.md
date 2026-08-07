# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: performance-and-errors.spec.ts >> Error Handling >> Login: shows error message for invalid credentials
- Location: e2e\performance-and-errors.spec.ts:106:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.bg-red-50')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('.bg-red-50')

```

```yaml
- text: WELCOME TO
- link "Henry County Directory Logo Henry County Directory":
  - /url: /
  - img "Henry County Directory Logo"
  - heading "Henry County Directory" [level=1]
- paragraph: Log in to get in-the-moment updates on local businesses and listings.
- textbox "Email Address"
- textbox "Password"
- button
- link "Forgot password?":
  - /url: /auth/reset-password
- button "SIGN IN"
- text: Don't have an account?
- link "Sign Up Now":
  - /url: /auth/signup
- text: Or
- paragraph: Continue with social media
- button "Google"
- button "Share"
- button "Email"
- button "Chat"
- img "Henry County Directory Logo"
- heading "Henry County Directory" [level=2]
- paragraph: Discover local businesses, manage your claimed directory profiles, interact with customer reviews, and grow your local presence.
- alert
- paragraph: We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
- button "Decline"
- button "Accept All"
- button "Close"
```

# Test source

```ts
  12  |     await page.goto('/', { waitUntil: 'domcontentloaded' });
  13  |     const loadTime = Date.now() - start;
  14  |     console.log(`Homepage domcontentloaded: ${loadTime}ms`);
  15  |     expect(loadTime).toBeLessThan(12000);
  16  |   });
  17  | 
  18  |   test('Homepage: largest visible image is rendered (LCP proxy)', async ({ page }) => {
  19  |     await page.goto('/', { waitUntil: 'networkidle' });
  20  |     const heroImg = page.locator('section img').first();
  21  |     await expect(heroImg).toBeVisible({ timeout: 15000 });
  22  |   });
  23  | 
  24  |   test('Homepage: no layout shifts — page height stable after lazy load', async ({ page }) => {
  25  |     await page.goto('/', { waitUntil: 'networkidle' });
  26  |     const heightBefore = await page.evaluate(() => document.documentElement.scrollHeight);
  27  |     await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  28  |     await page.waitForTimeout(1500);
  29  |     const heightAfter = await page.evaluate(() => document.documentElement.scrollHeight);
  30  |     // Allow for minor lazy-load height changes (< 500px considered acceptable in dev)
  31  |     expect(Math.abs(heightAfter - heightBefore)).toBeLessThan(500);
  32  |   });
  33  | 
  34  |   test('Login page: loads within 10 seconds (dev budget)', async ({ page }) => {
  35  |     const start = Date.now();
  36  |     await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
  37  |     const loadTime = Date.now() - start;
  38  |     console.log(`Login domcontentloaded: ${loadTime}ms`);
  39  |     expect(loadTime).toBeLessThan(10000);
  40  |   });
  41  | 
  42  |   test('Listings page: renders at least one article card within 15 seconds', async ({ page }) => {
  43  |     await page.goto('/', { waitUntil: 'networkidle' });
  44  |     const card = page.locator('article').first();
  45  |     await expect(card).toBeVisible({ timeout: 15000 });
  46  |   });
  47  | 
  48  |   test('404 page: loads within 10 seconds (dev budget)', async ({ page }) => {
  49  |     const start = Date.now();
  50  |     await page.goto('/this-does-not-exist-xyz', { waitUntil: 'domcontentloaded' });
  51  |     const loadTime = Date.now() - start;
  52  |     console.log(`404 domcontentloaded: ${loadTime}ms`);
  53  |     expect(loadTime).toBeLessThan(10000);
  54  |   });
  55  | 
  56  |   test('No console errors on homepage', async ({ page }) => {
  57  |     const errors: string[] = [];
  58  |     page.on('console', (msg) => {
  59  |       if (msg.type() === 'error') errors.push(msg.text());
  60  |     });
  61  |     await page.goto('/', { waitUntil: 'networkidle' });
  62  |     const criticalErrors = errors.filter(
  63  |       (e) =>
  64  |         !e.includes('service-worker') &&
  65  |         !e.includes('favicon') &&
  66  |         !e.includes('net::ERR') // Supabase realtime may fail in dev
  67  |     );
  68  |     if (criticalErrors.length > 0) console.warn('Console errors:', criticalErrors);
  69  |     expect(criticalErrors).toHaveLength(0);
  70  |   });
  71  | 
  72  |   test('No 5xx server errors on homepage', async ({ page }) => {
  73  |     const serverErrors: string[] = [];
  74  |     page.on('response', (response) => {
  75  |       if (response.status() >= 500) {
  76  |         serverErrors.push(`[${response.status()}] ${response.url()}`);
  77  |       }
  78  |     });
  79  |     await page.goto('/', { waitUntil: 'networkidle' });
  80  |     if (serverErrors.length > 0) console.warn('5xx errors:', serverErrors);
  81  |     expect(serverErrors).toHaveLength(0);
  82  |   });
  83  | });
  84  | 
  85  | // ─────────────────────────────────────────────────────────────────────────────
  86  | // ERROR HANDLING TESTS
  87  | // The auth pages use placeholder= (no <label> elements), so we use
  88  | // getByPlaceholder() instead of getByLabel().
  89  | // ─────────────────────────────────────────────────────────────────────────────
  90  | test.describe('Error Handling', () => {
  91  | 
  92  |   test('404 page: shows "Page Not Found" heading', async ({ page }) => {
  93  |     await page.goto('/listings/this-slug-does-not-exist-xyz', { waitUntil: 'domcontentloaded' });
  94  |     await expect(page.getByRole('heading', { name: /Page Not Found/i })).toBeVisible({ timeout: 10000 });
  95  |   });
  96  | 
  97  |   test('Login: stays on login page with invalid credentials', async ({ page }) => {
  98  |     await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
  99  |     await page.getByPlaceholder('Email Address').fill('nobody@fake-test-domain.com');
  100 |     await page.getByPlaceholder('Password').fill('wrongpassword123');
  101 |     await page.getByRole('button', { name: /sign in/i }).click();
  102 |     // Should NOT navigate away from login
  103 |     await expect(page).toHaveURL(/\/auth\/login/, { timeout: 8000 });
  104 |   });
  105 | 
  106 |   test('Login: shows error message for invalid credentials', async ({ page }) => {
  107 |     await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
  108 |     await page.getByPlaceholder('Email Address').fill('nobody@fake-test-domain.com');
  109 |     await page.getByPlaceholder('Password').fill('wrongpassword123');
  110 |     await page.getByRole('button', { name: /sign in/i }).click();
  111 |     // Either inline error message or a toast
> 112 |     await expect(page.locator('.bg-red-50')).toBeVisible({ timeout: 15000 });
      |                                              ^ Error: expect(locator).toBeVisible() failed
  113 |   });
  114 | 
  115 |   test('Login: empty form submission stays on login page (HTML5 validation)', async ({ page }) => {
  116 |     await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
  117 |     await page.getByRole('button', { name: /sign in/i }).click();
  118 |     // HTML5 required attribute should block navigation
  119 |     await expect(page).toHaveURL(/\/auth\/login/);
  120 |   });
  121 | 
  122 |   test('Signup: page loads with all required fields', async ({ page }) => {
  123 |     await page.goto('/auth/signup', { waitUntil: 'domcontentloaded' });
  124 |     await expect(page.getByPlaceholder('Full Name')).toBeVisible({ timeout: 8000 });
  125 |     await expect(page.getByPlaceholder('Email Address')).toBeVisible();
  126 |     await expect(page.getByPlaceholder('Password')).toBeVisible();
  127 |   });
  128 | 
  129 |   test('Signup: empty form submission stays on signup page', async ({ page }) => {
  130 |     await page.goto('/auth/signup', { waitUntil: 'domcontentloaded' });
  131 |     await page.getByRole('button', { name: /create account/i }).click();
  132 |     await expect(page).toHaveURL(/\/auth\/signup/);
  133 |   });
  134 | 
  135 |   test('Reset password: form is visible and submittable', async ({ page }) => {
  136 |     await page.goto('/auth/reset-password', { waitUntil: 'domcontentloaded' });
  137 |     await expect(page.getByPlaceholder('Email Address')).toBeVisible({ timeout: 8000 });
  138 |     await page.getByPlaceholder('Email Address').fill('nobody@fake-test-domain.com');
  139 |     await page.getByRole('button', { name: /send|reset|continue/i }).click();
  140 |     // Should stay on reset page and show some response
  141 |     await expect(page).toHaveURL(/\/auth\/reset-password/);
  142 |     await expect(
  143 |       page.getByText(/sent|check your email|error|invalid|otp|instructions/i)
  144 |     ).toBeVisible({ timeout: 10000 });
  145 |   });
  146 | 
  147 |   test('Category page: unknown slug returns non-500 response', async ({ page }) => {
  148 |     const response = await page.goto('/category/fake-category-xyz');
  149 |     expect(response?.status()).toBeLessThan(500);
  150 |   });
  151 | 
  152 |   test('City page: unknown city slug returns non-500 response', async ({ page }) => {
  153 |     const response = await page.goto('/city/fake-city-xyz');
  154 |     expect(response?.status()).toBeLessThan(500);
  155 |   });
  156 | 
  157 |   test('Rate limiter: /api/contact returns 400 or 200 (route is alive)', async ({ page }) => {
  158 |     // Playwright requests from localhost will have no x-forwarded-for header,
  159 |     // so the rate limiter won't fire — but we still verify the route exists
  160 |     // and doesn't return 500.
  161 |     const response = await page.request.post('/api/contact', {
  162 |       data: { name: 'Test', email: 'test@test.com', message: 'Hello' },
  163 |     });
  164 |     console.log(`/api/contact status: ${response.status()}`);
  165 |     // Should be 200 (success), 400 (validation), or 429 (rate-limited) — never 500
  166 |     expect(response.status()).not.toBe(500);
  167 |     // expect(response.status()).not.toBe(404); // Allow 404 since /api/contact doesn't actually exist in this project
  168 |   });
  169 | 
  170 |   test('Add listing: unauthenticated users are redirected to login', async ({ page }) => {
  171 |     await page.goto('/add-listing', { waitUntil: 'domcontentloaded' });
  172 |     await expect(page).toHaveURL(/\/auth\/login/, { timeout: 8000 });
  173 |   });
  174 | 
  175 |   test('Dashboard: unauthenticated users are redirected to login', async ({ page }) => {
  176 |     await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  177 |     await expect(page).toHaveURL(/\/auth\/login/, { timeout: 8000 });
  178 |   });
  179 | 
  180 |   test('Admin page: unauthenticated users cannot see admin UI', async ({ page }) => {
  181 |     await page.goto('/admin', { waitUntil: 'domcontentloaded' });
  182 |     const url = page.url();
  183 |     const isRedirectedToLogin = url.includes('/auth/login');
  184 |     const adminUiVisible = await page.getByText('Admin Control Panel').isVisible().catch(() => false);
  185 |     // Either redirected to login, or admin UI is not rendered
  186 |     expect(isRedirectedToLogin || !adminUiVisible).toBeTruthy();
  187 |   });
  188 | });
  189 | 
```