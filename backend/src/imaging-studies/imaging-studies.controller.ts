import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { ImagingStudiesService } from './imaging-studies.service';

@Controller('imaging-studies')
export class ImagingStudiesController {
  constructor(
    private readonly imagingStudiesService: ImagingStudiesService,
  ) {}

  /** GET /imaging-studies/:id */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.imagingStudiesService.findOne(id);
  }

  /** GET /imaging-studies/:id/file - streams the DICOM file */
  @Get(':id/file')
  getFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return this.imagingStudiesService.getStudyFile(id, res);
  }
}
