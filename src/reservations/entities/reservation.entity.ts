import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm'
import { BaseEntity } from '../../common/base.entity'
import { EventEntity } from './event.entity'
import { TicketEntity } from './ticket.entity'

export enum ReservationStatusEnum {
  Reserved = 'RESERVED',
  Paid = 'PAID',
}

@Entity('reservations')
export class ReservationEntity extends BaseEntity {
  @Column()
  eventId: number

  @ManyToOne(() => EventEntity)
  @JoinColumn({ name: 'eventId', referencedColumnName: 'id' })
  event: EventEntity

  @Column()
  userEmail: string

  @Column()
  userPhone: string

  @OneToMany(
    () => TicketEntity,
    ticket => ticket.reservation,
  )
  tickets: TicketEntity[]

  @Column({ type: 'simple-enum', enum: ReservationStatusEnum, default: ReservationStatusEnum.Reserved })
  status: ReservationStatusEnum

  @Column()
  numOfTickets: number

  @Column({ type: 'numeric' })
  totalCost: number
}
