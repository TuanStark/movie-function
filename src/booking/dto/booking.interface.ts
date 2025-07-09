export interface CreateBookingInput {
    userId: number;
    showtimeId: number;
    seatIds: number[];
    paymentMethod?: string;
    images?: string;
  }

  export interface UpdateBookingInput {
    status?: string;
    paymentMethod?: string;
    images?: string;
  }