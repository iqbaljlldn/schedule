# Build a Public Speaking Daily Schedule Tracker

## 1. Project Overview

Build a small, clean, responsive web application for tracking the daily **Public Speaking session schedule** for a class.

Every day, exactly one student is scheduled to come to the front of the class and do a public speaking session.

The primary purpose of this website is:

> **Quickly answer: "Hari ini siapa yang maju?"**

However, the schedule must also support changes because real-world classroom schedules are messy. Students may:

- exchange schedules with another student
- move someone's schedule earlier
- move someone's schedule later
- skip a day because they are sick
- replace another student's slot
- rearrange upcoming schedules

The application therefore needs to treat the schedule as **editable and reorderable**, rather than a fixed calendar.

---

# 2. Primary Goals

The application should make these things extremely easy:

1. See who is scheduled **today**
2. See upcoming speakers
3. See the complete schedule
4. Reorder students
5. Change a student's scheduled date
6. Swap two students' positions
7. Mark a student as skipped/postponed
8. Move a student forward or backward
9. Add/remove students
10. Keep the interface extremely simple and fast

The UI should prioritize the current day's speaker.

The user should understand the current schedule within approximately 1-2 seconds after opening the website.

---

# 3. Technology

Prefer a simple architecture.

### Frontend

Use:

- HTML
- CSS
- Vanilla JavaScript

Do NOT introduce React, Vue, Next.js, or another frontend framework unless there is a compelling technical reason.

The project should be deployable directly to Vercel as a static website.

### Data Storage

For the initial implementation:

- Use `localStorage`
- Store the entire schedule locally
- Persist changes automatically

Structure the application so that the storage layer can later be replaced with a backend/API without rewriting the UI.

Create a small abstraction such as:

```js
scheduleRepository;
```

or equivalent.

For example:

```text
UI
 ↓
Schedule Service
 ↓
Repository
 ↓
localStorage
```

Do not tightly couple UI code directly to `localStorage`.

---

# 4. Important Product Concept

Do NOT model the application simply as:

```text
Monday -> Alice
Tuesday -> Bob
Wednesday -> Charlie
```

Instead, model it as a sequence of **schedule entries**.

For example:

```js
{
  id: "schedule-001",
  studentId: "student-001",
  date: "2026-09-30",
  status: "scheduled"
}
```

Student data should be separated:

```js
{
  id: "student-001",
  name: "Alice"
}
```

This makes rescheduling and reordering much easier.

---

# 5. Schedule Status

Support at least these statuses:

```text
scheduled
completed
skipped
postponed
```

The UI should visually distinguish them.

However, do not overcomplicate the application with unnecessary workflow states.

The most important state is:

```text
scheduled
```

---

# 6. Main Dashboard

The homepage should focus heavily on today's speaker.

Suggested structure:

```text
┌──────────────────────────────────────────────┐
│ Public Speaking Schedule                     │
│ Class Schedule                               │
├──────────────────────────────────────────────┤
│                                              │
│              TODAY                           │
│          Wednesday, 30 Sep                   │
│                                              │
│             🎤                               │
│          JOHN DOE                            │
│                                              │
│       Public Speaking #12                    │
│                                              │
│      [ Mark Completed ]                      │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│ Next Speakers                                │
│                                              │
│ Tomorrow       Jane Doe                      │
│ Oct 2          Michael                       │
│ Oct 3          Sarah                         │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│ [ View Full Schedule ]                       │
│                                              │
└──────────────────────────────────────────────┘
```

Do not literally copy this visual design.

Use it as a UX concept.

---

# 7. Today's Speaker

This is the most important component.

If there is a scheduled student today:

Display:

- Student name
- Date
- Session number
- Status
- Optional note

Example:

```text
TODAY

30 September 2026

John Doe

Public Speaking #12

Scheduled
```

The student's name should be visually dominant.

If the schedule has already been completed:

```text
TODAY

John Doe

✓ Completed
```

If nobody is scheduled:

```text
TODAY

No speaker scheduled

[Manage Schedule]
```

If today's student was postponed/skipped:

Clearly explain what happened and show the next scheduled speaker.

---

# 8. Upcoming Schedule

Display the next several speakers.

Default:

- today
- next 5-7 scheduled entries

Example:

```text
UP NEXT

TODAY
John Doe

Tomorrow
Jane Doe

2 Oct
Michael Doe

3 Oct
Sarah Doe
```

Avoid displaying an unnecessarily huge amount of information on the dashboard.

Provide a link/button to the full schedule.

---

# 9. Full Schedule Page

Create a schedule management interface.

Example:

```text
Schedule

[ + Add Student ]

30 Sep   John Doe       Scheduled
1 Oct    Jane Doe       Scheduled
2 Oct    Michael Doe    Scheduled
3 Oct    Sarah Doe      Scheduled
4 Oct    Kevin Doe      Scheduled
```

Each entry should have actions:

```text
Edit
Move Up
Move Down
Swap
Skip
Postpone
```

But avoid clutter.

Prefer a clean dropdown/action menu if necessary.

---

# 10. Reordering

The schedule must support reordering.

Example:

Current:

```text
1. Alice
2. Bob
3. Charlie
4. David
```

Move Charlie up:

```text
1. Alice
2. Charlie
3. Bob
4. David
```

Dates should automatically be recalculated based on the new order.

This is important.

The application should not require manually changing every date when someone is moved.

---

# 11. Schedule as an Ordered Queue

Treat the schedule primarily as:

```text
Student A
Student B
Student C
Student D
Student E
```

with dates derived from the schedule's start date and classroom schedule rules.

This makes operations such as:

```text
move up
move down
swap
insert
remove
```

much easier.

The implementation should avoid creating inconsistent states where:

```text
Student A -> September 30
Student B -> September 30
Student C -> October 4
```

unless explicitly supported.

---

# 12. Swapping

Support an easy way to swap two students.

Example:

Before:

```text
Sep 30   Alice
Oct 1    Bob
```

Swap:

```text
Sep 30   Bob
Oct 1    Alice
```

The UI should make this operation obvious.

Possible interaction:

```text
Alice
[ Swap ]

Select student:
Bob

[ Confirm Swap ]
```

Or allow drag-and-drop if it can be implemented cleanly.

Do not add drag-and-drop just because it looks fancy. A reliable move/swap button is more important.

---

# 13. Moving Someone Earlier

Example:

Current:

```text
Sep 30 Alice
Oct 1  Bob
Oct 2  Charlie
Oct 3  David
```

If Charlie needs to move earlier:

```text
Sep 30 Alice
Oct 1  Charlie
Oct 2  Bob
Oct 3  David
```

The dates should update automatically.

---

# 14. Sick / Absent Scenario

Support the common scenario:

> Today's speaker is sick.

Example:

```text
Today:
Alice

Alice is sick.

[ Postpone Alice ]
```

After postponing:

```text
Today:
Bob

Upcoming:
Charlie
David
Alice
```

The exact behavior should be configurable, but the simplest sensible behavior is:

```text
Remove Alice from the current position
Move the remaining schedule forward
Append Alice to the next available slot
```

The UI should clearly show that Alice was postponed rather than silently changing history.

---

# 15. Completed Sessions

When the session is finished:

```text
[ Mark Completed ]
```

The entry becomes:

```text
✓ Completed
```

Completed sessions should remain visible in the schedule/history.

Do not delete them.

Example:

```text
PAST

✓ Sep 28   Alice
✓ Sep 29   Bob

TODAY

Sep 30   Charlie

UPCOMING

Oct 1    David
Oct 2    Eve
```

---

# 16. Students Management

Provide a simple student management section.

Features:

```text
Add student
Edit student
Remove student
```

Example:

```text
Students

Alice
Bob
Charlie
David

[ + Add Student ]
```

Prevent accidental deletion if that student already has schedule history.

If deletion is allowed, explain what happens to their schedule entries.

Prefer:

```text
Archive student
```

over permanently deleting historical data.

---

# 17. Initial Setup

On first visit, show a setup screen if no schedule exists.

Example:

```text
Set Up Your Class

Class name
[ Backend Class ]

First speaking date
[ 2026-09-30 ]

Students

[ Alice ]
[ Bob ]
[ Charlie ]
[ David ]

[ Create Schedule ]
```

The application should generate the initial schedule automatically.

---

# 18. Class Days

The schedule should support configurable class days.

For example:

```text
Monday
Tuesday
Wednesday
Thursday
Friday
```

If Saturday/Sunday are not class days, automatically skip them.

Example:

```text
Friday     Alice
Saturday   -
Sunday     -
Monday     Bob
```

The class-day configuration should be stored with the schedule.

Default:

```text
Monday-Friday
```

But allow users to change it.

---

# 19. Schedule Date Calculation

Implement a utility responsible for calculating the next valid class date.

For example:

```js
getNextClassDate(date, classDays);
```

And:

```js
generateSchedule(students, startDate, classDays);
```

Do not scatter date calculation logic throughout UI event handlers.

Keep schedule logic in a dedicated module/service.

---

# 20. Editing Schedule

The user should be able to manually change the schedule.

Possible operations:

```text
Move up
Move down
Swap
Postpone
Insert
Remove
```

The application should recalculate dates after structural changes.

Past/completed sessions should generally be treated as historical records and should not accidentally change when future schedule entries are reordered.

This distinction is important:

```text
History
↓
Today
↓
Future schedule
```

Do not casually rewrite history when changing future schedules.

---

# 21. Notes

Allow optional notes on schedule entries.

Example:

```text
John Doe

Note:
"Requested to switch with Sarah because of competition."
```

Notes are optional and should not clutter the main dashboard.

---

# 22. Data Model

Use a structure roughly like:

```js
{
  version: 1,

  class: {
    name: "Backend Class",
    startDate: "2026-09-30",
    classDays: [1, 2, 3, 4, 5]
  },

  students: [
    {
      id: "student-1",
      name: "Alice",
      active: true
    }
  ],

  schedule: [
    {
      id: "schedule-1",
      studentId: "student-1",
      date: "2026-09-30",
      status: "scheduled",
      note: null
    }
  ]
}
```

Use ISO date strings:

```text
YYYY-MM-DD
```

Do not store localized date strings as the source of truth.

---

# 23. Important Date Handling

Be careful with JavaScript `Date`.

Avoid bugs caused by timezone conversion such as:

```js
new Date("2026-09-30");
```

being interpreted unexpectedly depending on environment/timezone.

Use a dedicated date utility layer.

The application is intended primarily for Indonesia, so the default timezone should be:

```text
Asia/Jakarta
```

Do not depend on the browser's locale for business logic.

---

# 24. Local Storage

Persist the application state in:

```text
localStorage
```

Use a versioned storage key:

```text
public-speaking-schedule:v1
```

Create functions such as:

```js
loadSchedule();
saveSchedule();
clearSchedule();
```

Handle malformed/corrupted localStorage data gracefully.

If parsing fails, do not crash the entire application.

---

# 25. Import / Export

Because this is localStorage-based, include backup functionality.

Settings page:

```text
Data

[ Export JSON ]
[ Import JSON ]

[ Reset Application ]
```

Export should download a JSON file containing the complete application state.

Import should validate the structure before replacing the current state.

Show confirmation before destructive operations.

This is important because browsers are excellent at making users lose things at the least emotionally convenient moment.

---

# 26. Responsive Design

The application must work well on:

- Desktop
- Laptop
- Tablet
- Mobile

Mobile is important because students will likely open this from their phones.

Desktop:

```text
Main content max-width: ~1000-1200px
```

Mobile:

- single column
- large student name
- easy-to-tap buttons
- no tiny controls
- no horizontal scrolling

---

# 27. Visual Design

Style direction:

- Clean
- Modern
- Minimal
- Friendly
- Classroom-oriented
- Not corporate enterprise software
- Not overly playful

Use a strong visual hierarchy.

The most important visual element is:

```text
TODAY'S SPEAKER
```

Use cards sparingly.

Avoid:

- excessive gradients
- excessive shadows
- giant decorative illustrations
- unnecessary animations
- dashboard clutter

A subtle animation when today's speaker changes is acceptable.

---

# 28. Color Semantics

Use consistent semantic colors:

```text
Primary
Today's speaker

Success
Completed

Warning
Postponed

Neutral
Upcoming

Muted
Past
```

Do not rely solely on color.

Always combine colors with:

- icons
- text
- labels

for accessibility.

---

# 29. Accessibility

Implement basic accessibility properly.

Requirements:

- semantic HTML
- keyboard accessible buttons
- visible focus states
- sufficient contrast
- labels for inputs
- ARIA only when actually necessary
- do not use `<div>` as a button
- confirmation dialogs should be keyboard accessible

---

# 30. Architecture

Even though this is a small application, keep the code organized.

Suggested structure:

```text
/
├── index.html
├── css/
│   ├── reset.css
│   ├── variables.css
│   ├── style.css
│   └── responsive.css
│
├── js/
│   ├── app.js
│   │
│   ├── core/
│   │   ├── store.js
│   │   └── state.js
│   │
│   ├── services/
│   │   └── schedule-service.js
│   │
│   ├── repositories/
│   │   └── local-storage-repository.js
│   │
│   ├── utils/
│   │   ├── date.js
│   │   ├── id.js
│   │   └── validation.js
│   │
│   └── ui/
│       ├── dashboard.js
│       ├── schedule.js
│       ├── students.js
│       └── settings.js
│
└── README.md
```

This is a guideline, not a religion.

If a simpler structure provides the same separation of concerns, prefer the simpler structure.

---

# 31. State Management

Do not introduce Redux/Zustand/etc.

Use a simple application state.

For example:

```js
const state = {
  classInfo: {},
  students: [],
  schedule: [],
};
```

Use predictable state updates.

After a mutation:

```text
Update state
↓
Persist state
↓
Re-render affected UI
```

Avoid manually modifying random DOM elements without updating the underlying state.

The state should remain the source of truth.

---

# 32. Schedule Service

Create a dedicated service containing operations such as:

```js
getTodayEntry();
getUpcomingEntries();
getPastEntries();

moveEntry();
swapEntries();

postponeEntry();
completeEntry();

addStudent();
removeStudent();

generateSchedule();
recalculateDates();
```

Business logic should live here rather than inside DOM event handlers.

---

# 33. UI Navigation

A simple navigation system is enough.

Possible sections:

```text
Today
Schedule
Students
Settings
```

This can be implemented as a simple SPA without a framework.

The URL does not necessarily need a sophisticated router.

---

# 34. Dashboard UX

The dashboard should answer these questions immediately:

1. Who is speaking today?
2. Is the session already completed?
3. Who is next?
4. What happened recently?

Example:

```text
TODAY

🎤
John Doe

Scheduled

[ Mark Completed ]


UP NEXT

Tomorrow
Jane Doe

2 Oct
Michael Doe


RECENT

✓ Yesterday
Sarah Doe
```

---

# 35. Schedule Editing UX

Prefer simple interactions.

For example:

```text
┌──────────────────────────────┐
│ Sep 30                       │
│ John Doe                     │
│ Scheduled                    │
│                              │
│ ↑  ↓  ⋮                      │
└──────────────────────────────┘
```

The `⋮` menu can contain:

```text
Swap
Postpone
Edit
Remove
```

Do not put 6 giant buttons on every schedule item.

---

# 36. Empty States

Design proper empty states.

Examples:

### No students

```text
No students yet.

Add your class members to create the schedule.

[ Add Student ]
```

### No schedule

```text
No schedule has been created yet.

[ Create Schedule ]
```

### No speaker today

```text
No public speaking session today.

Enjoy the rare moment of peace.
```

The last line can be slightly playful, but keep it appropriate for a classroom application.

---

# 37. Error Handling

Never allow an uncaught JavaScript error to destroy the application UI.

Handle:

- invalid imported JSON
- corrupted localStorage
- invalid dates
- missing student references
- duplicate IDs
- invalid schedule operations

Display human-readable error messages.

Avoid exposing raw stack traces to users.

---

# 38. Confirmation Dialogs

Require confirmation for destructive operations:

```text
Delete student
Reset application
Replace imported data
Remove schedule entry
```

Do NOT require confirmation for harmless operations such as:

```text
Move up
Move down
Mark completed
```

unless there is a specific risk.

---

# 39. Optional Enhancements

Only implement these if they don't make the core application unnecessarily complex:

### Search students

Search by name.

### Dark mode

Persist preference in localStorage.

### Keyboard shortcuts

For example:

```text
T → Today
S → Schedule
```

Only if implemented cleanly.

### Shareable schedule

A future backend could allow a read-only public URL.

Do not implement this using insecure client-side tricks.

---

# 40. Future Backend Compatibility

Design the repository abstraction so this can later become:

```text
Frontend
   ↓
API
   ↓
Backend
   ↓
Database
```

Potential future API:

```text
GET    /schedule
POST   /schedule
PATCH  /schedule/:id
POST   /schedule/:id/swap
POST   /schedule/:id/postpone
POST   /schedule/:id/complete

GET    /students
POST   /students
PATCH  /students/:id
```

Do not implement the backend now unless necessary.

The first version should remain a static Vercel deployment.

---

# 41. Vercel Deployment

The application must work as a static Vercel deployment.

Requirements:

- no server required
- no environment variables required
- no build step required unless genuinely useful
- relative asset paths
- no dependency on localhost
- no hardcoded development URLs

The project should be deployable by simply connecting the Git repository to Vercel.

---

# 42. Initial Demo Data

Provide realistic demo data so the application is immediately understandable.

Example:

```text
Monday     Alice
Tuesday    Bob
Wednesday  Charlie
Thursday   David
Friday     Eve
```

But structure the application so demo data can be removed/reset.

Do not hardcode the demo schedule into the UI.

---

# 43. README

Create a concise README containing:

- Project overview
- Features
- Architecture
- Data model
- Local development
- Vercel deployment
- localStorage behavior
- Import/export behavior
- Future backend migration notes

Explain important architectural decisions briefly.

---

# 44. Quality Requirements

The implementation should prioritize:

1. Correct schedule manipulation
2. Correct date handling
3. Data consistency
4. Simple UX
5. Mobile usability
6. Maintainable code

Do NOT prioritize:

- unnecessary abstractions
- unnecessary dependencies
- visual gimmicks
- over-engineering

This is a small classroom tool, not the next distributed scheduling platform humanity apparently needed.

---

# 45. Acceptance Criteria

The implementation is considered complete when all of the following work:

### Setup

- [ ] User can create a class
- [ ] User can configure class days
- [ ] User can add students
- [ ] Initial schedule is generated automatically

### Dashboard

- [ ] Today's speaker is clearly displayed
- [ ] Upcoming speakers are visible
- [ ] Recent/completed sessions are visible
- [ ] Empty states work

### Schedule

- [ ] Full schedule is visible
- [ ] Entries can be reordered
- [ ] Students can be swapped
- [ ] Students can be postponed
- [ ] Dates recalculate correctly
- [ ] Completed sessions remain in history

### Students

- [ ] Students can be added
- [ ] Students can be edited
- [ ] Students can be archived/removed safely

### Data

- [ ] State persists after page refresh
- [ ] Corrupt localStorage does not crash the app
- [ ] Data can be exported
- [ ] Data can be imported
- [ ] Imported data is validated
- [ ] Application can be reset

### Responsive

- [ ] Works on desktop
- [ ] Works on mobile
- [ ] No horizontal scrolling
- [ ] Buttons are touch-friendly

### Deployment

- [ ] Works as static Vercel deployment
- [ ] No backend dependency
- [ ] No hardcoded localhost URLs

---

# 46. Implementation Instructions

Build the application completely, not merely a mockup.

Before writing code:

1. Define the data model.
2. Define schedule mutation rules.
3. Define date handling rules.
4. Define the application state.
5. Define the repository abstraction.
6. Then implement the UI.

Do not start by creating HTML cards and figure out the business logic afterward.

The schedule manipulation logic is the core of the application.

When implementing schedule mutations, maintain these invariants:

```text
- Every active scheduled student has a valid schedule entry.
- Schedule order is deterministic.
- Dates are valid class dates.
- Past completed sessions remain historical.
- Student references must resolve to an existing student.
- Mutations must persist after refresh.
- UI must always reflect the current state.
```

Keep the code readable and straightforward.

Do not add a framework or dependency unless it solves a real problem.

---

# 47. Final Deliverable

Produce:

```text
1. Complete working application
2. Clean responsive UI
3. Organized JavaScript architecture
4. Schedule manipulation functionality
5. localStorage persistence
6. Import/export
7. README
```

The application should feel like a small polished product rather than a coding exercise.

The most important experience should remain:

> Open the website → immediately see who is speaking today.
