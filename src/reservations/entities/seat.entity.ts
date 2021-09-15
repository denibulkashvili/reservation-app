import { Column, Entity, JoinColumn, ManyToOne, OneToMany, Unique } from 'typeorm'
import { BaseEntity } from '../../common/base.entity'
import { SectorEntity } from './sector.entity'
import { TicketEntity } from './ticket.entity'

@Entity('seats')
@Unique('UQ_sectorId-seatNumber', ['sectorId', 'seatNumber'])
export class SeatEntity extends BaseEntity {
  @Column({ nullable: true })
  refName?: string

  @Column()
  seatNumber: number

  @Column()
  sectorId: number

  @ManyToOne(
    () => SectorEntity,
    sector => sector.seats,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'sectorId', referencedColumnName: 'id' })
  sector: SectorEntity

  @OneToMany(
    () => TicketEntity,
    ticket => ticket.seat,
  )
  tickets: TicketEntity[]
}
