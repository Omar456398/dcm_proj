import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { Doctor } from './entities/doctor.entity';
import { ImagingStudy } from './entities/imaging-study.entity';
import { AppointmentsModule } from './appointments/appointments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USER ?? 'dcm_user',
      password: process.env.DB_PASSWORD ?? 'dcm_pass',
      database: process.env.DB_NAME ?? 'dcm_db',
      entities: [Appointment, Doctor, ImagingStudy],
      synchronize: false, // migrations only — never true in production
    }),

    AppointmentsModule,
  ],
})
export class AppModule {}
