export interface Doctor {
  _id?: string;
  username: string;
  email: string;
  password: string;
  name: string;
  age: number;
  contact_number: string;
  gender?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  specialty: string;
  experience: number;
  fees: number;
  role: 'doctor';
  hospital: string[] | any[];

  // // Optional Mongoose timestamps
  // createdAt?: string;
  // updatedAt?: string;
}
