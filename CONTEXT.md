# Stayoo

Stayoo manages short-term rental reservations, expenses, and rental taxes.

## Language

**Paid Reservation**:
A reservation whose checkout date is before today. Payment status is derived from its stay dates, not stored independently.
_Avoid_: Settled reservation

**Next Reservation**:
The earliest reservation that is not a Paid Reservation, ordered by check-in date. It can be an ongoing stay or a future check-in.
_Avoid_: Upcoming reservation
