export interface Classes {
    id: string;
    className: string;
    grade: number | undefined;
    students: Student[] | undefined;
    studentCount: number | undefined;
}

export interface Student {
    id: string;
    number: number;
    name: string;
    className: string;
}