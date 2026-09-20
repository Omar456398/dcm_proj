import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CHECKED_IN = 'checked_in',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class ListAppointmentsDto {
  /** ISO date: YYYY-MM-DD */
  @IsDateString()
  date: string;

  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}

export class CreateAppointmentDto {
  @IsString()
  patientName: string;

  @IsUUID()
  doctorId: string;

  /** ISO-8601 datetime with timezone, e.g. 2024-10-21T10:00:00Z */
  @IsDateString()
  startsAt: string;

  @IsInt()
  @Min(1)
  durationMinutes: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateStatusDto {
  @IsEnum(AppointmentStatus, {
    message: `status must be one of: ${Object.values(AppointmentStatus).join(', ')}`,
  })
  status: AppointmentStatus;
}
