// ============================================
// KINUMITS Application Form
// - Generates a unique reference number client-side
// - Builds a pre-filled WhatsApp message the applicant sends themselves
// - (Optional) logs the submission to a Google Sheet via Apps Script Web App
// ============================================

// TODO: replace with the school's Google Apps Script Web App URL once created.
const SHEET_LOG_ENDPOINT = ""; // e.g. "https://script.google.com/macros/s/XXXXXXX/exec"

const ADMISSIONS_WHATSAPP = "256772684153"; // international format, no + or leading zero

function generateReference() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const y = String(now.getFullYear()).slice(-2);
  const datePart = `${y}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const rand = String(Math.floor(Math.random() * 900) + 100);
  return `KIN-${datePart}-${timePart}-${rand}`;
}

function buildWhatsAppMessage(data, ref) {
  const lines = [
    `*New Application — ${ref}*`,
    `Name: ${data.fullName}`,
    `Sex: ${data.sex} | DOB: ${data.dob}`,
    `Phone: ${data.phone}`,
    `District: ${data.district}`,
    `Course: ${data.course}`,
    `Intake: ${data.intake}`,
    `O-Level grades — Math: ${data.mathGrade || "-"}, Eng: ${data.engGrade || "-"}, Bio: ${data.bioGrade || "-"}, Chem: ${data.chemGrade || "-"}, Phy: ${data.phyGrade || "-"}`,
    `Next of kin: ${data.kinName || "-"} (${data.kinPhone || "-"})`,
    `Heard about us via: ${data.source || "-"}`
  ];
  return encodeURIComponent(lines.join("\n"));
}

async function logToSheet(payload) {
  if (!SHEET_LOG_ENDPOINT) return;
  try {
    await fetch(SHEET_LOG_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.warn("Sheet log failed (non-blocking):", err);
  }
}

const form = document.getElementById("apply-form");
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.style.opacity = "0.7"; }

    const data = Object.fromEntries(new FormData(form).entries());
    const ref = generateReference();

    await logToSheet({ ...data, reference: ref, submittedAt: new Date().toISOString() });

    const panel = document.getElementById("confirm-panel");
    document.getElementById("ref-display").textContent = ref;

    const waMessage = buildWhatsAppMessage(data, ref);
    const waLink = document.getElementById("whatsapp-send");
    waLink.href = `https://wa.me/${ADMISSIONS_WHATSAPP}?text=${waMessage}`;

    form.style.display = "none";
    panel.classList.add("show");
    panel.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}
