/**
 * Schedule Service containing all business rules, queue manipulation,
 * date recalculation, and student management.
 */
import { store } from '../core/store.js';
import { generateId } from '../utils/id.js';
import {
  getTodayDateString,
  isClassDay,
  getNextClassDate,
  getFirstClassDateOnOrAfter,
  formatDate,
  formatShortDate,
  getRelativeDateInfo,
  DEFAULT_TIMEZONE
} from '../utils/date.js';

export class ScheduleService {
  /**
   * Helper to retrieve student by ID.
   */
  getStudent(studentId) {
    const state = store.getState();
    return state.students.find(s => s.id === studentId) || { id: studentId, name: 'Siswa Tidak Dikenal', active: false };
  }

  /**
   * Returns current active timezone.
   */
  getTimezone() {
    const state = store.getState();
    return state?.class?.timezone || DEFAULT_TIMEZONE;
  }

  /**
   * Returns today's ISO date string.
   */
  getTodayDate() {
    return getTodayDateString(this.getTimezone());
  }

  /**
   * Gets today's scheduled speaker entry, if one exists.
   */
  getTodayEntry() {
    const state = store.getState();
    if (!state || !state.schedule) return null;
    const today = this.getTodayDate();

    // Look for an entry on today's date
    const entry = state.schedule.find(s => s.date === today);
    if (!entry) return null;

    const student = this.getStudent(entry.studentId);
    const sessionNumber = this.getSessionNumber(entry.id);

    return {
      ...entry,
      student,
      sessionNumber,
      relativeDate: getRelativeDateInfo(entry.date, today)
    };
  }

  /**
   * Computes 1-based sequential session number across the schedule.
   */
  getSessionNumber(scheduleId) {
    const state = store.getState();
    const sorted = this.getSortedSchedule();
    const index = sorted.findIndex(s => s.id === scheduleId);
    return index >= 0 ? index + 1 : 1;
  }

  /**
   * Returns all schedule entries sorted chronologically with full student details.
   */
  getSortedSchedule() {
    const state = store.getState();
    if (!state || !state.schedule) return [];
    const today = this.getTodayDate();

    return [...state.schedule]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((entry, idx) => ({
        ...entry,
        student: this.getStudent(entry.studentId),
        sessionNumber: idx + 1,
        relativeDate: getRelativeDateInfo(entry.date, today)
      }));
  }

  /**
   * Gets upcoming scheduled entries (after today or active starting next).
   */
  getUpcomingEntries(limit = 7) {
    const today = this.getTodayDate();
    const sorted = this.getSortedSchedule();

    // Upcoming entries are those with date > today, or today's entry if scheduled and not completed
    const upcoming = sorted.filter(entry => {
      if (entry.date > today) return true;
      return false;
    });

    return limit ? upcoming.slice(0, limit) : upcoming;
  }

  /**
   * Gets past completed or previous sessions.
   */
  getPastEntries(limit = 10) {
    const today = this.getTodayDate();
    const sorted = this.getSortedSchedule();

    const past = sorted.filter(entry => {
      if (entry.status === 'completed') return true;
      if (entry.date < today) return true;
      return false;
    });

    // Most recent past entries first
    past.sort((a, b) => b.date.localeCompare(a.date));
    return limit ? past.slice(0, limit) : past;
  }

  /**
   * Marks a schedule entry as completed.
   */
  completeEntry(scheduleId) {
    store.setState(state => {
      const schedule = state.schedule.map(item => {
        if (item.id === scheduleId) {
          return {
            ...item,
            status: 'completed',
            completedAt: new Date().toISOString()
          };
        }
        return item;
      });
      return { ...state, schedule };
    });
  }

  /**
   * Reverts a completed entry back to scheduled status.
   */
  revertEntry(scheduleId) {
    store.setState(state => {
      const schedule = state.schedule.map(item => {
        if (item.id === scheduleId) {
          return {
            ...item,
            status: 'scheduled',
            completedAt: null
          };
        }
        return item;
      });
      return { ...state, schedule };
    });
  }

  /**
   * Updates note or status on a schedule entry.
   */
  updateEntry(scheduleId, fields = {}) {
    store.setState(state => {
      const schedule = state.schedule.map(item => {
        if (item.id === scheduleId) {
          return { ...item, ...fields };
        }
        return item;
      });
      return { ...state, schedule };
    });
  }

  /**
   * Swaps the positions of two entries and recalculates dates.
   */
  swapEntries(scheduleId1, scheduleId2) {
    const state = store.getState();
    const idx1 = state.schedule.findIndex(s => s.id === scheduleId1);
    const idx2 = state.schedule.findIndex(s => s.id === scheduleId2);

    if (idx1 === -1 || idx2 === -1 || idx1 === idx2) return false;

    // Swap student IDs or reorder entries
    const newSchedule = [...state.schedule];
    const tempStudentId = newSchedule[idx1].studentId;
    const tempNote = newSchedule[idx1].note;

    newSchedule[idx1] = {
      ...newSchedule[idx1],
      studentId: newSchedule[idx2].studentId,
      note: newSchedule[idx2].note
    };

    newSchedule[idx2] = {
      ...newSchedule[idx2],
      studentId: tempStudentId,
      note: tempNote
    };

    store.setState({ ...state, schedule: newSchedule });
    return true;
  }

  /**
   * Moves an active entry UP or DOWN in queue order, recalculating dates.
   * Locked historical entries are not affected.
   */
  moveEntry(scheduleId, direction) {
    const state = store.getState();
    const today = this.getTodayDate();

    // Sort schedule
    const sorted = [...state.schedule].sort((a, b) => a.date.localeCompare(b.date));
    const targetIdx = sorted.findIndex(s => s.id === scheduleId);
    if (targetIdx === -1) return false;

    const item = sorted[targetIdx];
    // Do not allow reordering completed or past entries
    if (item.status === 'completed' || item.date < today) {
      throw new Error('Jadwal yang sudah selesai atau telah berlalu tidak dapat digeser.');
    }

    const neighborIdx = direction === 'up' ? targetIdx - 1 : targetIdx + 1;
    if (neighborIdx < 0 || neighborIdx >= sorted.length) return false;

    const neighbor = sorted[neighborIdx];
    if (neighbor.status === 'completed' || neighbor.date < today) {
      throw new Error('Tidak dapat menggeser mendahului jadwal yang sudah selesai atau lewat.');
    }

    // Swap in array
    sorted[targetIdx] = neighbor;
    sorted[neighborIdx] = item;

    // Recalculate upcoming dates on the reordered array
    const updatedSchedule = this.recalculateDatesArray(sorted, state.class.classDays, today);
    store.setState({ ...state, schedule: updatedSchedule });
    return true;
  }

  /**
   * Postpones a student's session (e.g. sick/absent).
   * Moves the student to the end of the upcoming queue (or tomorrow),
   * shifts the remaining schedule forward, and recalculates dates.
   *
   * @param {string} scheduleId
   * @param {Object} options
   * @param {'end'|'next'} [options.target='end']
   * @param {string} [options.reason='']
   */
  postponeEntry(scheduleId, { target = 'end', reason = 'Izin / Sakit' } = {}) {
    const state = store.getState();
    const today = this.getTodayDate();
    const sorted = [...state.schedule].sort((a, b) => a.date.localeCompare(b.date));

    const idx = sorted.findIndex(s => s.id === scheduleId);
    if (idx === -1) return false;

    const [postponedItem] = sorted.splice(idx, 1);
    const dateFormatted = formatShortDate(postponedItem.date);
    const noteText = reason
      ? `Ditunda dari ${dateFormatted} (${reason})`
      : `Ditunda dari ${dateFormatted}`;

    const updatedItem = {
      ...postponedItem,
      status: 'postponed',
      note: postponedItem.note ? `${postponedItem.note} | ${noteText}` : noteText
    };

    if (target === 'next') {
      // Insert right after the next active slot
      const insertIdx = Math.min(idx + 1, sorted.length);
      sorted.splice(insertIdx, 0, updatedItem);
    } else {
      // Append to end of schedule
      sorted.push(updatedItem);
    }

    const updatedSchedule = this.recalculateDatesArray(sorted, state.class.classDays, today);
    store.setState({ ...state, schedule: updatedSchedule });
    return true;
  }

  /**
   * Marks a student as skipped for the day.
   * Advances the queue so the next student speaks, keeping the skipped record.
   */
  skipEntry(scheduleId, reason = 'Dilewati') {
    const state = store.getState();
    const today = this.getTodayDate();
    const sorted = [...state.schedule].sort((a, b) => a.date.localeCompare(b.date));

    const idx = sorted.findIndex(s => s.id === scheduleId);
    if (idx === -1) return false;

    // Mark as skipped and lock its date to current
    sorted[idx] = {
      ...sorted[idx],
      status: 'skipped',
      note: sorted[idx].note ? `${sorted[idx].note} | ${reason}` : reason
    };

    // The rest of the pending items after this one get recalculated starting from today
    // if today has no other active speaker!
    const updatedSchedule = this.recalculateDatesArray(sorted, state.class.classDays, today);
    store.setState({ ...state, schedule: updatedSchedule });
    return true;
  }

  /**
   * Deletes a schedule entry.
   */
  deleteScheduleEntry(scheduleId) {
    const state = store.getState();
    const today = this.getTodayDate();
    const remaining = state.schedule.filter(s => s.id !== scheduleId);
    const updated = this.recalculateDatesArray(remaining, state.class.classDays, today);
    store.setState({ ...state, schedule: updated });
  }

  /**
   * Pure algorithm to recalculate dates for an array of schedule items.
   * Historical / completed entries are preserved as-is.
   * Active entries are assigned sequential class days.
   */
  recalculateDatesArray(scheduleItems, classDays = [1, 2, 3, 4, 5], today = this.getTodayDate()) {
    // Separate into historical/completed and active
    const historical = [];
    const active = [];

    // Check if there is already a completed or skipped session on today
    let todayHasFinishedSession = false;

    for (const item of scheduleItems) {
      if (item.status === 'completed' || item.status === 'skipped') {
        historical.push(item);
        if (item.date === today) {
          todayHasFinishedSession = true;
        }
      } else if (item.date < today) {
        // Uncompleted item in past - treat as active to be rescheduled starting today
        active.push(item);
      } else {
        active.push(item);
      }
    }

    // Determine starting date for active queue
    let nextDate;
    if (!todayHasFinishedSession && isClassDay(today, classDays)) {
      nextDate = today;
    } else {
      nextDate = getNextClassDate(today, classDays);
    }

    // Assign sequential class dates to active items
    const recalculatedActive = active.map(item => {
      const assignedDate = nextDate;
      nextDate = getNextClassDate(nextDate, classDays);
      return {
        ...item,
        date: assignedDate
      };
    });

    return [...historical, ...recalculatedActive].sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Adds a new student to the class.
   * Optionally appends them to the upcoming schedule automatically.
   */
  addStudent({ name }, addToSchedule = true) {
    if (!name || !name.trim()) throw new Error('Nama siswa tidak boleh kosong.');
    const state = store.getState();
    const newStudent = {
      id: generateId('student'),
      name: name.trim(),
      active: true
    };

    let newSchedule = [...state.schedule];

    if (addToSchedule) {
      const today = this.getTodayDate();
      const newEntry = {
        id: generateId('schedule'),
        studentId: newStudent.id,
        date: today, // will be recalculated to next valid slot
        status: 'scheduled',
        completedAt: null,
        note: null
      };
      newSchedule.push(newEntry);
      newSchedule = this.recalculateDatesArray(newSchedule, state.class.classDays, today);
    }

    store.setState({
      ...state,
      students: [...state.students, newStudent],
      schedule: newSchedule
    });

    return newStudent;
  }

  /**
   * Updates an existing student's details.
   */
  updateStudent(studentId, { name, active }) {
    store.setState(state => {
      const students = state.students.map(s => {
        if (s.id === studentId) {
          return {
            ...s,
            name: name !== undefined ? name.trim() : s.name,
            active: active !== undefined ? Boolean(active) : s.active
          };
        }
        return s;
      });
      return { ...state, students };
    });
  }

  /**
   * Archives a student: marks them inactive and removes only FUTURE uncompleted sessions.
   * Preserves historical completed sessions.
   */
  archiveStudent(studentId) {
    const state = store.getState();
    const today = this.getTodayDate();

    const students = state.students.map(s => (s.id === studentId ? { ...s, active: false } : s));

    // Remove only future/uncompleted schedule entries for this student
    const schedule = state.schedule.filter(item => {
      if (item.studentId === studentId) {
        // Keep completed items
        return item.status === 'completed';
      }
      return true;
    });

    const recalculatedSchedule = this.recalculateDatesArray(schedule, state.class.classDays, today);

    store.setState({
      ...state,
      students,
      schedule: recalculatedSchedule
    });
  }

  /**
   * Permanently deletes a student if they have no historical data.
   */
  deleteStudent(studentId) {
    const state = store.getState();
    const today = this.getTodayDate();

    // Check if student has completed sessions
    const hasCompleted = state.schedule.some(
      s => s.studentId === studentId && s.status === 'completed'
    );
    if (hasCompleted) {
      throw new Error(
        'Siswa memiliki riwayat sesi selesai. Gunakan opsi "Arsipkan" agar data riwayat kelas tetap aman.'
      );
    }

    const students = state.students.filter(s => s.id !== studentId);
    const schedule = state.schedule.filter(s => s.studentId !== studentId);
    const recalculatedSchedule = this.recalculateDatesArray(schedule, state.class.classDays, today);

    store.setState({
      ...state,
      students,
      schedule: recalculatedSchedule
    });
  }

  /**
   * Generates a clean schedule for a list of students from scratch.
   */
  generateScheduleFromScratch(studentList, startDate, classDays) {
    const firstDate = getFirstClassDateOnOrAfter(startDate, classDays);
    let currDate = firstDate;

    const newSchedule = studentList.map((student, idx) => {
      const entry = {
        id: generateId('schedule'),
        studentId: student.id,
        date: currDate,
        status: 'scheduled',
        completedAt: null,
        note: null
      };
      currDate = getNextClassDate(currDate, classDays);
      return entry;
    });

    return newSchedule;
  }

  /**
   * Updates class configuration and recalculates schedule if class days changed.
   */
  updateClassInfo(classInfo) {
    const state = store.getState();
    const today = this.getTodayDate();

    const updatedClass = {
      ...state.class,
      ...classInfo
    };

    // Recalculate schedule with new class days
    const recalculatedSchedule = this.recalculateDatesArray(
      state.schedule,
      updatedClass.classDays,
      today
    );

    store.setState({
      ...state,
      class: updatedClass,
      schedule: recalculatedSchedule
    });
  }

  /**
   * Randomizes / shuffles upcoming uncompleted schedule order.
   * Useful for fair drawing in classrooms.
   */
  shuffleUpcoming() {
    const state = store.getState();
    const today = this.getTodayDate();
    const sorted = [...state.schedule].sort((a, b) => a.date.localeCompare(b.date));

    const historical = [];
    const upcoming = [];

    for (const item of sorted) {
      if (item.status === 'completed' || item.date < today) {
        historical.push(item);
      } else {
        upcoming.push(item);
      }
    }

    // Fisher-Yates shuffle on upcoming
    for (let i = upcoming.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [upcoming[i], upcoming[j]] = [upcoming[j], upcoming[i]];
    }

    const merged = [...historical, ...upcoming];
    const recalculated = this.recalculateDatesArray(merged, state.class.classDays, today);
    store.setState({ ...state, schedule: recalculated });
  }

  /**
   * Returns summary statistics for class dashboard.
   */
  getStatistics() {
    const state = store.getState();
    const totalStudents = state.students.filter(s => s.active).length;
    const completedCount = state.schedule.filter(s => s.status === 'completed').length;
    const scheduledCount = state.schedule.filter(s => s.status === 'scheduled').length;
    const postponedCount = state.schedule.filter(s => s.status === 'postponed').length;

    return {
      totalStudents,
      completedCount,
      scheduledCount,
      postponedCount,
      totalSessions: state.schedule.length
    };
  }
}

export const scheduleService = new ScheduleService();
