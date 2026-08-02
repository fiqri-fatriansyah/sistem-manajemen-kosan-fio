# System Rules — Sistem Manajemen Kosan Fio

Standing rules that must be upheld across all future development on this system.

---

## Code & Styling

- **No `px` units** (except 1px borders) — everything must use `rem`.
- **Minimum font size** is configurable in Pengaturan (default 18, range 1–18). All text sizes must proportionally scale with this setting.
- **Button consistency** — buttons that appear together in the same context (same row, same action group, same table column) must be uniform in size and style. There is no single global button size — sizing is determined by context (e.g. table row action buttons share one size, form submit buttons share another, header CTAs share another).
- **PWA compliance is mandatory** on ALL interactive elements: buttons, dropdowns, search inputs, selectors, etc. Touch targets must be large enough and accessible on mobile.
- **Responsive Web App** — all layouts must adapt cleanly to different screen sizes. No fixed-width containers that break on smaller or larger viewports. Test on both desktop and mobile.
- **ChartDataLabels** must NOT be registered globally in Vue (`ChartJS.register`). Always pass it per-chart via the `:plugins` prop to avoid suppressing Chart.js legends.

---

## Data & Business Logic

- **Room status is fully dynamic** — derived from active/future `RentalTransaction` dates. Never use a static `Room.status` field for availability.
- **Long-stay rentals** block room availability indefinitely until the tenant formally checks out.
- **Unpaid bookings** (totalPaid === 0) keep the room Available. A new paid booking auto-cancels the unpaid one.
- **Overdue rooms** (Harian overstay / Bulanan tunggakan beyond grace period) revert to Available. If someone new rents the room, the overdue rental becomes `Perlu Pengusiran`. Resolving it requires the "Selesai" action.
- **Grace period** before an overdue room becomes Available must be configurable in Pengaturan.
- **DP booking protection** — a booking with partial or full DP paid cannot be overwritten. A new booking with DP can auto-cancel an existing future booking that has NO DP paid.
- **Partial DP** must not be credited to `saldo kredit` — full payment required before it becomes credit.
- **Saldo vs. Tunggakan** — if a tenant has remaining saldo AND an outstanding tunggakan, auto-deduct the tunggakan from saldo first. Saldo and unpaid tunggakan must never coexist unreconciled.
- **Harian (daily) rentals** must not allow overpayment. Validate and block at form submission.
- **Jatuh Tempo display** — for Long-Stay (Bulanan) rentals, "Jatuh Tempo" must show `Tanggal X setiap bulan` (from `paymentReminderDate`), not `expectedReturnDate`.

---

## PDF / Reports

- **All PDF generation** on every triggering action (Akhiri Sewa, Kwitansi, Laporan, etc.) must be verified correct. Never assume it works without testing.
- **Kwitansi** must only show the amount paid for that particular month or stay — do not display overpay credits or saldo balance.
- **Audit Log PDF** must support time-range filtering: last 1, 3, 7, 30 days, or all.
- **Dashboard PDF & Word** charts must include data labels. Use `display: (ctx) => value > 0` to skip zero/null values without crashing. Charts must also include legends.

---

## WhatsApp & Email

- **WA/Email reminders are status-specific** — never use a generic "payment reminder" for all statuses. Only send payment prompts when the rental is: unpaid, partially paid, overdue, or 1/3/7 days before the next payment due date.
- **All WA message templates** must be configurable in Pengaturan, including: a Reset to Default button, and a guide listing all available auto-fill variables with their descriptions (e.g. `:Nama Penyewa` — nama penyewa aktif).
- **Promo/marketing WA message** must also be configurable in Pengaturan.
- **Eviction and status-change events** (Perlu Pengusiran, booking confirmation, etc.) must have their own distinct WA/Email message templates.

---

## UX Patterns

- **"Tampilkan" (items per page)** choice must be persisted via `localStorage` (`fio_itemsPerPage`) across ALL paginated pages: Inventaris, Kalender, Pelanggan, Penyewaan.
- **Pagination controls** must be permanently visible — always rendered at the bottom of every paginated list regardless of how many results are showing. Never hide or conditionally render the pagination bar.
- **Saved pagination settings** — the selected "Tampilkan" value must survive page reloads and navigation. On any page that has a paginated list, the saved value must be applied immediately on mount.
- **Inventaris accordion** — auto-expand when search returns exactly 1 room type result. Auto-collapse all when search returns more than 1 result.
- **Cancelled rentals** must be visually distinct — display in grey.
- **Penyewaan search** must match on transaction ID, tenant name, AND telephone number.
- **Akhiri Sewa** post-action must set the room to Available by default. Cleaning and Maintenance are triggered manually — never assumed automatically.

---

## Layout & Navigation

- **Sidebar** must be collapsible/hideable via a burger icon. The burger must be fused into the sidebar itself (not a separate floating element). The sidebar must remain sticky and accessible while scrolling.
- **Pengaturan** currently uses a floating quick-nav widget. This will be replaced with horizontal tabs at the top of the page for navigating between settings sections. Tabs must remain accessible while scrolling.
- **Log Sistem and Audit Log** must be both paginated and searchable.

---

## Dashboard

- **Chart display order**: Pendapatan per Bulan → Room Terpopuler → Tren Penyewaan → Top 5 Pelanggan Paling Bernilai → Tunggakan & Overstay → Loyalitas Pelanggan.
- **Metric card order**: Pendapatan Bulan Ini (1st) → Total Tunggakan (2nd) → Penghuni Bermasalah (3rd) → Kamar Kosong Hari Ini (4th).
- **Kalender color coding**: Orange = Belum DP / Tunggakan DP, Red = Tunggakan Bulanan, Dark Red = Overstay Harian.
- **Peringatan table** must show rental type (Harian/Bulanan) next to each issue.
- **Analisa Tren** CTA belongs in Inventaris and Dasbor — never in Pengaturan. CTAs must filter/highlight to the relevant room type or pelanggan in their respective pages.

---

## Seeder

- **NEVER run the demo seeder** unless the application is configured in Demo Mode.
