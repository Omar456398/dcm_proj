import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImagingStudy } from '../entities/imaging-study.entity';
import { ImagingStudiesController } from './imaging-studies.controller';
import { ImagingStudiesService } from './imaging-studies.service';

@Module({
  imports: [TypeOrmModule.forFeature([ImagingStudy])],
  controllers: [ImagingStudiesController],
  providers: [ImagingStudiesService],
  exports: [ImagingStudiesService],
})
export class ImagingStudiesModule {}
