import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { EventEntity } from './reservations/entities/event.entity'
import { ReservationEntity } from './reservations/entities/reservation.entity'
import { SeatEntity } from './reservations/entities/seat.entity'
import { SectorEntity } from './reservations/entities/sector.entity'
import { TicketEntity } from './reservations/entities/ticket.entity'
import { VenueEntity } from './reservations/entities/venue.entity'
import { ReservationsModule } from './reservations/reservations.module'

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.NODE_ENV === 'test' ? 'test_db' : 'db',
      entities: [VenueEntity, SectorEntity, SeatEntity, EventEntity, TicketEntity, ReservationEntity],
      synchronize: true,
      keepConnectionAlive: true,
      dropSchema: process.env.NODE_ENV === 'test',
    }),
    ReservationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
