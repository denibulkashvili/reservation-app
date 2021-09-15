import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm'
import { BaseEntity } from '../../common/base.entity'
import { TicketEntity } from './ticket.entity'
import { VenueEntity } from './venue.entity'

@Entity('events')
export class EventEntity extends BaseEntity {
  @Column()
  name: string

  @Column()
  address: string

  @Column()
  venueId: number

  @ManyToOne(() => VenueEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'venueId', referencedColumnName: 'id' })
  venue: VenueEntity

  @Column({ nullable: true })
  isTicketOptionEven?: boolean

  @Column({ nullable: true })
  isTicketOptionAllTogether?: boolean

  @Column({ nullable: true })
  isTicketOptionAvoidOne?: boolean

  @OneToMany(
    () => TicketEntity,
    ticket => ticket.event,
  )
  tickets: TicketEntity[]
}
