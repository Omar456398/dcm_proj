import { AppDataSource } from './data-source';

async function seed() {
  await AppDataSource.initialize();
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // ── 1. Doctor ──────────────────────────────────────────────────────────
    const [doctor] = await queryRunner.query(
      `INSERT INTO "doctor" ("name")
       VALUES ($1)
       ON CONFLICT DO NOTHING
       RETURNING "id"`,
      ['Dr. Sarah Mitchell'],
    );

    // Re-fetch in case ON CONFLICT skipped the insert
    const doctorRow = doctor ?? (
      await queryRunner.query(
        `SELECT "id" FROM "doctor" WHERE "name" = $1 LIMIT 1`,
        ['Dr. Sarah Mitchell'],
      )
    )[0];

    const doctorId: string = doctorRow.id;

    // ── 2. Appointment ─────────────────────────────────────────────────────
    // Study date from DICOM: 2024-10-21, slotted at 10:00 UTC
    const [appointment] = await queryRunner.query(
      `INSERT INTO "appointment"
         ("patientName", "doctorId", "startsAt", "durationMinutes", "status", "reason")
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING "id"`,
      [
        'Alexandra Reed',           // PatientName from DICOM
        doctorId,
        '2026-09-20T10:00:00Z',     // StudyDate 20260920 → slotted 10:00 UTC
        60,
        'completed',
        'Headaches',               // ReasonForStudy from brain_mri.dcm
      ],
    );

    const appointmentId: string = appointment.id;

    // ── 3. Imaging studies ─────────────────────────────────────────────────
    // Series 1 — Brain MRI (primary diagnostic image)
    await queryRunner.query(
      `INSERT INTO "imaging_study"
         ("appointmentId", "modality", "description", "dicomFilePath")
       VALUES ($1, $2, $3, $4)`,
      [
        appointmentId,
        'MR',
        'Axial T2 – MRI brain without contrast. Findings: No acute intracranial abnormality.',
        'assets/dicom/brain_mri.dcm',
      ],
    );

    // Series 2 — Patient identification photo
    await queryRunner.query(
      `INSERT INTO "imaging_study"
         ("appointmentId", "modality", "description", "dicomFilePath")
       VALUES ($1, $2, $3, $4)`,
      [
        appointmentId,
        'OT',
        'Patient Identification Photo',
        'assets/dicom/face.dcm',
      ],
    );

    await queryRunner.commitTransaction();

    console.log('✅ Seed complete');
    console.log(`   Doctor      : Dr. Sarah Mitchell (${doctorId})`);
    console.log(`   Appointment : Alexandra Reed on 2026-09-20 (${appointmentId})`);
    console.log('   Studies     : brain_mri.dcm (MR) + face.dcm (OT)');
  } catch (err) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Seed failed:', err);
    process.exit(1);
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

seed();
