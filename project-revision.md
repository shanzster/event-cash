# Project Revision Plan

## 1. Homepage — "Send Us a Message" Form
- Wire up the contact form to save messages to Firestore (`messages` collection)
- Fields: name, email, phone, message, timestamp, status (unread/read)

## 2. Owner Dashboard — Messages Tab
- Add "Messages" tab to `ManagerSidebar` nav items
- Create `/owner/messages` page to view and manage customer messages
- Show unread count badge on sidebar item

## 3. Owner Dashboard — "Welcome Back" → "Welcome"
- Change greeting text in `app/owner/dashboard/page.tsx`

## 4. Client Booking — 1-Week Advance Restriction
- In `app/booking/new/page.tsx`, set `min` date on event date input to today + 7 days
- Validate on submit as well

## 5. Client — Cancel/Delete Pending Bookings
- In `app/booking/[id]/page.tsx` and `app/my-bookings/page.tsx`, add cancel button for `pending` status bookings only
- Update Firestore status to `cancelled`

## 6. Booking Summary — Terms & Conditions Note
- In final booking summary step (step 4 / confirm modal), add note:
  "Terms & Conditions: A required 50% downpayment is needed to confirm your booking."

## 7. Owner Calendar — Booking Limit Per Day
- Add `dailyBookingLimit` setting (stored in Firestore `settings/calendar`)
- In `ManagerCalendar`, show limit indicator per day
- Block new bookings when limit is reached (enforce in booking flow)

## 8. Rename "Invoice" / "Official Receipt" → "Sales Invoice"
- Rename all references in `InvoiceReceipt.tsx`, `OfficialReceipt.tsx`, and all pages that use them
- Rename component files to `SalesInvoice.tsx`

## 9. Sales Invoice System (BIR-Compliant)
Three invoice types, all labeled "SALES INVOICE":

### 9a. Downpayment Invoice
- Description: "PARTIAL PAYMENT / DOWNPAYMENT"
- Format: Business Name, Address, TIN, Date of Transaction, Invoice # (sequential), Booking Details, Subtotal, Tax, Other, Total, Downpayment, Remaining Balance, Payment Status (DOWNPAYMENT), Terms & Conditions
- Access: Owner (generate), Staff (generate), Client (view/download)

### 9b. Final Payment Invoice
- Description: "FINAL PAYMENT / SETTLEMENT OF BALANCE"
- Format: Same header + Booking Details, Subtotal, Tax, Other, Total, Downpayment, Remaining Balance Paid, Payment Status (FINAL PAYMENT), Terms & Conditions, Thank You Note
- Access: Owner, Staff, Client (after event marked complete)

### 9c. Full Payment Invoice
- Description: "FULL PAYMENT"
- Format: Same header + Booking Details, Subtotal, Tax, Other, Total, Payment Status (PAID IN FULL), Thank You Note
- Access: Owner, Staff, Client

### Sequential Invoice Numbers
- Store counter in Firestore `settings/invoiceCounter`
- Format: `SI-YYYYMMDD-XXXX` (e.g., SI-20260408-0001)

### Business Info (from Firestore `settings/business`)
- Business Name, Address, TIN Number

### Invoice Generation Points
- On booking confirmation: Owner sees 2 options — "Downpayment Invoice" or "Full Payment Invoice"
- After event marked complete: "Final Payment Invoice" option appears
- Client/Staff: Can download their respective invoice from booking detail page

## 10. Access Control Summary
| Invoice Type | Owner | Staff | Client |
|---|---|---|---|
| Downpayment Invoice | Generate | Generate | View/Download |
| Full Payment Invoice | Generate | Generate | View/Download |
| Final Payment Invoice | Generate | Generate | View/Download |

## Files to Create/Modify
- `components/SalesInvoice.tsx` — new unified invoice component
- `app/owner/messages/page.tsx` — new messages page
- `app/contact/page.tsx` — wire up form to Firestore
- `app/booking/new/page.tsx` — date restriction + T&C note
- `app/booking/[id]/page.tsx` — cancel button + new invoice buttons
- `app/my-bookings/page.tsx` — cancel button for pending
- `components/ManagerSidebar.tsx` — add Messages nav item
- `app/owner/dashboard/page.tsx` — "Welcome" text
- `components/ManagerCalendar.tsx` — daily booking limit
- `app/owner/upcoming-events/[id]/page.tsx` — new invoice options
- `app/staff/event/[id]/page.tsx` — new invoice options
