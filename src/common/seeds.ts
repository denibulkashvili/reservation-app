import { Connection } from 'typeorm'
import { EventEntity } from '../reservations/entities/event.entity'
import { SeatEntity } from '../reservations/entities/seat.entity'
import { SectorEntity } from '../reservations/entities/sector.entity'
import { TicketEntity } from '../reservations/entities/ticket.entity'
import { VenueEntity } from '../reservations/entities/venue.entity'

export const ConcertVenueName = 'Concert Venue'
export const Row1Name = 'Row 1'
export const Row2Name = 'Row 2'

export const ConcertEventName = 'Concert Event'

const genMockSeats = (sector: SectorEntity): Partial<SeatEntity>[] => {
  const { id: sectorId, totalSeats } = sector

  const seats: Partial<SeatEntity>[] = []

  for (let seatNumber = 1; seatNumber <= totalSeats; seatNumber++) {
    const seat: Partial<SeatEntity> = {
      sectorId,
      seatNumber,
    }
    seats.push(seat)
  }

  return seats
}

export const seedVenue = async (conn: Connection): Promise<VenueEntity> => {
  const venueRepo = conn.getRepository(VenueEntity)
  const sectorRepo = conn.getRepository(SectorEntity)
  const seatRepo = conn.getRepository(SeatEntity)

  const exist = await venueRepo.findOne()
  if (exist) {
    return
  }

  // seed venue
  const venueSeed: Partial<VenueEntity> = { name: ConcertVenueName, address: 'UK', phoneNumber: '123' }
  const concertVenue = await venueRepo.save(venueRepo.create(venueSeed))

  // seed sectors
  const sectorSeeds: Partial<SectorEntity>[] = [
    {
      refName: Row1Name,
      totalSeats: 6,
      venueId: concertVenue.id,
    },
    {
      refName: Row2Name,
      totalSeats: 6,
      venueId: concertVenue.id,
    },
  ]
  const [firstRow, secondRow] = await sectorRepo.save(sectorSeeds.map(s => sectorRepo.create(s)))

  // for each sector generate mock seats
  const firstRowSeatsSeed = genMockSeats(firstRow)
  const secondRowSeatsSeed = genMockSeats(secondRow)

  await seatRepo.save([...firstRowSeatsSeed, ...secondRowSeatsSeed].map(seat => seatRepo.create(seat)))
  console.info('Mock venue seeded')

  return venueRepo.findOne({ where: { id: concertVenue.id }, relations: ['sectors', 'sectors.seats'] })
}

export const seedEvent = async (conn: Connection, venue: VenueEntity): Promise<EventEntity> => {
  const eventRepo = conn.getRepository(EventEntity)
  const ticketRepo = conn.getRepository(TicketEntity)

  const exist = await eventRepo.findOne()

  if (exist) {
    return
  }

  const eventPayload: Partial<EventEntity> = {
    name: ConcertEventName,
    address: 'UK',
    venueId: venue.id,
    isTicketOptionEven: true,
    isTicketOptionAllTogether: true,
    isTicketOptionAvoidOne: true,
  }

  const event = await eventRepo.save(eventRepo.create(eventPayload))

  const firstRow = venue.sectors.find(({ refName }) => refName === Row1Name)
  const secondRow = venue.sectors.find(({ refName }) => refName === Row2Name)

  const ticketsPayload: Partial<TicketEntity>[] = [
    ...firstRow.seats.map(seat =>
      ticketRepo.create({ eventId: event.id, cost: 100.0, seatId: seat.id, venueId: venue.id }),
    ),
    ...secondRow.seats.map(seat =>
      ticketRepo.create({ eventId: event.id, cost: 60.0, seatId: seat.id, venueId: venue.id }),
    ),
  ]

  await ticketRepo.save(ticketsPayload)
  console.info('Mock event seeded')

  return eventRepo.findOne({ where: { id: event.id }, relations: ['tickets', 'tickets.seat'] })
}
