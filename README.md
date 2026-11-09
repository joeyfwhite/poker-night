# Poker Night

A text-shareable signup page for poker night. It's a static site meant for
GitHub Pages, and it writes signups to a Google Sheet through a small Google
Apps Script backend. No build step, no server to maintain.

## Deploy it

1. Create a new Google Sheet. Any name works, e.g. "Poker Night Signups".
2. In the Sheet, go to Extensions > Apps Script. Delete the boilerplate and
   paste in the contents of `apps-script/Code.gs`. Save the project.
3. Click Deploy > New deployment. Choose type "Web app". Set "Execute as" to
   "Me" and "Who has access" to "Anyone". Click Deploy, and authorize the
   script when Google prompts you. Copy the Web App URL it gives you.
4. Open `app.js` and paste that URL into the `SCRIPT_URL` constant near the
   top, replacing the placeholder.
5. Commit and push that change. If this repo is already on GitHub Pages, the
   site will redeploy automatically within about a minute.
6. If GitHub Pages isn't enabled yet, turn it on: repo Settings > Pages >
   Source: branch "main", folder "/" (root).

## Day to day

Open the Google Sheet to see signups as they come in, live. As Venmo payments
land, manually mark the "Paid?" column Y or N for each row. If someone is
paying cash or some other way, just note that in the same column (or in
"Notes"). This column is intentionally manual: the script never guesses
whether someone paid.

## Reusing this for the next poker night

1. Update the event copy in `index.html`: the date, address, blind structure,
   roles, and FAQ text.
2. Update the constants in `app.js`: the Venmo note and the calendar dates
   used for "Add to Google Calendar" and the `.ics` download.
3. Clear out the old rows in the "Signups" sheet tab before sharing the link
   again. Alternatively, spin up a fresh Sheet and a fresh Apps Script
   deployment, and swap the new Web App URL into `app.js`.
4. Commit and push. Share the link.

That's it. No npm, no framework, no external dependencies — just HTML, CSS,
and vanilla JS served by GitHub Pages, talking to one Apps Script endpoint.
