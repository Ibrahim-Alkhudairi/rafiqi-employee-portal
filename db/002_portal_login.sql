-- Run by a DBA on the Rafiqi database AFTER the AddEmployeeTrackings migration
-- (applied automatically when the backend starts).
-- Creates the limited login the portal uses as RAFIQI_DB_URL.
-- The password is generated when the script runs and shown once in the results:
-- copy it into RAFIQI_DB_URL. It is never written into this file.

IF OBJECT_ID(N'dbo.EmployeeTrackings', N'U') IS NULL
    THROW 50000, 'dbo.EmployeeTrackings does not exist yet: apply the AddEmployeeTrackings migration first.', 1;

-- 32 random base64 characters. The "Rp-" prefix guarantees upper case, lower
-- case and a symbol, so the password passes SQL Server's complexity policy.
DECLARE @random varbinary(24) = CRYPT_GEN_RANDOM(24);
DECLARE @password nvarchar(64) = N'Rp-' + CAST(N'' AS xml).value('xs:base64Binary(sql:variable("@random"))', 'nvarchar(64)');

-- Azure SQL Database: a contained user, created in the Rafiqi database itself.
DECLARE @create nvarchar(max) = N'CREATE USER rafiqi_portal WITH PASSWORD = ' + QUOTENAME(@password, '''') + N';';

-- Full SQL Server instead: use this line in place of the one above, to create a
-- server login first and then the user.
-- DECLARE @create nvarchar(max) = N'CREATE LOGIN rafiqi_portal WITH PASSWORD = ' + QUOTENAME(@password, '''') + N'; CREATE USER rafiqi_portal FOR LOGIN rafiqi_portal;';

EXEC sys.sp_executesql @create;

-- Sign-ups: read, insert, update. No delete, and nothing else in the database:
-- the backend matches sign-ups to app accounts and shows them in the backoffice.
GRANT SELECT, INSERT, UPDATE ON dbo.EmployeeTrackings TO rafiqi_portal;

-- The password for RAFIQI_DB_URL. Copy it now; it is not stored anywhere else.
SELECT @password AS RafiqiPortalPassword;
