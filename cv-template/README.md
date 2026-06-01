# One-Page CV Template

This folder is an anonymous editable CV template. It does not include a personal photo, real contact details, or direct personal links by default.

## What to Edit

Open `cv-data.json` and change only the text inside quotes.

Common edits:

- `name`: first and last name.
- `subtitleLines`: the two lines under the name.
- `contact`: phone, email, location, and links.
- `about`: the About Me paragraph.
- `skills`: left-column skills.
- `experience`: right-column jobs.
- `education`: degrees, schools, dates, and bullet points.
- `languages`: language list.
- `photoPath`: optional path to a profile image. Leave it empty to use the initials placeholder.
- `outputPdf`: where the finished PDF should be saved. The default saves into `cv-template/out`.

## Links

The default template does not include real links. To add a clickable link, use this format:

```json
{
  "label": "LinkedIn",
  "url": "https://example.com"
}
```

For plain text with no link, use:

```json
{
  "label": "Netherlands"
}
```

## Line Breaks

To force a line break in a title, use `<br>` inside `degreeHtml`.

Example:

```json
"degreeHtml": "Bachelor of Arts in Archaeology<br><span class=\"nowrap\">and Cultural Resources Management</span>"
```

`nowrap` keeps those words together on one line.

## Build the PDF

From the main workspace folder, run:

```powershell
node cv-template/build-template.mjs
```

The script creates an A4 one-page PDF and also writes a verification file in `cv-template/out`.

If your local Node install cannot find dependencies such as `playwright` or `pdf-lib`, install them with your package manager or adapt the command to your environment.

## Design Notes

The design is intentionally fixed so a new user only edits content:

- A4 PDF, one page.
- Two columns.
- Warm tan left sidebar.
- Serif font.
- Clickable links are blue and underlined.
- Languages stay near the bottom of the page.
