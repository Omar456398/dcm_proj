import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorsService } from './doctors.service';
import { Doctor } from '../entities/doctor.entity';

describe('DoctorsService', () => {
  let service: DoctorsService;
  let doctorRepo: jest.Mocked<Partial<Repository<Doctor>>>;

  const mockDoctors: Doctor[] = [
    { id: '1', name: 'Dr. Alexander Wright', appointments: [] },
    { id: '2', name: 'Dr. Sarah Mitchell', appointments: [] },
  ];

  beforeEach(async () => {
    doctorRepo = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorsService,
        {
          provide: getRepositoryToken(Doctor),
          useValue: doctorRepo,
        },
      ],
    }).compile();

    service = module.get<DoctorsService>(DoctorsService);
  });

  describe('findAll', () => {
    it('finds all doctors ordered by name ASC', async () => {
      (doctorRepo.find as jest.Mock).mockResolvedValue(mockDoctors);

      const result = await service.findAll();
      expect(doctorRepo.find).toHaveBeenCalledWith({
        order: { name: 'ASC' },
      });
      expect(result).toEqual(mockDoctors);
    });
  });
});
