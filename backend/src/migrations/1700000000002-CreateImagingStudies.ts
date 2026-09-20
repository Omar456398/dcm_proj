import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateImagingStudies1700000000002 implements MigrationInterface {
  name = 'CreateImagingStudies1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "imaging_study" (
        "id"            UUID         NOT NULL DEFAULT gen_random_uuid(),
        "appointmentId" UUID         NOT NULL,
        "modality"      VARCHAR(16)  NOT NULL,
        "description"   TEXT,
        "dicomFilePath" VARCHAR(512) NOT NULL,
        CONSTRAINT "PK_imaging_study_id"        PRIMARY KEY ("id"),
        CONSTRAINT "FK_imaging_study_appointment" FOREIGN KEY ("appointmentId")
          REFERENCES "appointment" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_imaging_study_appointment"
        ON "imaging_study" ("appointmentId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_imaging_study_appointment"`);
    await queryRunner.query(`DROP TABLE "imaging_study"`);
  }
}
