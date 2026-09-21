import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import {
  AppointmentStatus,
  CreateAppointmentDto,
  ListAppointmentsDto,
  UpdateStatusDto,
} from './dto/appointments.dto';

describe('AppointmentsController', () => {
  let controller: AppointmentsController;
  let service: AppointmentsService;

  const mockAppointment = {
    id: 'b5d77c35-a490-4637-82f4-e70f1402ad0c',
    patientName: 'Jane Doe',
    doctorId: 'a00ae926-eff5-433d-8a13-89c460bc534f',
    startsAt: new Date('2026-09-21T10:00:00.000Z'),
    durationMinutes: 45,
    status: AppointmentStatus.SCHEDULED,
    reason: 'Follow-up MRI review',
    createdAt: new Date(),
    updatedAt: new Date(),
    doctor: { id: 'a00ae926-eff5-433d-8a13-89c460bc534f', name: 'Dr. Alexander Wright' },
    imagingStudies: [],
  };

  const mockService = {
    list: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [
        {
          provide: AppointmentsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AppointmentsController>(AppointmentsController);
    service = module.get<AppointmentsService>(AppointmentsService);
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should call appointmentsService.list with query and return array', async () => {
      const query: ListAppointmentsDto = {
        date: '2026-09-21',
        doctorId: 'a00ae926-eff5-433d-8a13-89c460bc534f',
        status: AppointmentStatus.SCHEDULED,
      };
      mockService.list.mockResolvedValue([mockAppointment]);

      const result = await controller.list(query);
      expect(service.list).toHaveBeenCalledWith(query);
      expect(result).toEqual([mockAppointment]);
    });
  });

  describe('findOne', () => {
    it('should call appointmentsService.findOne with id and return appointment', async () => {
      mockService.findOne.mockResolvedValue(mockAppointment);

      const result = await controller.findOne(mockAppointment.id);
      expect(service.findOne).toHaveBeenCalledWith(mockAppointment.id);
      expect(result).toEqual(mockAppointment);
    });
  });

  describe('create', () => {
    it('should call appointmentsService.create with dto and return created appointment', async () => {
      const dto: CreateAppointmentDto = {
        patientName: 'Jane Doe',
        doctorId: 'a00ae926-eff5-433d-8a13-89c460bc534f',
        startsAt: '2026-09-21T10:00:00.000Z',
        durationMinutes: 45,
        reason: 'Follow-up MRI review',
      };
      mockService.create.mockResolvedValue(mockAppointment);

      const result = await controller.create(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockAppointment);
    });
  });

  describe('updateStatus', () => {
    it('should call appointmentsService.updateStatus with id and dto', async () => {
      const dto: UpdateStatusDto = { status: AppointmentStatus.COMPLETED };
      const updated = { ...mockAppointment, status: AppointmentStatus.COMPLETED };
      mockService.updateStatus.mockResolvedValue(updated);

      const result = await controller.updateStatus(mockAppointment.id, dto);
      expect(service.updateStatus).toHaveBeenCalledWith(mockAppointment.id, dto);
      expect(result).toEqual(updated);
    });
  });
});
