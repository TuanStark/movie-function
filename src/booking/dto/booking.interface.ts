export interface CreateBookingInput {
    userId: number;
    showtimeId: number;
    seatIds: number[];
    paymentMethod?: string;
    images?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    promotionId?: number;
  }

  export interface UpdateBookingInput {
    status?: string;
    paymentMethod?: string;
    images?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
  }