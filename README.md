RCO IT Help Site
An internal IT portal for Rowe Casa Organics staff. Hosted on GitHub Pages.

Live Site: https://hhowell116.github.io/IT-Survey-Site/

Features

Google Auth — Sign in with Google, restricted to @rowecasaorganics.com accounts only. Sessions persist across devices. Unauthenticated users are redirected to login.html.
Technology & Application Discovery Survey — Collects a full inventory of tools and accounts per department. Includes conditional logic that shows only relevant tool categories based on the user's selected department.
Request Forms — User Onboarding, Offboarding, and Equipment/Software Request forms (in progress).
My Completed Tab — Submissions are saved to Firestore and tied to the user's account, visible across any device.
Contact IT Support — Opens Gmail with itsupport@rowecasaorganics.com and the user's message pre-filled.
Google Sheets Integration — Survey responses are sent to a Google Sheet via Apps Script. Only filled-in tool rows are written to keep the sheet compact.
Styling — Sourced from RCO brand. Fully responsive with dark mode support.


Firebase

Auth: Google provider, @rowecasaorganics.com domain enforced in code and Firestore rules.
Firestore database: submissions — stores survey title, department, user email, timestamp, and survey URL.
Rules: Only authenticated @rowecasaorganics.com users can read/write.

