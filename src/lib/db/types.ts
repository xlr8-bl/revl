/** The minimal slice of expo-sqlite's SQLiteDatabase that the RevealLog store uses. */
export type RevlDatabase = {
  execSync: (sql: string) => void;
  runSync: (sql: string, params: (string | number | null)[]) => unknown;
  getAllSync: <T>(sql: string) => T[];
};
