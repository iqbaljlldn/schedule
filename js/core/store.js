/**
 * Central State Store with reactive subscribers and automatic persistence.
 */
import { scheduleRepository } from '../repositories/local-storage-repository.js';
import { createDemoState, createEmptyState } from './state.js';

class Store {
  constructor() {
    this.state = null;
    this.listeners = new Set();
  }

  /**
   * Initializes store state from repository or demo data.
   */
  init() {
    const saved = scheduleRepository.loadSchedule();
    if (saved) {
      this.state = saved;
    } else {
      // First visit: load realistic demo data so app is immediately usable
      this.state = createDemoState();
      scheduleRepository.saveSchedule(this.state);
    }
    return this.state;
  }

  /**
   * Returns a copy of the current state.
   */
  getState() {
    return this.state;
  }

  /**
   * Subscribes a listener to state changes.
   * @param {Function} listener
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Predictable state mutation: updates state, persists to localStorage, and notifies listeners.
   * @param {Object|Function} updater
   */
  setState(updater) {
    const nextState = typeof updater === 'function' ? updater(this.state) : updater;
    this.state = nextState;
    scheduleRepository.saveSchedule(this.state);
    this.notify();
  }

  /**
   * Notifies all active subscribers.
   */
  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (err) {
        console.error('Error in store listener:', err);
      }
    }
  }

  /**
   * Replaces current state with validated external state (e.g. from JSON import).
   * @param {Object} newState
   */
  replaceState(newState) {
    this.setState(() => newState);
  }

  /**
   * Resets application state to demo data.
   */
  resetToDemo() {
    this.setState(() => createDemoState());
  }

  /**
   * Clears state completely to start fresh class setup.
   */
  resetToEmpty() {
    const empty = createEmptyState();
    this.setState(() => empty);
  }
}

export const store = new Store();
