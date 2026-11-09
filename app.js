// Set this after deploying apps-script/Code.gs as a Web App. See README.md
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwkQYnrUfnAqVZrVM_M5_wCOnE5_UQf9uConXKvPZMuD_dqijdbubfWcu_R7_92mrUO/exec";

const ENTRY_FEE = 50;
const PRIMARY_CAP = 24;
const OVERFLOW_CAP = 32;
const VENMO_HANDLE = "joey-white-1";
const EVENT_LOCATION = "The White House, 2073 McKinley Rd NW, Atlanta, GA 30318";
const OVERFLOW_FULL_MESSAGE = "Tournament full. Message Joey directly to ask about an overflow spot.";

function isScriptUrlConfigured() {
  return SCRIPT_URL !== "REPLACE_WITH_APPS_SCRIPT_WEB_APP_URL";
}

// ---------- Stat tiles ----------

const statSpots = document.getElementById("statSpots");
const statSpotsLabel = document.getElementById("statSpotsLabel");
const statPot = document.getElementById("statPot");
const statFirst = document.getElementById("statFirst");
const statSecondThird = document.getElementById("statSecondThird");
const progressFill = document.getElementById("progressFill");
const statNote = document.getElementById("statNote");
const overflowBanner = document.getElementById("overflowBanner");
const signupSection = document.getElementById("signupSection");

// Splits the pot into whole-dollar payouts that never exceed the live pot.
// Floors each share, then hands the leftover remainder to 1st place.
function computePayouts(pot) {
  const first = Math.floor(pot * 0.60);
  const second = Math.floor(pot * 0.25);
  const third = Math.floor(pot * 0.15);
  const remainder = pot - first - second - third;
  return { first: first + remainder, second, third };
}

// `spotsUnknown` means we have no real signup count (fetch failed or the
// backend isn't configured yet). In that case we only show the pot/payout
// numbers as an estimate off PRIMARY_CAP, and leave the "Spots filled" tile
// as "—" rather than fabricating a count.
function renderStats(count, options) {
  const opts = options || {};
  const estimated = !!opts.estimated;
  const spotsUnknown = !!opts.spotsUnknown;

  const pot = count * ENTRY_FEE;
  const payouts = computePayouts(pot);

  if (!spotsUnknown) {
    if (count > PRIMARY_CAP) {
      const overflowCount = Math.min(count, OVERFLOW_CAP) - PRIMARY_CAP;
      statSpots.textContent = String(count);
      statSpotsLabel.textContent = `${count} signed up, 24 primary + ${overflowCount} overflow`;
      progressFill.classList.add("overflow");
    } else {
      statSpots.textContent = `${count} / ${PRIMARY_CAP}`;
      statSpotsLabel.textContent = "Spots filled";
      progressFill.classList.remove("overflow");
    }

    const fillPct = Math.min(count / PRIMARY_CAP, 1) * 100;
    progressFill.style.width = fillPct + "%";
  }

  statPot.textContent = `$${pot}`;
  statFirst.textContent = `$${payouts.first}`;
  statSecondThird.textContent = `$${payouts.second} / $${payouts.third}`;

  if (!spotsUnknown && count >= OVERFLOW_CAP) {
    overflowBanner.hidden = false;
    if (signupSection) {
      signupSection.innerHTML = `<h2>Sign up</h2><p>${OVERFLOW_FULL_MESSAGE}</p>`;
    }
  }

  if (estimated) {
    statNote.textContent = "Live count unavailable. The numbers below assume 24 players (estimated).";
    statNote.hidden = false;
  } else {
    statNote.hidden = true;
  }
}

async function loadCount() {
  // Loading state: lightweight placeholder, not zeros.
  statSpots.textContent = "…";
  statPot.textContent = "…";
  statFirst.textContent = "…";
  statSecondThird.textContent = "…";

  if (!isScriptUrlConfigured()) {
    statSpots.textContent = "—";
    renderStats(PRIMARY_CAP, { estimated: true, spotsUnknown: true });
    return;
  }

  try {
    const res = await fetch(SCRIPT_URL, { method: "GET" });
    const data = await res.json();
    const count = Number(data.count) || 0;
    renderStats(count, { estimated: false, spotsUnknown: false });
  } catch (err) {
    statSpots.textContent = "—";
    renderStats(PRIMARY_CAP, { estimated: true, spotsUnknown: true });
  }
}

loadCount();

// ---------- Signup form ----------

const form = document.getElementById("signupForm");
const submitBtn = document.getElementById("submitBtn");
const formError = document.getElementById("formError");
const confirmSection = document.getElementById("confirmSection");

const errName = document.getElementById("errName");
const errEmail = document.getElementById("errEmail");
const errPhone = document.getElementById("errPhone");
const errPayment = document.getElementById("errPayment");

function showFieldError(el, message) {
  if (!message) {
    el.hidden = true;
    el.textContent = "";
    return;
  }
  el.hidden = false;
  el.textContent = message;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function digitCount(value) {
  return (value.match(/\d/g) || []).length;
}

function validateForm(fields) {
  let valid = true;

  if (!fields.name) {
    showFieldError(errName, "Name is required.");
    valid = false;
  } else {
    showFieldError(errName, null);
  }

  if (!fields.email) {
    showFieldError(errEmail, "Email is required.");
    valid = false;
  } else if (!isValidEmail(fields.email)) {
    showFieldError(errEmail, "That doesn't look like a valid email.");
    valid = false;
  } else {
    showFieldError(errEmail, null);
  }

  if (!fields.phone) {
    showFieldError(errPhone, "Phone is required.");
    valid = false;
  } else if (digitCount(fields.phone) < 10) {
    showFieldError(errPhone, "Phone number needs at least 10 digits.");
    valid = false;
  } else {
    showFieldError(errPhone, null);
  }

  if (!fields.paymentMethod) {
    showFieldError(errPayment, "Pick a payment method.");
    valid = false;
  } else {
    showFieldError(errPayment, null);
  }

  return valid;
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    formError.hidden = true;

    const paymentEl = form.querySelector('input[name="paymentMethod"]:checked');

    const fields = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      phone: form.elements.phone.value.trim(),
      paymentMethod: paymentEl ? paymentEl.value : "",
      notes: form.elements.notes.value.trim(),
    };

    if (!validateForm(fields)) {
      return;
    }

    if (!isScriptUrlConfigured()) {
      formError.textContent = "Signups aren't connected yet. Message Joey directly to reserve a spot.";
      formError.hidden = false;
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    const payload = {
      ...fields,
      timestamp: new Date().toISOString(),
    };

    try {
      // Apps Script web apps do not send CORS headers for application/json
      // preflight requests. Posting as text/plain avoids the preflight.
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });

      // no-cors responses are opaque; treat network completion as success.
      showConfirmation(fields);
    } catch (err) {
      formError.textContent = "Something went wrong submitting. Please try again, or text Joey directly.";
      formError.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = "Sign up";
    }
  });
}

// ---------- Confirmation panel ----------

function showConfirmation(fields) {
  signupSection.hidden = true;
  confirmSection.hidden = false;

  document.getElementById("confirmHeadline").textContent = `You're signed up, ${fields.name}.`;

  const venmoBlock = document.getElementById("venmoBlock");
  const cashBlock = document.getElementById("cashBlock");

  if (fields.paymentMethod === "Venmo") {
    venmoBlock.hidden = false;
    cashBlock.hidden = true;
    const venmoBtn = document.getElementById("venmoBtn");
    venmoBtn.href = `venmo://paycharge?txn=pay&recipients=${VENMO_HANDLE}&amount=${ENTRY_FEE.toFixed(2)}&note=Poker%20Night%20Nov%2020`;
  } else {
    venmoBlock.hidden = true;
    cashBlock.hidden = false;
  }

  // Fixed UTC instants for Nov 20 2026, 8:00pm-11:00pm America/New_York
  // (EST, UTC-5 in November). Using a trailing Z keeps this correct for
  // guests outside Eastern without needing a VTIMEZONE block.
  const gcalDates = "20261121T010000Z/20261121T040000Z";

  const details = `Entry is $50, goes straight into the pot. BYOB (bring your own drinks and a snack to share). Pay in on Venmo @${VENMO_HANDLE} by 5pm Thursday Nov 19.`;
  const gcalBtn = document.getElementById("gcalBtn");
  const gcalParams = new URLSearchParams({
    action: "TEMPLATE",
    text: "2026 White House Poker Classic",
    dates: gcalDates,
    details: details,
    location: EVENT_LOCATION,
  });
  gcalBtn.href = `https://calendar.google.com/calendar/render?${gcalParams.toString()}`;

  const icsBtn = document.getElementById("icsBtn");
  icsBtn.addEventListener("click", downloadIcs);

  const shareBtn = document.getElementById("shareBtn");
  shareBtn.addEventListener("click", shareInvite);
}

// Escapes characters that RFC 5545 requires escaping in TEXT values.
function icsEscape(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

// Folds a "NAME:value" line at the RFC 5545 75-octet limit, with each
// continuation line starting with a single leading space.
function icsFoldLine(line) {
  const limit = 75;
  if (line.length <= limit) {
    return line;
  }
  let result = line.slice(0, limit);
  let rest = line.slice(limit);
  while (rest.length > 0) {
    const chunk = rest.slice(0, limit - 1);
    result += "\r\n " + chunk;
    rest = rest.slice(limit - 1);
  }
  return result;
}

function icsTimestampUtc(date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function downloadIcs() {
  const details = icsEscape(
    `Entry $50, straight into the pot. BYOB. Pay in on Venmo @${VENMO_HANDLE} by 5pm Thursday Nov 19.`
  );
  const location = icsEscape(EVENT_LOCATION);
  const uid = `poker-night-20261120-${Date.now()}@joeyfwhite.github.io`;
  const dtstamp = icsTimestampUtc(new Date());

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//2026 White House Poker Classic//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    "SUMMARY:2026 White House Poker Classic",
    // Fixed UTC instants for Nov 20 2026, 8:00pm-11:00pm America/New_York.
    "DTSTART:20261121T010000Z",
    "DTEND:20261121T040000Z",
    `LOCATION:${location}`,
    `DESCRIPTION:${details}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].map(icsFoldLine).join("\r\n");

  const blob = new Blob([lines], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "2026-white-house-poker-classic.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function shareInvite() {
  const shareData = {
    title: "2026 White House Poker Classic",
    text: "Join me for the 2026 White House Poker Classic, Nov 20...",
    url: window.location.href,
  };

  const toast = document.getElementById("shareToast");
  const fallbackInput = document.getElementById("shareFallbackInput");

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (err) {
      // user cancelled or share failed, fall through to clipboard
    }
  }

  try {
    await navigator.clipboard.writeText(window.location.href);
    toast.hidden = false;
    setTimeout(() => {
      toast.hidden = true;
    }, 3000);
  } catch (err) {
    fallbackInput.hidden = false;
    fallbackInput.value = window.location.href;
    fallbackInput.select();
  }
}
