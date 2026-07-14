export type MapAssistant = {
  profileId: string;
  name: string;
  tandem: boolean;
  startTime: string;
  endTime: string;
};

export type MapChild = {
  id: string;
  firstName: string;
  lastName: string;
  assistants: MapAssistant[];
};

export type MapSchool = {
  key: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  children: MapChild[];
};

export type MapPayload = {
  date: string;
  weekday: number;
  schools: MapSchool[];
};
