export type SignupInput = {
  fullName: string;
  email: string;
  companyName: string;
};

// Where sign-ups live: the EmployeeTrackings table in the Rafiqi database, or
// an in-memory stand-in when RAFIQI_DB_URL is unset (local runs). Who has
// registered in the app is worked out by the backend, for the backoffice tracker.
export interface Store {
  /**
   * Inserts the employee, or updates the row that already has this email. With
   * `previousNormalizedEmail` (an email this browser saved before), that row is
   * moved to the new email instead of leaving a stale second row behind.
   */
  saveEmployee(input: SignupInput, previousNormalizedEmail?: string): Promise<void>;
}
