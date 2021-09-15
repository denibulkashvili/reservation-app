import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm'
import { BaseEntity } from '../../common/base.entity'
import { SeatEntity } from './seat.entity'
import { VenueEntity } from './venue.entity'

@Entity('sectors')
export class SectorEntity extends BaseEntity {
  @Column()
  refName: string

  @Column()
  totalSeats: number

  @Column()
  venueId: number

  @ManyToOne(
    () => VenueEntity,
    venue => venue.sectors,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'venueId', referencedColumnName: 'id' })
  venue: VenueEntity

  @OneToMany(
    () => SeatEntity,
    seat => seat.sector,
  )
  seats: SeatEntity[]
}
