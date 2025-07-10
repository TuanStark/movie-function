import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateSeatDto } from './dto/create-seat.dto';
import { UpdateSeatDto } from './dto/update-seat.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { BulkCreateSeatInput, CreateSeatInput, UpdateSeatInput } from './dto/seat.interface';

@Injectable()
export class SeatsService {
  constructor(private readonly prisma: PrismaService) {}

  async createSeat(input: CreateSeatInput) {
    // Verify theater exists
    const theater = await this.prisma.theater.findUnique({
      where: { id: input.theaterId },
    });

    if (!theater) {
      throw new NotFoundException('Theater not found');
    }

    // Check if seat with same row and number exists in the theater
    const existingSeat = await this.prisma.seat.findFirst({
      where: {
        theaterId: input.theaterId,
        row: input.row,
        number: input.number,
      },
    });

    if (existingSeat) {
      throw new ConflictException('Seat with this row and number already exists in the theater');
    }

    // Create seat
    const seat = await this.prisma.seat.create({
      data: {
        theaterId: input.theaterId,
        row: input.row,
        number: input.number,
        type: input.type,
        price: input.price,
      },
      include: {
        theater: true,
      },
    });

    return seat;
  }

  async getSeat(id: number) {
    const seat = await this.prisma.seat.findUnique({
      where: { id },
      include: {
        theater: true,
        bookingSeats: {
          include: {
            booking: true,
          },
        },
      },
    });

    if (!seat) {
      throw new NotFoundException('Seat not found');
    }

    return seat;
  }

  async getSeatsByTheater(theaterId: number) {
    const theater = await this.prisma.theater.findUnique({
      where: { id: theaterId },
    });

    if (!theater) {
      throw new NotFoundException('Theater not found');
    }

    return this.prisma.seat.findMany({
      where: { theaterId },
      include: {
        theater: true,
        bookingSeats: {
          include: {
            booking: {
              include: {
                user: true,
                showtime: true,
              },
            },
          },
        },
      },
      orderBy: [
        { row: 'asc' },
        { number: 'asc' },
      ],
    });
  }

  async updateSeat(id: number, input: UpdateSeatInput) {
    // Verify seat exists
    const seat = await this.prisma.seat.findUnique({
      where: { id },
    });

    if (!seat) {
      throw new NotFoundException('Seat not found');
    }

    // If updating row and number, check for conflicts
    if (input.row && input.number) {
      const existingSeat = await this.prisma.seat.findFirst({
        where: {
          theaterId: seat.theaterId,
          row: input.row,
          number: input.number,
          NOT: { id },
        },
      });

      if (existingSeat) {
        throw new ConflictException('Seat with this row and number already exists in the theater');
      }
    }

    // Update seat
    const updatedSeat = await this.prisma.seat.update({
      where: { id },
      data: {
        row: input.row,
        number: input.number,
        type: input.type,
        price: input.price,
        updatedAt: new Date(),
      },
      include: {
        theater: true,
      },
    });

    return updatedSeat;
  }

  async deleteSeat(id: number) {
    // Verify seat exists
    const seat = await this.prisma.seat.findUnique({
      where: { id },
    });

    if (!seat) {
      throw new NotFoundException('Seat not found');
    }

    // Check if seat is booked
    const bookingSeats = await this.prisma.bookingSeat.findMany({
      where: {
        seatId: id,
        status: 'BOOKED',
      },
    });

    if (bookingSeats.length > 0) {
      throw new ConflictException('Cannot delete seat with active bookings');
    }

    // Delete seat
    await this.prisma.seat.delete({
      where: { id },
    });

    return { message: `Seat with ID ${id} deleted successfully` };
  }


  async bulkCreateSeats(input: BulkCreateSeatInput) {
    // Kiểm tra rạp tồn tại
    const theater = await this.prisma.theater.findUnique({
      where: { id: input.theaterId },
    });

    if (!theater) {
      throw new NotFoundException('Rạp không tồn tại');
    }

    // Kiểm tra ghế trùng lặp (row và number) trong rạp
    const existingSeats = await this.prisma.seat.findMany({
      where: {
        theaterId: input.theaterId,
        OR: input.seats.map(seat => ({
          row: seat.row,
          number: seat.number,
        })),
      },
      select: { row: true, number: true },
    });

    if (existingSeats.length > 0) {
      const duplicates = existingSeats.map(s => `hàng ${s.row}, số ${s.number}`).join('; ');
      throw new ConflictException(`Ghế đã tồn tại: ${duplicates}`);
    }

    // Tạo hàng loạt ghế trong giao dịch
    const createdSeats = await this.prisma.$transaction(async (tx) => {
      const seats = await tx.seat.createMany({
        data: input.seats.map(seat => ({
          theaterId: input.theaterId,
          row: seat.row,
          number: seat.number,
          type: seat.type,
          price: seat.price,
        })),
      });

      // Lấy lại ghế đã tạo để trả về thông tin đầy đủ
      return tx.seat.findMany({
        where: {
          theaterId: input.theaterId,
          createdAt: { gte: new Date(Date.now() - 1000) }, // Lấy ghế vừa tạo
        },
        include: { theater: true },
      });
    });

    return createdSeats;
  }
}
