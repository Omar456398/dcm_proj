import { NotFoundException, StreamableFile } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { ImagingStudiesService } from './imaging-studies.service';
import { ImagingStudy } from '../entities/imaging-study.entity';
import type { Response } from 'express';

describe('ImagingStudiesService', () => {
  let service: ImagingStudiesService;
  let repo: jest.Mocked<Partial<Repository<ImagingStudy>>>;

  const mockStudy: ImagingStudy = {
    id: 'f1a9e320-80d1-4e76-8809-3c87e411b001',
    appointmentId: 'b5d77c35-a490-4637-82f4-e70f1402ad0c',
    appointment: null,
    modality: 'MR',
    description: 'Brain MRI T1 Axial',
    dicomFilePath: 'assets/mri.dcm',
  };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImagingStudiesService,
        {
          provide: getRepositoryToken(ImagingStudy),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get<ImagingStudiesService>(ImagingStudiesService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('findOne', () => {
    it('returns study when found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(mockStudy);

      const result = await service.findOne(mockStudy.id);
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: mockStudy.id } });
      expect(result).toEqual(mockStudy);
    });

    it('throws NotFoundException when study not found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStudyFile', () => {
    it('throws NotFoundException when file does not exist on disk', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(mockStudy);
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      const mockRes: any = { set: jest.fn() };
      await expect(service.getStudyFile(mockStudy.id, mockRes)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('streams file and sets appropriate headers when file exists', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(mockStudy);
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'statSync').mockReturnValue({ size: 12345 } as any);
      jest.spyOn(fs, 'createReadStream').mockReturnValue({} as any);

      const mockRes: any = { set: jest.fn() };
      const streamable = await service.getStudyFile(mockStudy.id, mockRes);

      expect(mockRes.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Type': 'application/dicom',
          'Content-Length': '12345',
        }),
      );
      expect(streamable).toBeInstanceOf(StreamableFile);
    });
  });
});
