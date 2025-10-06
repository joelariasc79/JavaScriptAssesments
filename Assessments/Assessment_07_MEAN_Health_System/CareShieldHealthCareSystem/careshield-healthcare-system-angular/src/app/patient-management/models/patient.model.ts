export interface Patient {
  _id?: string;
  username: string;
  email: string;
  password: string;
  name: string;
  age: number;
  profession: string;
  contact_number: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  gender: string;
  pre_existing_disease: string[];
  // medical_certificate_url: string;
  role: 'patient';
  hospital: string[] | any[];
}
