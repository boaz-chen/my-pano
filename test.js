import assert from "node:assert/strict";

const HE_DAY_INDEX = {
  "ראשון": 0, "שני": 1, "שלישי": 2, "רביעי": 3,
  "חמישי": 4, "שישי": 5, "שבת": 6,
};

function parseWeekRange(title) {
  if (!title) return null;
  let m = title.match(/(\d{1,2})\.(\d{1,2})\s*[-–]\s*\d{1,2}\.\d{1,2}/);
  if (m) return { startDay: +m[1], month: +m[2] };
  m = title.match(/(\d{1,2})\s*[-–]\s*(\d{1,2})\.(\d{1,2})/);
  if (!m) return null;
  return { startDay: +m[1], endDay: +m[2], month: +m[3] };
}

function dateForDay(dayName, range, today = new Date()) {
  if (!range) return null;
  const idx = HE_DAY_INDEX[dayName];
  if (idx === undefined) return null;
  const year = today.getFullYear();
  const day = range.startDay + idx;
  let d = new Date(year, range.month - 1, day);
  const diffMonths = (d - today) / (1000 * 60 * 60 * 24 * 30);
  if (diffMonths > 6) d = new Date(year - 1, range.month - 1, day);
  else if (diffMonths < -6) d = new Date(year + 1, range.month - 1, day);
  return d;
}

// --- parseWeekRange ---

// Cross-month format: startDay.startMonth-endDay.endMonth
{
  const r = parseWeekRange("לוח אימונים שבועי 26.4-2.5");
  assert.equal(r.startDay, 26);
  assert.equal(r.month, 4);
  console.log("✓ parseWeekRange: cross-month 26.4-2.5");
}

// Same-month format: startDay-endDay.month
{
  const r = parseWeekRange("לוח אימונים שבועי 8-14.3");
  assert.equal(r.startDay, 8);
  assert.equal(r.endDay, 14);
  assert.equal(r.month, 3);
  console.log("✓ parseWeekRange: same-month 8-14.3");
}

// Unrecognised title
{
  assert.equal(parseWeekRange("foo"), null);
  console.log("✓ parseWeekRange: unrecognised title → null");
}

// Empty / null
{
  assert.equal(parseWeekRange(""), null);
  assert.equal(parseWeekRange(null), null);
  console.log("✓ parseWeekRange: empty/null → null");
}

// --- dateForDay ---

// Cross-month week starting April 26 (Sunday), pinned today = April 26 2026
const today = new Date(2026, 3, 26); // April 26 2026
const range = parseWeekRange("לוח אימונים שבועי 26.4-2.5");

{
  // שני = Monday = idx 1  →  April 26 + 1 = April 27
  const d = dateForDay("שני", range, today);
  assert.equal(d.getMonth(), 3); // April (0-indexed)
  assert.equal(d.getDate(), 27);
  console.log("✓ dateForDay: שני (Monday) → April 27");
}

{
  // שישי = Friday = idx 5  →  April 26 + 5 = April 31 → May 1
  const d = dateForDay("שישי", range, today);
  assert.equal(d.getMonth(), 4); // May
  assert.equal(d.getDate(), 1);
  console.log("✓ dateForDay: שישי (Friday) → May 1 (cross-month overflow)");
}

{
  // שבת = Saturday = idx 6  →  April 26 + 6 = April 32 → May 2
  const d = dateForDay("שבת", range, today);
  assert.equal(d.getMonth(), 4); // May
  assert.equal(d.getDate(), 2);
  console.log("✓ dateForDay: שבת (Saturday) → May 2 (cross-month overflow)");
}

{
  // Unknown day name → null
  assert.equal(dateForDay("unknown", range, today), null);
  console.log("✓ dateForDay: unknown day name → null");
}

{
  // null range → null
  assert.equal(dateForDay("שני", null, today), null);
  console.log("✓ dateForDay: null range → null");
}

console.log("\nAll tests passed.");
