export interface Hospital {
  _id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
  };
  type: string;
  contact_number: string;
  charges: number;
}
