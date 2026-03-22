# Personal Site

Dark-theme personal/resume site built with Next.js 16, TypeScript, and Tailwind CSS v4. Based on the [resume-cv Framer template](https://resume-cv.framer.website/).

## Editing your content

**All text is in one file: [`content.ts`](./content.ts)**

Open it and change the values. No code knowledge needed.

| Field | What it controls |
|---|---|
| `name` | Your name everywhere on the site |
| `role` | Your title under your name |
| `location` | Third line of the hero heading |
| `availableForWork` | Set `false` to hide the "Available to chat" badge |
| `heroIntro` | First line of the hero heading |
| `typewriterWords` | Words that cycle in the green typewriter animation |
| `about` | Bio paragraph in the hero |
| `stats` | The 4 numbers below your bio |
| `experience` | Work history cards (company, role, dates, location, bullets) |
| `education` | Education cards (title, institution, dates, description) |
| `skills` | Skill cards — only first 8 shown |
| `software` | Software cards — only first 6 shown |
| `contact` | Phone, email, address, and social profile URLs |

## Adding your photo

Drop your photo into the `public/` folder as `photo.jpg`, then open [`app/page.tsx`](./app/page.tsx) and find the photo placeholder block. Replace the `<User ... />` line with:

```tsx
<img src="/photo.jpg" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
```

## Custom logos and icons

The site uses letter initials as placeholders wherever a logo would appear. Here's how to replace each:

### Company logos (Experience section)

Each job card shows the first letter of the company name. To use a real logo, add a logo image to `public/logos/` and update the `experience` array in `content.ts` to include an `logo` field, then edit the `InitialBox` usage in `app/page.tsx` to render an `<img>` instead.

Alternatively, for a quick upgrade you can use a service like [Clearbit Logo API](https://clearbit.com/logo) which serves company logos by domain — no files needed.

### School logos (Education section)

Same approach as company logos. Add images to `public/logos/` and swap out the `InitialBox` component.

### Skill and software icons (Skills / Software sections)

Currently show a colored letter initial. To use real brand logos, install `simple-icons`:

```bash
npm install simple-icons
```

Then import the icon by name (e.g. `siFigma`, `siJira`) and render its `svg` string. The `CATEGORY_COLORS` map in `page.tsx` controls the colored backgrounds.

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech stack

- **Next.js 16** — App Router, `"use client"` for typewriter animation
- **TypeScript**
- **Tailwind CSS v4**
- **Space Grotesk** — body and headings (via `next/font/google`)
- **Clash Grotesk** — typewriter animation line (via Fontshare CDN `<link>`)
- **@phosphor-icons/react** — all icons throughout the site (`weight="fill"`)
