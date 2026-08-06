# RentInfra Roadmap

What a working car rental business needs, what RentInfra has today, and what to build next.

The gap analysis below compares this codebase against the feature set common to commercial
rental platforms (Nomora, Booqable, TopRentApp, CAMASYS, Fleet HQ and similar), plus the
KPI and fraud-prevention practices those vendors document. Sources are listed at the end.

---

## Where the project stands

**Solid.** The booking funnel is complete and works end to end: search → fleet → car detail →
4-step wizard → reference (`RIF-YYYY-NNNNN`) → guest lookup. Pricing is genuinely good —
seasonal price lists, duration discount tiers, addons, location fees, young-driver surcharge
and tax all resolve through one engine (`src/lib/pricing.ts`). The admin panel covers bookings,
cars, users, locations, testimonials and settings, and generates a real 2-page A4 rental
contract PDF with a damage diagram. Everything configurable lives in the `settings` table.

**The gap is everything that happens after "Confirm Booking."** The system takes reservations
but does not run a rental business: no money is collected, no email is ever sent, and nothing
tracks whether a car is actually free.

---

## P0 — Blocks real use

### ~~[#13] Availability check is inverted~~ ✅ Fixed 2026-08-06

The overlap test ORed its two date conditions, so one `pending`/`confirmed`/`active` booking
made a car unbookable **on every future date**. Verified against production: a Volkswagen Golf
was refused with 409 for ranges in 2026, 2027, 2030 and 2031, all genuinely free. Fixed to
chained strict inequalities, which also permits same-day turnaround. Re-verified live.

### [#14] Show availability before the last step

`/cars` lists every car regardless of the dates searched, so a customer picks a car, fills in
four steps, and only then hits "Car is not available for selected dates." Every commercial
platform removes booked vehicles from search results for the requested range.

- Filter the fleet query by overlap against bookable statuses when `?pickup`/`?dropoff` are set
- Mark unavailable cars rather than hiding them where the dates came from a search, so the
  customer understands why the fleet shrank; offer the nearest free range
- Reuse one shared helper (`lib/availability.ts`) for the list, the detail page and the API,
  so the three can never disagree

### [#15] Make double-booking structurally impossible

The current check is read-then-write: two concurrent requests can both pass and both insert.
Add a Postgres exclusion constraint so the database rejects the second one regardless of
application logic.

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE bookings ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    car_id WITH =,
    daterange(pickup_date, dropoff_date, '[)') WITH &&
  ) WHERE (status IN ('pending', 'confirmed', 'active'));
```

Then translate the constraint violation into the existing 409 response.

### [#16] Expire unconfirmed holds

A `pending` booking nobody confirms holds the car forever. Add `hold_expires_at`, a
`booking_hold_minutes` setting, and a scheduled job (Vercel cron) that cancels expired holds
so the inventory returns to sale. `min_advance_hours` is the existing precedent for
time-based policy.

---

## P1 — Needed to operate

### [#9] Email notifications *(already on the todo list)*

`bookings/route.ts` inserts a row into `notifications_queue` and **nothing ever reads it** —
no email is sent to the customer or the business, ever. The queue table and the
`notify_*`/`smtp_*` settings already exist; only the sender is missing.

- Resend (or SMTP) adapter draining `notifications_queue`, with retry and a `failed` status
- Templates: booking received, booking confirmed, cancelled, pickup reminder, return reminder
- Admin alert on new booking, to `notify_admin_email`
- Respect the existing `notify_new_booking` / `notify_booking_confirm` toggles

### [#10] Payments and deposits *(already on the todo list)*

No money is collected anywhere. `payment_status`, `deposit_amount`, `stripe_payment_intent_id`
and `paypal_order_id` columns exist and are never written by the app.

- Stripe Checkout for the rental, webhook → `payment_status`
- **Deposit pre-authorization** — the industry norm is a hold placed before handover and
  released automatically after return, not a charge. Tie the hold to the booking and the
  condition report so any deduction is evidence-backed
- Refund path on cancellation, honouring the cancellation policy already in settings

### [#17] Vehicle handover and condition reports

The contract PDF has a damage diagram, but nothing digital records condition. This is where
deposit disputes are won or lost.

- Photo capture at pickup and return, stored in Supabase Storage against the booking
- Damage markers, fuel and odometer readings (the `km_*`/`fuel_*` columns already exist)
- Customer signature captured at handover
- Deposit deduction flow that cites specific photos

### [#7] Customer accounts *(already on the todo list)*

Auth exists but there is no `/account`. A signed-in customer cannot see their own bookings —
they must use the guest reference lookup like everyone else.

---

## P2 — Makes it competitive

### [#18] Fleet operations

- **Maintenance schedule** — service intervals, MOT/ITV expiry, insurance renewal, with a car
  marked unavailable while in the workshop (a maintenance block is just a booking the public
  cannot make)
- **Vehicle status** beyond the current `is_available` boolean: available / rented /
  maintenance / cleaning / off-fleet
- **Fleet calendar** — one timeline of every car and every booking, which is how rental
  desks actually work day to day

### [#19] Business reporting

The admin dashboard shows counts. Operators run on:

- **Utilization rate** (rented days ÷ available days) per car and per category
- **RevPAV** — revenue per available vehicle day
- **ADR** — average daily rate achieved vs list price
- Average rental length, cancellation and no-show rate, addon attach rate
- Revenue by month, car and category

These are the standard rental KPIs and all are derivable from data already stored.

### [#20] Rate and revenue management

The pricing engine is strong but static. Add day-of-week rates, blackout dates, minimum
rental length per season, and per-location pricing.

### [#4] [#5] [#6] Remaining admin CRUD *(already on the todo list)*

Addons and Locations are read-only lists with no create/edit. `/admin/bookings/new` exists
for offline bookings.

---

## P3 — Later

- **[#21] Driver licence verification** — commercial platforms scan the licence and face-match
  before release. Start by storing licence images against the booking and letting staff mark
  them verified; automated verification is a paid third-party integration
- **[#22] Multi-location logistics** — one-way rentals, inter-branch transfers, per-branch fleet
- **[#11] WhatsApp notifications** *(already on the todo list)*
- **[#12] German and Russian translations** *(already on the todo list)*
- **[#23] Channel/OTA sync** — only relevant at real scale

---

## Suggested order

| Order | Item | Why |
|---|---|---|
| 1 | ~~#13 availability bug~~ ✅ | Was rejecting valid bookings in production |
| 2 | #14 availability in search | Customers hit the wall after four steps |
| 3 | #15 exclusion constraint | Makes double-booking impossible, not just unlikely |
| 4 | #9 email | A booking nobody is told about is not a booking |
| 5 | #16 hold expiry | Stops abandoned carts eating the fleet |
| 6 | #10 payments + deposits | Turns reservations into revenue |
| 7 | #17 condition reports | Protects the deposit; the PDF already implies it |
| 8 | #7 accounts, #18 fleet ops, #19 reporting | Retention and daily operations |

Items 1–5 are what separate "a booking form" from "a rental system." Items 6–7 are what
separate that from a business.

---

## Sources

- [Nomora — car rental software comparison](https://www.nomora.io/blog/car-rental-software-solutions-2026)
- [Nomora — fleet reporting and utilization](https://www.nomora.io/blog/fleet-reporting-car-rental-maximize-utilization-profit)
- [Nomora — security deposits explained](https://www.nomora.io/blog/car-rental-security-deposits-explained)
- [Booqable — car rental software](https://booqable.com/industries/car-rental-software/)
- [TopRentApp — rental management & booking](https://toprentapp.com/)
- [Fleet HQ — renter verification guide](https://fleethq.io/car-rental-renter-verification-2026/)
- [CAMASYS — KPIs for car rental](https://www.camasys.com/posts/must-track-kpis-for-car-rental-success)
- [Worco — revenue management strategies](https://www.worco.io/blog/car-rental-revenue-management-strategies/)
- [VEVS — deposits for online reservations](https://www.vevs.com/car-rental-software/blog/how-car-rental-companies-handle-deposit-and-security-payments-for-online-reservations-182.php)
