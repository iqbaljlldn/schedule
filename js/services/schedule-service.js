/**
 * Schedule Service containing all business rules, queue manipulation,
 * multi-round cycling, carry-over debt handling, and date recalculation.
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
    return (
      state.students.find(s => s.id === studentId) || {
        id: studentId,
        name: 'Siswa Tidak Dikenal',
        active: false
      }
    );
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

    const entry = state.schedule.find(s => s.date === today);
    if (!entry) return null;

    const student = this.getStudent(entry.studentId);
    const sessionNumber = this.getSessionNumber(entry.id);

    return {
      ...entry,
      round: entry.round || 1,
      isCarryOver: Boolean(entry.isCarryOver),
      carryOverFromRound: entry.carryOverFromRound || null,
      student,
      sessionNumber,
      relativeDate: getRelativeDateInfo(entry.date, today)
    };
  }

  /**
   * Computes 1-based sequential session number across the schedule.
   */
  getSessionNumber(scheduleId) {
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
        round: entry.round || 1,
        isCarryOver: Boolean(entry.isCarryOver),
        carryOverFromRound: entry.carryOverFromRound || null,
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

    past.sort((a, b) => b.date.localeCompare(a.date));
    return limit ? past.slice(0, limit) : past;
  }

  /**
   * Returns the current active round (round of first upcoming/today active entry).
   */
  getCurrentRound() {
    const todayEntry = this.getTodayEntry();
    if (todayEntry) return todayEntry.round;

    const upcoming = this.getUpcomingEntries(1);
    if (upcoming.length > 0) return upcoming[0].round;

    const all = this.getSortedSchedule();
    if (all.length === 0) return 1;
    return all[all.length - 1].round || 1;
  }

  /**
   * Returns the maximum round currently generated.
   */
  getTotalRounds() {
    const state = store.getState();
    if (!state?.schedule?.length) return 1;
    return state.schedule.reduce((max, s) => Math.max(max, s.round || 1), 1);
  }

  /**
   * Checks if an entry is at the very end of its round or already postponed.
   */
  isLastInRound(scheduleId) {
    const sorted = this.getSortedSchedule();
    const item = sorted.find(s => s.id === scheduleId);
    if (!item) return false;

    const roundItems = sorted.filter(s => s.round === item.round && s.status !== 'completed');
    if (roundItems.length === 0) return false;

    return roundItems[roundItems.length - 1].id === scheduleId;
  }

  /**
   * Marks a schedule entry as completed.
   * If this was the last entry of the round, can trigger or prepare next round.
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
   */
  moveEntry(scheduleId, direction) {
    const state = store.getState();
    const today = this.getTodayDate();

    const sorted = [...state.schedule].sort((a, b) => a.date.localeCompare(b.date));
    const targetIdx = sorted.findIndex(s => s.id === scheduleId);
    if (targetIdx === -1) return false;

    const item = sorted[targetIdx];
    if (item.status === 'completed' || item.date < today) {
      throw new Error('Jadwal yang sudah selesai atau telah berlalu tidak dapat digeser.');
    }

    const neighborIdx = direction === 'up' ? targetIdx - 1 : targetIdx + 1;
    if (neighborIdx < 0 || neighborIdx >= sorted.length) return false;

    const neighbor = sorted[neighborIdx];
    if (neighbor.status === 'completed' || neighbor.date < today) {
      throw new Error('Tidak dapat menggeser mendahului jadwal yang sudah selesai atau lewat.');
    }

    sorted[targetIdx] = neighbor;
    sorted[neighborIdx] = item;

    const updatedSchedule = this.recalculateDatesArray(sorted, state.class.classDays, today);
    store.setState({ ...state, schedule: updatedSchedule });
    return true;
  }

  /**
   * Postpones a student's session.
   * Supports:
   * - 'end': move to end of current round
   * - 'next': move to tomorrow/next slot
   * - 'carry_over': carry-over to next round as Priority #1
   * - 'skip': mark as skipped in this round
   */
  postponeEntry(scheduleId, { target = 'end', reason = 'Izin / Sakit' } = {}) {
    const state = store.getState();
    const today = this.getTodayDate();
    const sorted = [...state.schedule].sort((a, b) => a.date.localeCompare(b.date));

    const idx = sorted.findIndex(s => s.id === scheduleId);
    if (idx === -1) return false;

    const currentItem = sorted[idx];
    const currentRound = currentItem.round || 1;
    const dateFormatted = formatShortDate(currentItem.date);

    // Case 1: Carry-Over to Next Round
    if (target === 'carry_over') {
      // Mark current item as postponed/carried over
      sorted[idx] = {
        ...currentItem,
        status: 'postponed',
        note: currentItem.note
          ? `${currentItem.note} | Ditunda ke Putaran Berikutnya (${reason})`
          : `Ditunda ke Putaran Berikutnya (${reason})`
      };

      // Ensure next round exists with this student as #1
      const nextRound = currentRound + 1;
      const nextRoundExists = sorted.some(s => (s.round || 1) === nextRound);

      let finalSchedule;
      if (!nextRoundExists) {
        finalSchedule = this.buildNextRoundSchedule(sorted, {
          carryOverStudentIds: [currentItem.studentId]
        });
      } else {
        // If next round already exists, insert as first in next round
        const firstNextRoundIdx = sorted.findIndex(s => (s.round || 1) === nextRound);
        const newEntry = {
          id: generateId('schedule'),
          studentId: currentItem.studentId,
          date: today, // will be recalculated
          round: nextRound,
          status: 'scheduled',
          completedAt: null,
          note: `Prioritas Pembuka Putaran #${nextRound} (Tunggakan Putaran #${currentRound})`,
          isCarryOver: true,
          carryOverFromRound: currentRound
        };
        sorted.splice(firstNextRoundIdx >= 0 ? firstNextRoundIdx : sorted.length, 0, newEntry);
        finalSchedule = this.recalculateDatesArray(sorted, state.class.classDays, today);
      }

      store.setState({ ...state, schedule: finalSchedule });
      return true;
    }

    // Case 2: Skip in this round
    if (target === 'skip') {
      sorted[idx] = {
        ...currentItem,
        status: 'skipped',
        note: currentItem.note
          ? `${currentItem.note} | Dilewati di Putaran #${currentRound} (${reason})`
          : `Dilewati di Putaran #${currentRound} (${reason})`
      };
      const updatedSchedule = this.recalculateDatesArray(sorted, state.class.classDays, today);
      store.setState({ ...state, schedule: updatedSchedule });
      return true;
    }

    // Case 3: Move to end or next slot in queue
    const [postponedItem] = sorted.splice(idx, 1);
    const noteText = reason
      ? `Ditunda dari ${dateFormatted} (${reason})`
      : `Ditunda dari ${dateFormatted}`;

    const updatedItem = {
      ...postponedItem,
      status: 'postponed',
      note: postponedItem.note ? `${postponedItem.note} | ${noteText}` : noteText
    };

    if (target === 'next') {
      const insertIdx = Math.min(idx + 1, sorted.length);
      sorted.splice(insertIdx, 0, updatedItem);
    } else {
      // Find the end of the current round
      let insertIdx = sorted.length;
      for (let i = sorted.length - 1; i >= 0; i--) {
        if ((sorted[i].round || 1) === currentRound) {
          insertIdx = i + 1;
          break;
        }
      }
      sorted.splice(insertIdx, 0, updatedItem);
    }

    const updatedSchedule = this.recalculateDatesArray(sorted, state.class.classDays, today);
    store.setState({ ...state, schedule: updatedSchedule });
    return true;
  }

  /**
   * Starts a brand new round (Round 2, 3, etc.) for all active students.
   * If carryOverStudentIds is provided, those students are placed at position #1.
   */
  startNextRound({ shuffle = false, carryOverStudentIds = [] } = {}) {
    const state = store.getState();
    const updatedSchedule = this.buildNextRoundSchedule(state.schedule, {
      shuffle,
      carryOverStudentIds
    });
    store.setState({ ...state, schedule: updatedSchedule });
    return this.getTotalRounds();
  }

  /**
   * Internal generator for next round entries.
   */
  buildNextRoundSchedule(currentSchedule, { shuffle = false, carryOverStudentIds = [] } = {}) {
    const state = store.getState();
    const today = this.getTodayDate();
    const sorted = [...currentSchedule].sort((a, b) => a.date.localeCompare(b.date));

    const currentMaxRound = sorted.reduce((max, s) => Math.max(max, s.round || 1), 1);
    const nextRound = currentMaxRound + 1;

    // Determine start date of next round
    const lastDate = sorted.length > 0 ? sorted[sorted.length - 1].date : today;
    let nextDate = getNextClassDate(lastDate, state.class.classDays);

    const activeStudents = state.students.filter(s => s.active);
    let regularStudentIds = activeStudents
      .map(s => s.id)
      .filter(id => !carryOverStudentIds.includes(id));

    if (shuffle) {
      for (let i = regularStudentIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [regularStudentIds[i], regularStudentIds[j]] = [regularStudentIds[j], regularStudentIds[i]];
      }
    }

    const orderedStudentIds = [...carryOverStudentIds, ...regularStudentIds];

    const newRoundEntries = orderedStudentIds.map(studentId => {
      const isCarryOver = carryOverStudentIds.includes(studentId);
      const assignedDate = nextDate;
      nextDate = getNextClassDate(nextDate, state.class.classDays);

      return {
        id: generateId('schedule'),
        studentId,
        date: assignedDate,
        round: nextRound,
        status: 'scheduled',
        completedAt: null,
        note: isCarryOver
          ? `Prioritas Pembuka Putaran #${nextRound} (Tunggakan Putaran #${currentMaxRound})`
          : null,
        isCarryOver,
        carryOverFromRound: isCarryOver ? currentMaxRound : null
      };
    });

    return [...sorted, ...newRoundEntries];
  }

  /**
   * Marks a student as skipped for the day.
   */
  skipEntry(scheduleId, reason = 'Dilewati') {
    return this.postponeEntry(scheduleId, { target: 'skip', reason });
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
  recalculateDatesArray(
    scheduleItems,
    classDays = [1, 2, 3, 4, 5],
    today = this.getTodayDate()
  ) {
    const historical = [];
    const active = [];

    let todayHasFinishedSession = false;

    for (const item of scheduleItems) {
      if (item.status === 'completed' || item.status === 'skipped') {
        historical.push(item);
        if (item.date === today) {
          todayHasFinishedSession = true;
        }
      } else if (item.date < today) {
        active.push(item);
      } else {
        active.push(item);
      }
    }

    let nextDate;
    if (!todayHasFinishedSession && isClassDay(today, classDays)) {
      nextDate = today;
    } else {
      nextDate = getNextClassDate(today, classDays);
    }

    const recalculatedActive = active.map(item => {
      const assignedDate = nextDate;
      nextDate = getNextClassDate(nextDate, classDays);
      return {
        ...item,
        date: assignedDate
      };
    });

    return [...historical, ...recalculatedActive].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }

  /**
   * Adds a new student to the class.
   */
  addStudent({ name }, addToSchedule = true) {
    if (!name || !name.trim()) throw new Error('Nama siswa tidak boleh kosong.');
    const state = store.getState();
    const currentRound = this.getCurrentRound();
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
        date: today,
        round: currentRound,
        status: 'scheduled',
        completedAt: null,
        note: null,
        isCarryOver: false,
        carryOverFromRound: null
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
   * Archives a student: marks them inactive and removes future uncompleted sessions.
   */
  archiveStudent(studentId) {
    const state = store.getState();
    const today = this.getTodayDate();

    const students = state.students.map(s => (s.id === studentId ? { ...s, active: false } : s));

    const schedule = state.schedule.filter(item => {
      if (item.studentId === studentId) {
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

    const newSchedule = studentList.map(student => {
      const entry = {
        id: generateId('schedule'),
        studentId: student.id,
        date: currDate,
        round: 1,
        status: 'scheduled',
        completedAt: null,
        note: null,
        isCarryOver: false,
        carryOverFromRound: null
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

    for (let i = upcoming.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [upcoming[i], upcoming[j]] = [upcoming[j], upcoming[i]];
    }

    const merged = [...historical, ...upcoming];
    const recalculated = this.recalculateDatesArray(merged, state.class.classDays, today);
    store.setState({ ...state, schedule: recalculated });
  }

  /**
   * Returns summary statistics including round info and debt tracking.
   */
  getStatistics() {
    const state = store.getState();
    const totalStudents = state.students.filter(s => s.active).length;
    const completedCount = state.schedule.filter(s => s.status === 'completed').length;
    const scheduledCount = state.schedule.filter(s => s.status === 'scheduled').length;
    const postponedCount = state.schedule.filter(s => s.status === 'postponed').length;
    const currentRound = this.getCurrentRound();
    const totalRounds = this.getTotalRounds();

    // Students with carry over debts
    const debts = state.schedule
      .filter(s => s.isCarryOver)
      .map(s => ({
        studentId: s.studentId,
        studentName: this.getStudent(s.studentId).name,
        carryOverFromRound: s.carryOverFromRound,
        currentRound: s.round
      }));

    return {
      totalStudents,
      completedCount,
      scheduledCount,
      postponedCount,
      currentRound,
      totalRounds,
      debts,
      totalSessions: state.schedule.length
    };
  }
}

export const scheduleService = new ScheduleService();
