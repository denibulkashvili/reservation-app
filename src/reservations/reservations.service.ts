import { BadRequestException, Inject, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common'
import { Connection, EntityManager } from 'typeorm'
import { seedEvent, seedVenue } from '../common/seeds'
import { EventEntity } from './entities/event.entity'
import { ReservationEntity } from './entities/reservation.entity'
import { SectorEntity } from './entities/sector.entity'
import { TicketEntity } from './entities/ticket.entity'
import { CreateReservationDto } from './reservation.dto'

@Injectable()
export class ReservationsService implements OnModuleInit {
  constructor(@Inject(Connection) private readonly connection: Connection) {}

  async onModuleInit() {
    const venue = await seedVenue(this.connection)
    await seedEvent(this.connection, venue)
  }

  private getTicketsByIds(ticketIds: number[], trx: EntityManager): Promise<TicketEntity[]> {
    const query = trx
      .getRepository(TicketEntity)
      .createQueryBuilder('tickets')
      .leftJoinAndSelect('tickets.seat', 'seat', 'tickets."seatId" = seat.id')
      .where('tickets.id IN (:...ticketIds)', { ticketIds })
      .orderBy({ 'seat.seatNumber': 'ASC' })

    return query.getMany()
  }

  /**
   * @returns sectors for all tickets that are being reserved
   */
  private getSectorsByTicketIds(ticketIds: number[], eventId: number, trx: EntityManager): Promise<SectorEntity[]> {
    const query = trx
      .getRepository(SectorEntity)
      .createQueryBuilder('sectors')
      .leftJoinAndSelect('sectors.seats', 'seats', 'seats."sectorId" = sectors.id')
      .leftJoinAndSelect('seats.tickets', 'tickets', 'tickets."seatId" = seats.id')
      .where(
        `sectors.id IN (
          SELECT DISTINCT sectors.id FROM sectors LEFT JOIN seats s on sectors.id = s.sectorId LEFT JOIN tickets t on s.id = t.seatId WHERE t.id IN (:...ticketIds)
         )`,
        { ticketIds },
      )
      .andWhere('tickets."eventId" = :eventId', { eventId })

    return query.getMany()
  }

  private validateAllTogether(tickets: TicketEntity[]): void {
    const areInOrder = tickets.every(({ seat: { seatNumber, sectorId } }, index) => {
      if (index === 0) {
        return true
      }

      const prevSeat = tickets[index - 1].seat
      // tickets must be sequential in order and from the same sector
      return seatNumber - prevSeat.seatNumber === 1 && sectorId === prevSeat.sectorId
    })

    if (!areInOrder) {
      throw new BadRequestException('Tickets must be all together')
    }
  }

  private async validateAvoidOne(newTickets: TicketEntity[], eventId: number, trx: EntityManager): Promise<void> {
    const sectors = await this.getSectorsByTicketIds(
      newTickets.map(({ id }) => id),
      eventId,
      trx,
    )

    // remap for fast access to new seats/tickets
    const newSeatsMap = newTickets.reduce(
      (acc, ticket) => ({ ...acc, [ticket.seatId]: true }),
      {} as { [seatId: number]: boolean },
    )

    // for each selected sector
    sectors.forEach(sector => {
      const seats = sector.seats.sort((a, b) => a.seatNumber - b.seatNumber)

      const alreadyReservedSeatsMap = seats.reduce(
        (acc, seat) => ({ ...acc, [seat.id]: !!seat.tickets[0].reservationId }),
        {} as { [seatId: number]: boolean },
      )

      seats.forEach((seat, index) => {
        const isTicketAvailable = !newSeatsMap[seat.id] && !alreadyReservedSeatsMap[seat.id]

        // available ticket must have at least one adjacent available seat
        if (isTicketAvailable) {
          const isLeftAvailable =
            index > 0 && !newSeatsMap[seats[index - 1].id] && !alreadyReservedSeatsMap[seats[index - 1].id]

          const isRightAvailable =
            index < seats.length - 1 &&
            !newSeatsMap[seats[index + 1].id] &&
            !alreadyReservedSeatsMap[seats[index + 1].id]

          if (!isLeftAvailable && !isRightAvailable) {
            throw new BadRequestException('Cannot leave only 1 ticket available')
          }
        }
      })
    })
  }

  private async validateTicketOptions(
    { isTicketOptionEven, isTicketOptionAllTogether, isTicketOptionAvoidOne, id: eventId }: EventEntity,
    tickets: TicketEntity[],
    trx: EntityManager,
  ): Promise<void> {
    if (isTicketOptionEven && tickets.length % 2 !== 0) {
      throw new BadRequestException('Number of tickets must be an even number')
    }

    if (isTicketOptionAllTogether) {
      this.validateAllTogether(tickets)
    }

    if (isTicketOptionAvoidOne) {
      await this.validateAvoidOne(tickets, eventId, trx)
    }
  }

  async createReservation({
    eventId,
    tickets: ticketIds,
    ...userInfo
  }: CreateReservationDto): Promise<ReservationEntity> {
    return this.connection.transaction(async trx => {
      const event = await trx.getRepository(EventEntity).findOne(eventId)

      if (!event) {
        throw new NotFoundException(`Event not found`)
      }

      if (!ticketIds?.length) {
        throw new BadRequestException('Reservation should have at least 1 ticket')
      }

      const tickets = await this.getTicketsByIds(ticketIds, trx)

      const haveReservations = tickets.filter(ticket => !!ticket.reservationId)
      if (haveReservations.length) {
        throw new BadRequestException(`Tickets already reserved: ${haveReservations.map(({ id }) => id).join(',')}`)
      }

      await this.validateTicketOptions(event, tickets, trx)

      const totalCost = tickets.reduce((acc, ticket) => acc + ticket.cost, 0)

      const reservationRepo = trx.getRepository(ReservationEntity)
      const reservation = await reservationRepo.save(
        reservationRepo.create({ eventId, ...userInfo, numOfTickets: tickets.length, totalCost }),
      )
      await trx.getRepository(TicketEntity).save(tickets.map(t => ({ ...t, reservationId: reservation.id })))

      return reservationRepo.findOne({ where: { id: reservation.id }, relations: ['tickets'] })
    })
  }
}
