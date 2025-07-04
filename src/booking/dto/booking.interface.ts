export interface CreateBookingInput {
    userId: number;
    showtimeId: number;
    seatIds: number[];
  }
  
  export interface UpdateBookingInput {
    status?: string;
  }