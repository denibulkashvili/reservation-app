import { Column, Entity, OneToMany } from 'typeorm'
import { BaseEntity } from '../../common/base.entity'
import { SectorEntity } from './sector.entity'

@Entity('venues')
export class VenueEntity extends BaseEntity {
  @Column()
  name: string

  @Column()
  address: string

  @Column()
  phoneNumber: string

  @OneToMany(
    () => SectorEntity,
    sector => sector.venue,
  )
  sectors: SectorEntity[]
}
