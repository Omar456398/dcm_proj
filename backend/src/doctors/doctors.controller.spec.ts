import { Test, TestingModule } from '@nestjs/testing';
import { DoctorsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';
import { Doctor } from '../entities/doctor.entity';

describe('DoctorsController', () => {
  let controller: DoctorsController;
  let service: DoctorsService;

  const mockDoctors: Doctor[] = [
    { id: '1', name: 'Dr. Alexander Wright', appointments: [] },
    { id: '2', name: 'Dr. Sarah Mitchell', appointments: [] },
  ];

  const mockService = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DoctorsController],
      providers: [
        {
          provide: DoctorsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<DoctorsController>(DoctorsController);
    service = module.get<DoctorsService>(DoctorsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all doctors sorted by name', async () => {
      mockService.findAll.mockResolvedValue(mockDoctors);

      const result = await controller.findAll();
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockDoctors);
    });
  });
});
