# Mentality Jiu Jitsu

Single-page website for Mentality Jiu Jitsu — Brazilian Jiu Jitsu and Muay Thai.

## Files

| File | Purpose |
|---|---|
| `index.html` | The entire site — HTML, CSS and JS in one file |
| `hero.mp4` | Background loop for the hero section |
| `hero-poster.jpg` | Still frame shown before the video loads |
| `Mentality-Jiu-Jitsu-Your-First-Month.pdf` | Beginner's guide, offered on the lead form |
| `fonts/` | Licensed PP Neue Montreal + PP Supply Mono webfonts |
| `Code.gs` | Apps Script form receiver (not served; kept as a backup) |

All three must stay in the same folder. `index.html` references the other two
by relative path.

## Local preview

Do **not** open `index.html` by double-clicking it — browsers block video over
`file://` and you'll see the poster with no playback. Serve it over HTTP:

```
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Booking form → Google Sheets

Both forms (trial booking and the beginner's guide) post to a Google Apps
Script web app that writes each submission into a Google Sheet.

1. Create a Google Sheet, then **Extensions → Apps Script**.
2. Paste in `Code.gs` from this repo, replacing the default file. Save.
3. **Deploy → New deployment → Web app**, with:
   - Execute as: **Me**
   - Who has access: **Anyone** — *not* "Anyone with a Google account",
     since site visitors are not signed in.
4. Copy the `/exec` URL and paste it into `ENDPOINT` in `index.html`
   (search for `var ENDPOINT`). That is the only line to change.

Tabs named **Trial bookings** and **Guide downloads** are created
automatically on first submission, with headers.

To get an email on every booking, set `NOTIFY_EMAIL` at the top of `Code.gs`.

**While `ENDPOINT` is empty the forms stay in demo mode** — they validate and
show the confirmation, but send nothing.

After editing `Code.gs`, redeploy via **Deploy → Manage deployments → pencil
→ Version: New version**. Saving alone does not update the live URL.

## Brand fonts

**PP Neue Montreal Medium** and **PP Supply Mono Regular** are licensed
(Pangram Pangram) and self-hosted from `fonts/`. Both files must be uploaded
with the site or display type falls back to the system sans.

Inter is still loaded from Google Fonts for body copy, which the brand
guidelines specify for long-form text.

## Brand colours

| Colour | Hex | Use |
|---|---|---|
| Black | `#171717` | Backgrounds, emphasis text on light |
| White | `#E9E5D9` | Backgrounds, emphasis text on dark |
| Grey | `#75726B` | Body copy and supporting text |

Both logos are the official artwork: the logomark is inline SVG extracted from
`MJJLogo_Print_Logomark_White.pdf`, and the wordmark is Logo Variation 02 used
as an alpha mask so it always paints in a brand colour.
