export enum Role {
  ADMIN = 'ADMIN',
  CASHIER = 'CASHIER',
}

export enum MovementType {
  RECEIPT = 'RECEIPT',
  WRITE_OFF = 'WRITE_OFF',
  TRANSFER = 'TRANSFER',
}

export enum ShiftStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  MIXED = 'MIXED',
}

export enum OrderStatus {
  COMPLETED = 'COMPLETED',
  REFUNDED = 'REFUNDED',
}
