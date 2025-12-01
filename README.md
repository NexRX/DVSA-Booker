<div align="center">
<img width="128" src="/public/logo.png" alt="logo"/>

# DVSA Test Booker 🚗📅

![](https://img.shields.io/badge/Typescript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![](https://badges.aleen42.com/src/vitejs.svg)


DVSA Test Booker is a browser extension that helps you monitor and manage UK driving test bookings on the official DVSA site. It aims to streamline the search process, gently automate repetitive steps, and keep you informed so you can find suitable test dates and centres faster.

This project focuses on being safe, respectful of the website’s rules, and helpful to users. It doesn’t bypass queues or security checks. Instead, it assists with routine tasks like navigating, searching, and notifying you about availability.

</div>

---

## What It Does 🔍

- Monitors DVSA pages and detects where you are in the booking journey (login, manage, select centre, choose date/time, confirmation).
- Helps you type details, click common actions, and search centres intelligently.
- Shows a small overlay with live status, messages, and countdown timers while waiting to retry or expand searches.
- Plays alert sounds when attention is required (e.g., matching test found, warnings).
- Includes a “Security” backoff feature to reduce rapid refresh loops when you hit a captcha or get blocked (Error 15). This helps you look less like a bot and protects your account.

---

## Key Features ✨

- Smart flow handling: Automatically moves through the DVSA “Manage” steps.
- Configurable timings:
  - Refresh after all centres loaded
  - Interval between “see more centres”
  - Percentage randomization to appear more human
  - Maximum centres to display before restarting search
- Test criteria:
  - Minimum/maximum date range
  - Allowed centres (prefix matching)
  - Allowed days of the week (Mon–Sun)
- Security backoff:
  - Tracks captcha and “banned” occurrences
  - Escalates cool-downs to slow down retries
  - Manual pause and quick reset from the popup

---

## How To Use 🛠️

1. Open the extension popup.
2. Fill in your test details:
   - Driving licence number
   - Test reference
   - Postcode to search
   - Date range and allowed centres/days
3. Configure search timings to your preference:
   - Refresh interval
   - “See more centres” interval
   - Randomization percentage
   - Max centres to load
4. Optional: Use the Security tab to apply a manual pause or reset backoff if you’ve hit captcha or Error 15.
5. Go to the DVSA test management site and let the extension assist. The overlay will display your current state, messages, and any countdowns.

---

## Privacy & Safety 🔐

- Your settings are stored locally in the browser’s extension storage.
- The extension doesn’t send your data to external servers.
- It respects DVSA’s pages and works within normal navigation limits.
- Security backoff is designed to prevent rapid, repeated actions that might trigger anti-bot systems.

---

## Troubleshooting 🧰

- Captcha / Error 15 loops:
  - Check the Security tab in the popup.
  - Apply a manual pause or use backoff resets to cool down before trying again.
- No availability:
  - Increase the time between centre expansions.
  - Reduce max centres and let the extension restart the search.
  - Widen your date range or add more allowed centres.
- Overlay not visible:
  - Ensure the extension is enabled.
  - Reload the DVSA page.
  - Check your browser’s permissions/settings for extensions.

---

## Notes & Disclaimer ⚠️

- This tool aims to assist with routine, repetitive user actions. It does not guarantee bookings or skip security measures.
- Always comply with DVSA’s terms and the law.
- Use at your own risk. The maintainers are not liable for any account actions, bans, or missed bookings.

---

## Contributing 🤝

Feedback and suggestions are welcome! If you’d like to contribute:
- Keep changes simple and easy to maintain.
- Focus on user experience, clarity, and reliability.
