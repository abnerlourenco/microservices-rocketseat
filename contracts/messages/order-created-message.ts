export interface OrderCreatedMessage {
  orderId: string;
  amount: number;
  constumer: {
    id: string;
  },
}