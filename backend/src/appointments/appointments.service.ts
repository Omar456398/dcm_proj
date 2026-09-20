import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Appointment } from '../entities/appointment.entity';
import { Doctor } from '../entities/doctor.entity';
import {
  AppointmentStatus,
  CreateAppointmentDto,
  ListAppointmentsDto,
  UpdateStatusDto,
} from './dto/appointments.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  // ── 1 & 2: List with date + optional doctor/status filters ──────────────
  async list(query: ListAppointmentsDto): Promise<Appointment[]> {
    // Interpret the date as a full UTC day range.
    // Timezone assumption: all datetimes stored in UTC; "date" param is UTC date.
    const dayStart = new Date(`${query.date}T00:00:00.000Z`);
    const dayEnd = new Date(`${query.date}T23:59:59.999Z`);

    const qb = this.appointmentRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.doctor', 'doctor')
      .where('a.startsAt >= :dayStart AND a.startsAt <= :dayEnd', {
        dayStart,
        dayEnd,
      })
      .orderBy('a.startsAt', 'ASC');

    if (query.doctorId) {
      qb.andWhere('a.doctorId = :doctorId', { doctorId: query.doctorId });
    }

    if (query.status) {
      qb.andWhere('a.status = :status', { status: query.status });
    }

    return qb.getMany();
  }

  // ── Single appointment ───────────────────────────────────────────────────
  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepo.findOne({
      where: { id },
      relations: { doctor: true },
    });
    if (!appointment) {
      throw new NotFoundException(`Appointment ${id} not found`);
    }
    return appointment;
  }

  // ── 3 & 5: Create with advisory-lock-based conflict prevention ───────────
  async create(dto: CreateAppointmentDto): Promise<Appointment> {
    // Verify doctor exists before acquiring lock
    const doctor = await this.doctorRepo.findOne({
      where: { id: dto.doctorId },
    });
    if (!doctor) {
      throw new NotFoundException(`Doctor ${dto.doctorId} not found`);
    }

    return this.dataSource.transaction(async (em) => {
      // Advisory lock scoped to this transaction, keyed per doctor.
      // Serializes all concurrent creates for the same doctor; different
      // doctors never block each other.
      await em.query(
        `SELECT pg_advisory_xact_lock(hashtext($1))`,
        [dto.doctorId],
      );

      const startsAt = new Date(dto.startsAt);
      const endsAt = new Date(
        startsAt.getTime() + dto.durationMinutes * 60_000,
      );

      // Overlap check: non-cancelled appointments whose window intersects.
      // Adjacent slots (end == next start) are explicitly allowed.
      const conflicts: Array<{ startsAt: Date; durationMinutes: number }> =
        await em.query(
          `SELECT "startsAt", "durationMinutes"
           FROM   appointment
           WHERE  "doctorId" = $1
             AND  status     != 'cancelled'
             AND  "startsAt"  < $3
             AND  ("startsAt" + "durationMinutes" * INTERVAL '1 minute') > $2`,
          [dto.doctorId, startsAt.toISOString(), endsAt.toISOString()],
        );

      if (conflicts.length > 0) {
        const conflict = conflicts[0];
        const cStart = new Date(conflict.startsAt);
        const cEnd = new Date(
          cStart.getTime() + conflict.durationMinutes * 60_000,
        );
        const fmt = (d: Date) =>
          d.toISOString().slice(11, 16) + ' UTC';

        throw new ConflictException({
          error: 'APPOINTMENT_CONFLICT',
          message: `${doctor.name} already has an appointment from ${fmt(cStart)} to ${fmt(cEnd)} that overlaps with the requested slot.`,
          conflictingSlot: {
            startsAt: cStart.toISOString(),
            endsAt: cEnd.toISOString(),
          },
        });
      }

      const appointment = em.create(Appointment, {
        patientName: dto.patientName,
        doctorId: dto.doctorId,
        startsAt,
        durationMinutes: dto.durationMinutes,
        status: AppointmentStatus.SCHEDULED,
        reason: dto.reason ?? null,
      });

      return em.save(appointment);
    });
  }

  // ── 4: Update appointment status ─────────────────────────────────────────
  async updateStatus(id: string, dto: UpdateStatusDto): Promise<Appointment> {
    const appointment = await this.appointmentRepo.findOne({ where: { id } });
    if (!appointment) {
      throw new NotFoundException(`Appointment ${id} not found`);
    }

    appointment.status = dto.status;
    return this.appointmentRepo.save(appointment);
  }
}
