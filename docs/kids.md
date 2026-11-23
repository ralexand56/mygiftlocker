# Kids in M Gift Locker: proposal

Young kids can't (and legally shouldn't) have their own accounts, but they're the people
whose sizes change fastest and who get the most gifts. The model below treats them as
**managed profiles**.

## 1. Managed profiles (built into the data model already)

- A child is a `Profile` with `kind: "child"` and one or more `guardians` (parent user ids).
- Kids **never log in** and have no email address. Guardians edit everything.
- Co-parents, grandparents or nannies can be added as guardians with full edit rights.
  Relatives get **read-only** access through the normal `viewers` sharing.
- Ships to the guardian's address by default, so a child's home address is never shown separately.

## 2. Two ways kids get added

- **By the parent**: the invite form has an optional "Shopping for your kids too?" step
  (inviters can turn it on). Parents add each child's name, birthday, clothing and shoe size.
- **From the inviter's side**: "Add Lily (Maya's daughter)". Once Maya joins, she's asked to
  confirm she's a guardian, and the child profile moves under her control.

## 3. Keeping sizes fresh

- After **120 days**, a child's card shows "Sizes may be outgrown" and the guardian gets a
  gentle nudge (implemented: `isStale()` in `@mgl/core`).
- **Smart suggestions**: with a birthday, we can suggest the next size up before birthdays and
  holidays ("Lily is probably a 7 by December"), and show a "size up?" toggle to gift-givers.
- **Size history**: keep a timeline per child. It's a fun growth chart for parents and
  makes predictions better.

## 4. Gift exchanges with kids

- A parent can add their kids as participants they **manage** (`Participant.managedBySub`).
  The parent edits the child's wishlist and sees who the child is gifting, so they can help
  shop. Already supported by the organizer's "add someone by name" box.
- Optional rule: "kids only draw kids" for family exchanges. This is easy to add as an
  automatic exclusion set in the matcher.

## 5. Growing up

- At 13 (COPPA) or a parent-chosen age, the guardian can **hand over** the profile. The teen
  signs up, claims the profile (`claimedBySub`), and their history comes with them. Parents
  can keep read access if the teen allows it.

## 6. Privacy guardrails

- No photos of kids by default; avatars are initials and color.
- No public exposure: child profiles are never readable through the public invite API.
- Clear "who can see Lily's info" screen for guardians.
- Collect only what's needed for gifting (sizes, birthday month/day, likes).
