# Cool Stuff

A product discovery site. People browse products, save favourites, add to cart and place orders through WhatsApp.

## Current status

- The full UI is finished: home, products, product page, cart and checkout, wishlist, orders, login, and the admin panel.
- Data is stored in the browser (localStorage) for now, in one file: `src/lib/api.js`.
- Supabase is connected last. `supabase/schema.sql` already has the tables, security rules, order function and image storage.

## Run locally (PowerShell)

```powershell
npm install
npm run dev
```

Open http://localhost:5173

## Test logins (temporary, local only)

- Admin: admin@coolstuff.com / admin123
- Normal user: use Sign up on the login page

The admin panel is at /admin.

## Set the WhatsApp number

Copy `.env.example` to `.env` and set `VITE_WHATSAPP_NUMBER` (country code, no plus sign, for example 919876543210). Restart `npm run dev`.

## Change theme colours

- Global colours, radius, shadows and fonts: `src/index.css` (the `@theme` block).
- Category colours: Admin panel, then Categories.

## Build and deploy

```powershell
npm run build
```

Push to GitHub, import the repo in Vercel, add the env variables, deploy. `vercel.json` already handles page refresh on nested routes.

## Connecting Supabase later

1. Create a Supabase project and run `supabase/schema.sql` in the SQL Editor.
2. Sign up on the site, then run: `update public.profiles set role = 'admin' where email = 'YOUR_EMAIL';`
3. Install `@supabase/supabase-js`, add the URL and anon key to `.env`.
4. Rewrite the functions in `src/lib/api.js` to call Supabase. Keep the same function names so the UI does not change.
5. Remove the admin test login and `src/lib/seed.js` sample data.

Note: the temporary admin password above is only for local testing and must not be used in production.
