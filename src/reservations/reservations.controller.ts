import { Body, Controller, Post } from '@nestjs/common'
import { ReservationEntity } from './entities/reservation.entity'
import { CreateReservationDto } from './reservation.dto'
import { ReservationsService } from './reservations.service'

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly service: ReservationsService) {}

  @Post('')
  createReservation(@Body() body: CreateReservationDto): Promise<ReservationEntity> {
    return this.service.createReservation(body)
  }
}
