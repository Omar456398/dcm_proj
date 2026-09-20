import { Controller, Get } from '@nestjs/common';
import { DoctorsService } from './doctors.service';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  /** GET /doctors */
  @Get()
  findAll() {
    return this.doctorsService.findAll();
  }
}
