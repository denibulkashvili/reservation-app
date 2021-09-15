import { ReservationEntity } from './entities/reservation.entity'

export class CreateReservationDto implements Pick<ReservationEntity, 'eventId' | 'userEmail' | 'userPhone'> {
  eventId: number
  userEmail: string
  userPhone: string
  tickets: number[]
}
