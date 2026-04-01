export type UserRole = "admin" | "hr_manager" | "hr_employee" | "section_manager";
export type EmployeeStatus = "active" | "on_leave" | "absent" | "suspended" | "terminated";
export interface Section { id: number; name: string; description: string; is_active: boolean; }
export interface Employee { id: number; first_name: string; last_name: string; full_name: string; tc_kimlik_no: string; phone: string; section_id: number; position: string; status: EmployeeStatus; start_date: string; gross_salary: number; annual_leave_total: number; annual_leave_used: number; performance_score: number; is_clocked_in: boolean; is_approved: boolean; sections?: Section; }
export interface Profile { id: string; full_name: string; email: string; role: UserRole; section_id: number | null; }
