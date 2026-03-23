export interface Course {
  Id: string;
  Name: string;
  Classes: Class[];
}

export interface Class {
  Id: string;
  Name: string;
  CourseId: string;
}
