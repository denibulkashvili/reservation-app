import { Test, TestingModule } from '@nestjs/testing'
import { Connection } from 'typeorm'
import { AppModule } from '../app.module'
import { ConcertEventName, ConcertVenueName, seedEvent, seedVenue } from '../common/seeds'
import { EventEntity } from './entities/event.entity'
import { VenueEntity } from './entities/venue.entity'
import { CreateReservationDto } from './reservation.dto'
import { ReservationsService } from './reservations.service'

describe('ReservationsService', () => {
  let module: TestingModule
  let service: ReservationsService
  let conn: Connection

  let venue: VenueEntity
  let event: EventEntity

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile()
    service = module.get<ReservationsService>(ReservationsService)
    conn = module.get(Connection)
  })

  afterAll(() => module.close())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('Seed data', () => {
    it('should seed venues', async () => {
      await expect(seedVenue(conn).then(res => (venue = res))).resolves.toMatchObject({
        name: ConcertVenueName,
      } as VenueEntity)
    })

    it('should seed event', async () => {
      event = await seedEvent(conn, venue)
      expect(event).toMatchObject({ name: ConcertEventName })
      expect(event.tickets).toHaveLength(12)
    })
  })

  describe('Create Reservation', () => {
    it('should THROW - event not found', () => {
      return expect(service.createReservation({ eventId: 404 } as CreateReservationDto)).rejects.toThrow(
        /Event not found/,
      )
    })

    it('should THROW - no tickets in payload', async () => {
      await expect(service.createReservation({ eventId: event.id } as CreateReservationDto)).rejects.toThrow(
        /Reservation should have at least 1 ticket/,
      )
      return expect(
        service.createReservation({ eventId: event.id, tickets: [] } as CreateReservationDto),
      ).rejects.toThrow(/Reservation should have at least 1 ticket/)
    })

    it("should THROW - 'even' validation fails", async () => {
      await expect(
        service.createReservation({ eventId: event.id, tickets: [event.tickets[0].id] } as CreateReservationDto),
      ).rejects.toThrow(/Number of tickets must be an even number/)
    })

    it("should THROW - 'all together' validation fails", async () => {
      const tickets = [event.tickets[0].id, event.tickets[3].id]
      await expect(service.createReservation({ eventId: event.id, tickets } as CreateReservationDto)).rejects.toThrow(
        /Tickets must be all together/,
      )
    })

    it("should THROW - 'avoid one' validation fails", async () => {
      const allTicketsFromOneRow = event.tickets.filter(
        ticket => ticket.seat.sectorId === event.tickets[0].seat.sectorId,
      )
      expect(allTicketsFromOneRow).toHaveLength(6)

      const tickets = [
        allTicketsFromOneRow[1].id,
        allTicketsFromOneRow[2].id,
        allTicketsFromOneRow[3].id,
        allTicketsFromOneRow[4].id,
      ]

      await expect(
        service.createReservation({
          eventId: event.id,
          tickets,
        } as CreateReservationDto),
      ).rejects.toThrow(/Cannot leave only 1 ticket available/)
    })

    it('should succeed', async () => {
      const payload: CreateReservationDto = {
        userEmail: 'email@email.com',
        userPhone: '12345678',
        eventId: event.id,
        tickets: [event.tickets[0].id, event.tickets[1].id],
      }

      await expect(service.createReservation(payload)).resolves.toMatchObject({
        ...payload,
        tickets: expect.arrayContaining(payload.tickets.map(id => expect.objectContaining({ id }))),
      })
    })

    it('should THROW - tickets already reserved', async () => {
      const sameTickets = [event.tickets[0].id, event.tickets[1].id]
      await expect(
        service.createReservation({
          eventId: event.id,
          tickets: sameTickets,
        } as CreateReservationDto),
      ).rejects.toThrow(new RegExp(`Tickets already reserved: ${sameTickets.join(',')}`))
    })
  })
})
