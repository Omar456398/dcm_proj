import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAppointments1700000000001 implements MigrationInterface {
  name = 'CreateAppointments1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "appointment_status_enum" AS ENUM (
        'scheduled',
        'checked_in',
        'completed',
        'cancelled'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "appointment" (
        "id"              UUID                      NOT NULL DEFAULT gen_random_uuid(),
        "patientName"     VARCHAR(255)              NOT NULL,
        "doctorId"        UUID                      NOT NULL,
        "startsAt"        TIMESTAMPTZ               NOT NULL,
        "durationMinutes" INTEGER                   NOT NULL,
        "status"          "appointment_status_enum" NOT NULL DEFAULT 'scheduled',
        "reason"          TEXT,
        "createdAt"       TIMESTAMPTZ               NOT NULL DEFAULT now(),
        "updatedAt"       TIMESTAMPTZ               NOT NULL DEFAULT now(),
        CONSTRAINT "PK_appointment_id"          PRIMARY KEY ("id"),
        CONSTRAINT "FK_appointment_doctor"       FOREIGN KEY ("doctorId")
          REFERENCES "doctor" ("id") ON DELETE RESTRICT,
        CONSTRAINT "CHK_appointment_duration"   CHECK ("durationMinutes" > 0)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_appointment_doctor_starts"
        ON "appointment" ("doctorId", "startsAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_appointment_doctor_starts"`);
    await queryRunner.query(`DROP TABLE "appointment"`);
    await queryRunner.query(`DROP TYPE "appointment_status_enum"`);
  }
}
