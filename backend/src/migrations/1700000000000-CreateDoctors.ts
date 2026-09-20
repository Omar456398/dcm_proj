import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDoctors1700000000000 implements MigrationInterface {
  name = 'CreateDoctors1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "doctor" (
        "id"   UUID        NOT NULL DEFAULT gen_random_uuid(),
        "name" VARCHAR(255) NOT NULL,
        CONSTRAINT "PK_doctor_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "doctor"`);
  }
}
