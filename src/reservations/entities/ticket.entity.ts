import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm'
import { BaseEntity } from '../../common/base.entity'
import { EventEntity } from './event.entity'
import { ReservationEntity } from './reservation.entity'
import { SeatEntity } from './seat.entity'
import { VenueEntity } from './venue.entity'

@Entity('tickets')
@Unique('UQ_seatId-eventId', ['seatId', 'eventId'])
export class TicketEntity extends BaseEntity {
  @Column({ type: 'numeric' })
  cost: number

  @Column()
  seatId: number

  @ManyToOne(
    () => SeatEntity,
    seat => seat.tickets,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'seatId', referencedColumnName: 'id' })
  seat: SeatEntity

  @Column()
  venueId: number

  @ManyToOne(() => VenueEntity)
  @JoinColumn({ name: 'venueId', referencedColumnName: 'id' })
  venue: VenueEntity

  @Column()
  eventId: number

  @ManyToOne(
    () => EventEntity,
    event => event.tickets,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'eventId', referencedColumnName: 'id' })
  event: EventEntity

  @Column({ nullable: true })
  reservationId?: number

  @ManyToOne(() => ReservationEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reservationId', referencedColumnName: 'id' })
  reservation?: ReservationEntity
}
