export interface CreateSeatInput {
    theaterId: number;
    row: string;
    number: number;
    type: string;
    price: number;
}

export interface BulkCreateSeatInput {
    theaterId: number;
    seats: {
        row: string;
        number: number;
        type: string;
        price: number;
    }[];
}

export interface UpdateSeatInput {
    row?: string;
    number?: number;
    type?: string;
    price?: number;
}