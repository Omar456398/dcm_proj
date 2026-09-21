import { Test, TestingModule } from '@nestjs/testing';
import { ImagingStudiesController } from './imaging-studies.controller';
import { ImagingStudiesService } from './imaging-studies.service';
import { ImagingStudy } from '../entities/imaging-study.entity';
import { StreamableFile } from '@nestjs/common';
import type { Response } from 'express';

describe('ImagingStudiesController', () => {
  let controller: ImagingStudiesController;
  let service: ImagingStudiesService;

  const mockStudy: ImagingStudy = {
    id: 'f1a9e320-80d1-4e76-8809-3c87e411b001',
    appointmentId: 'b5d77c35-a490-4637-82f4-e70f1402ad0c',
    appointment: null,
    modality: 'MR',
    description: 'Brain MRI T1 Axial',
    dicomFilePath: 'assets/mri.dcm',
  };

  const mockService = {
    findOne: jest.fn(),
    getStudyFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImagingStudiesController],
      providers: [
        {
          provide: ImagingStudiesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ImagingStudiesController>(ImagingStudiesController);
    service = module.get<ImagingStudiesService>(ImagingStudiesService);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('returns imaging study by id', async () => {
      mockService.findOne.mockResolvedValue(mockStudy);

      const result = await controller.findOne(mockStudy.id);
      expect(service.findOne).toHaveBeenCalledWith(mockStudy.id);
      expect(result).toEqual(mockStudy);
    });
  });

  describe('getFile', () => {
    it('returns streamable file from service', async () => {
      const mockStreamable = {} as StreamableFile;
      const mockRes = {} as Response;
      mockService.getStudyFile.mockResolvedValue(mockStreamable);

      const result = await controller.getFile(mockStudy.id, mockRes);
      expect(service.getStudyFile).toHaveBeenCalledWith(mockStudy.id, mockRes);
      expect(result).toBe(mockStreamable);
    });
  });
});
