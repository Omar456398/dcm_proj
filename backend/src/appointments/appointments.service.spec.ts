import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AppointmentsService } from './appointments.service';
import { Appointment } from '../entities/appointment.entity';
import { Doctor } from '../entities/doctor.entity';
import {
  AppointmentStatus,
  CreateAppointmentDto,
  ListAppointmentsDto,
  UpdateStatusDto,
} from './dto/appointments.dto';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let appointmentRepo: jest.Mocked<Partial<Repository<Appointment>>>;
  let doctorRepo: jest.Mocked<Partial<Repository<Doctor>>>;
  let dataSource: { transaction: jest.Mock };

  const mockDoctor: Doctor = {
    id: 'a00ae926-eff5-433d-8a13-89c460bc534f',
    name: 'Dr. Alexander Wright',
    appointments: [],
  };

  const mockAppointment: Appointment = {
    id: 'b5d77c35-a490-4637-82f4-e70f1402ad0c',
    patientName: 'Jane Doe',
    doctorId: mockDoctor.id,
    doctor: mockDoctor,
    startsAt: new Date('2026-09-21T10:00:00.000Z'),
    durationMinutes: 45,
    status: AppointmentStatus.SCHEDULED,
    reason: 'Follow-up MRI review',
    createdAt: new Date(),
    updatedAt: new Date(),
    imagingStudies: [],
  };

  beforeEach(async () => {
    appointmentRepo = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    doctorRepo = {
      findOne: jest.fn(),
    };

    dataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: getRepositoryToken(Appointment),
          useValue: appointmentRepo,
        },
        {
          provide: getRepositoryToken(Doctor),
          useValue: doctorRepo,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
  });

  describe('list', () => {
    it('queries appointments within date range without doctor or status filters', async () => {
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAppointment]),
      };
      (appointmentRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const query: ListAppointmentsDto = { date: '2026-09-21' };
      const result = await service.list(query);

      expect(appointmentRepo.createQueryBuilder).toHaveBeenCalledWith('a');
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('a.doctor', 'doctor');
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('a.imagingStudies', 'imagingStudies');
      expect(qb.where).toHaveBeenCalledWith(
        'a.startsAt >= :dayStart AND a.startsAt <= :dayEnd',
        expect.objectContaining({
          dayStart: new Date('2026-09-21T00:00:00.000Z'),
          dayEnd: new Date('2026-09-21T23:59:59.999Z'),
        }),
      );
      expect(qb.andWhere).not.toHaveBeenCalled();
      expect(result).toEqual([mockAppointment]);
    });

    it('applies doctorId and status filters when provided', async () => {
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAppointment]),
      };
      (appointmentRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const query: ListAppointmentsDto = {
        date: '2026-09-21',
        doctorId: mockDoctor.id,
        status: AppointmentStatus.SCHEDULED,
      };
      const result = await service.list(query);

      expect(qb.andWhere).toHaveBeenCalledWith('a.doctorId = :doctorId', { doctorId: mockDoctor.id });
      expect(qb.andWhere).toHaveBeenCalledWith('a.status = :status', { status: AppointmentStatus.SCHEDULED });
      expect(result).toEqual([mockAppointment]);
    });
  });

  describe('findOne', () => {
    it('returns appointment when found', async () => {
      (appointmentRepo.findOne as jest.Mock).mockResolvedValue(mockAppointment);

      const result = await service.findOne(mockAppointment.id);
      expect(appointmentRepo.findOne).toHaveBeenCalledWith({
        where: { id: mockAppointment.id },
        relations: { doctor: true, imagingStudies: true },
      });
      expect(result).toEqual(mockAppointment);
    });

    it('throws NotFoundException when appointment does not exist', async () => {
      (appointmentRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const dto: CreateAppointmentDto = {
      patientName: 'Jane Doe',
      doctorId: mockDoctor.id,
      startsAt: '2026-09-21T10:00:00.000Z',
      durationMinutes: 45,
      reason: 'Checkup',
    };

    it('throws NotFoundException if doctor does not exist', async () => {
      (doctorRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('creates appointment when no conflict exists', async () => {
      (doctorRepo.findOne as jest.Mock).mockResolvedValue(mockDoctor);

      const mockEntityManager: any = {
        query: jest.fn().mockImplementation((queryText: string) => {
          if (queryText.includes('pg_advisory_xact_lock')) {
            return Promise.resolve();
          }
          if (queryText.includes('SELECT "startsAt", "durationMinutes"')) {
            return Promise.resolve([]); // No conflicts
          }
          return Promise.resolve([]);
        }),
        create: jest.fn().mockReturnValue(mockAppointment),
        save: jest.fn().mockResolvedValue(mockAppointment),
      };

      dataSource.transaction.mockImplementation(async (cb) => cb(mockEntityManager));

      const result = await service.create(dto);

      expect(mockEntityManager.query).toHaveBeenCalledWith(
        'SELECT pg_advisory_xact_lock(hashtext($1))',
        [dto.doctorId],
      );
      expect(mockEntityManager.create).toHaveBeenCalledWith(
        Appointment,
        expect.objectContaining({
          patientName: dto.patientName,
          doctorId: dto.doctorId,
          durationMinutes: dto.durationMinutes,
          status: AppointmentStatus.SCHEDULED,
          reason: dto.reason,
        }),
      );
      expect(mockEntityManager.save).toHaveBeenCalledWith(mockAppointment);
      expect(result).toEqual(mockAppointment);
    });

    it('throws ConflictException when requested slot overlaps with existing appointment', async () => {
      (doctorRepo.findOne as jest.Mock).mockResolvedValue(mockDoctor);

      const conflictingStart = new Date('2026-09-21T10:15:00.000Z');
      const mockEntityManager: any = {
        query: jest.fn().mockImplementation((queryText: string) => {
          if (queryText.includes('pg_advisory_xact_lock')) {
            return Promise.resolve();
          }
          if (queryText.includes('SELECT "startsAt", "durationMinutes"')) {
            return Promise.resolve([
              { startsAt: conflictingStart, durationMinutes: 30 },
            ]);
          }
          return Promise.resolve([]);
        }),
      };

      dataSource.transaction.mockImplementation(async (cb) => cb(mockEntityManager));

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('updateStatus', () => {
    it('updates status and saves appointment when found', async () => {
      const existing = { ...mockAppointment, status: AppointmentStatus.SCHEDULED };
      (appointmentRepo.findOne as jest.Mock).mockResolvedValue(existing);
      (appointmentRepo.save as jest.Mock).mockImplementation(async (entity) => entity);

      const dto: UpdateStatusDto = { status: AppointmentStatus.COMPLETED };
      const result = await service.updateStatus(mockAppointment.id, dto);

      expect(appointmentRepo.findOne).toHaveBeenCalledWith({ where: { id: mockAppointment.id } });
      expect(appointmentRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: AppointmentStatus.COMPLETED }),
      );
      expect(result.status).toBe(AppointmentStatus.COMPLETED);
    });

    it('throws NotFoundException when appointment is not found', async () => {
      (appointmentRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateStatus('non-existent-id', { status: AppointmentStatus.COMPLETED }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
