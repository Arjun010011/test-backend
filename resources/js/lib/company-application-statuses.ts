export const companyApplicationStatuses = [
    'submitted',
    'under_review',
    'selected',
    'waiting_list',
    'accepted',
    'hired',
    'rejected',
] as const;

export type CompanyApplicationStatus = (typeof companyApplicationStatuses)[number];
