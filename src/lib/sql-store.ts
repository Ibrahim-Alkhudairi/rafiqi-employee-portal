import "server-only";
import sql from "mssql";
import { companyKey, normalizeEmail } from "./normalize";
import type { Store } from "./types";

// The portal's SQL login (rafiqi_portal) may only SELECT/INSERT/UPDATE
// dbo.EmployeeTrackings; every query here stays inside that grant. Matching
// sign-ups to app accounts (IsRegisteredInApp) is done by the backend.

const g = globalThis as typeof globalThis & { __rafiqiPool?: Promise<sql.ConnectionPool> };

function pool(): Promise<sql.ConnectionPool> {
  if (!g.__rafiqiPool) {
    const connecting = new sql.ConnectionPool(process.env.RAFIQI_DB_URL!).connect();
    // A failed connect is not cached, so the next request tries again.
    connecting.catch(() => {
      g.__rafiqiPool = undefined;
    });
    g.__rafiqiPool = connecting;
  }
  return g.__rafiqiPool;
}

export const sqlStore: Store = {
  async saveEmployee({ fullName, email, companyName }, previousNormalizedEmail) {
    const db = await pool();
    const normalizedEmail = normalizeEmail(email);
    await db
      .request()
      .input("fullName", sql.NVarChar(200), fullName)
      .input("email", sql.NVarChar(256), email.trim())
      .input("normalizedEmail", sql.NVarChar(256), normalizedEmail)
      .input("previous", sql.NVarChar(256), previousNormalizedEmail ?? null)
      .input("companyName", sql.NVarChar(200), companyName)
      .input("companyKey", sql.NVarChar(200), companyKey(companyName))
      .query(`
        SET XACT_ABORT ON;
        BEGIN TRANSACTION;

        -- A corrected email: move the earlier row rather than keep both. If the
        -- new email already has a row, that one wins and the earlier row is retired.
        IF @previous IS NOT NULL AND @previous <> @normalizedEmail
          AND EXISTS (SELECT 1 FROM dbo.EmployeeTrackings WITH (UPDLOCK, HOLDLOCK)
                      WHERE NormalizedEmail = @previous AND IsDeleted = 0)
        BEGIN
          IF EXISTS (SELECT 1 FROM dbo.EmployeeTrackings WITH (UPDLOCK, HOLDLOCK)
                     WHERE NormalizedEmail = @normalizedEmail AND IsDeleted = 0)
            UPDATE dbo.EmployeeTrackings
            SET IsDeleted = 1, DeleteDate = SYSUTCDATETIME(), ModificationDate = SYSUTCDATETIME()
            WHERE NormalizedEmail = @previous AND IsDeleted = 0;
          ELSE
            -- A different email is a different app account: match it afresh.
            UPDATE dbo.EmployeeTrackings
            SET Email = @email, NormalizedEmail = @normalizedEmail,
                IsRegisteredInApp = 0, RegisteredInAppDate = NULL, ModificationDate = SYSUTCDATETIME()
            WHERE NormalizedEmail = @previous AND IsDeleted = 0;
        END;

        MERGE dbo.EmployeeTrackings WITH (HOLDLOCK) AS t
        USING (SELECT @normalizedEmail AS NormalizedEmail) AS s
          ON t.NormalizedEmail = s.NormalizedEmail AND t.IsDeleted = 0
        WHEN MATCHED THEN UPDATE SET
          FullName = @fullName, Email = @email, CompanyName = @companyName, CompanyKey = @companyKey,
          ConsentDate = SYSUTCDATETIME(), ModificationDate = SYSUTCDATETIME()
        WHEN NOT MATCHED THEN INSERT
          (FullName, Email, NormalizedEmail, CompanyName, CompanyKey, ConsentDate, IsRegisteredInApp, CreationDate, IsDeleted)
          VALUES (@fullName, @email, @normalizedEmail, @companyName, @companyKey, SYSUTCDATETIME(), 0, SYSUTCDATETIME(), 0);

        COMMIT;`);
  },
};
