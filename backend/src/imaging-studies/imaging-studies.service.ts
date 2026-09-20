import {
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { ImagingStudy } from '../entities/imaging-study.entity';
import type { Response } from 'express';

@Injectable()
export class ImagingStudiesService {
  constructor(
    @InjectRepository(ImagingStudy)
    private readonly imagingStudyRepo: Repository<ImagingStudy>,
  ) {}

  async findOne(id: string): Promise<ImagingStudy> {
    const study = await this.imagingStudyRepo.findOne({ where: { id } });
    if (!study) {
      throw new NotFoundException(`Imaging study ${id} not found`);
    }
    return study;
  }

  async getStudyFile(id: string, res: Response): Promise<StreamableFile> {
    const study = await this.findOne(id);

    // Resolve relative path from backend root
    let resolvedPath = path.resolve(process.cwd(), study.dicomFilePath);
    if (!fs.existsSync(resolvedPath)) {
      // Fallback relative to project root
      resolvedPath = path.resolve(
        process.cwd(),
        '..',
        'backend',
        study.dicomFilePath,
      );
    }

    if (!fs.existsSync(resolvedPath)) {
      throw new NotFoundException(
        `DICOM file at ${study.dicomFilePath} not found on server`,
      );
    }

    const stat = fs.statSync(resolvedPath);
    const filename = path.basename(resolvedPath);

    res.set({
      'Content-Type': 'application/dicom',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': stat.size.toString(),
      'Accept-Ranges': 'bytes',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges, Content-Type',
    });

    const fileStream = fs.createReadStream(resolvedPath);
    return new StreamableFile(fileStream);
  }
}
