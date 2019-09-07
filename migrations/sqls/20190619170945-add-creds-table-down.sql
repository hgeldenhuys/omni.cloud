SET search_path TO omnicloud,public;

ALTER TABLE users ADD "password" varchar(60);
UPDATE users set password=user_credentials.password from (select "userId", password from user_credentials) as user_credentials where users.id = user_credentials."userId";
ALTER TABLE users ALTER COLUMN "password" SET NOT NULL;

ALTER TABLE user_credentials DROP CONSTRAINT fk_user_credentials_users;
DROP TABLE user_credentials;
