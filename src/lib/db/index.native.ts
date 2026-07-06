/**
 * Native database entry — opens the on-device SQLite database that
 * backs the RevealLog table. (Web resolves ./index.ts instead.)
 */
import * as SQLite from 'expo-sqlite';
import type { RevlDatabase } from './types';

export function openRevlDb(): RevlDatabase | null {
  try {
    return SQLite.openDatabaseSync('revl.db');
  } catch {
    return null; // never break the app over local persistence
  }
}
