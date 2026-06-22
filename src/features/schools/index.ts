export { SchoolsFacade } from "./facade";
export {
  SchoolFieldsSchema,
  CreateSchoolSchema,
  UpdateSchoolSchema,
  AssignHolidayPlanSchema,
} from "./schemas";
export type {
  SchoolInput,
  UpdateSchoolInput,
  AssignHolidayPlanInput,
} from "./schemas";
export {
  serializeSchool,
  type SerializedSchool,
  type SerializedHoliday,
  type SerializedSchoolHolidayPlan,
} from "./serialize";
export { SchoolsTable } from "./components/schools-table";
export { SchoolSelect, type SchoolOption } from "./components/school-select";
