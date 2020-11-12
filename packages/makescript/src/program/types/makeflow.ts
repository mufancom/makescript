import type {OrganizationId, UserId} from '@makeflow/types-nominal';

// TODO: Remove this file while '@makeflow/types' completed.

export interface MFUserCandidate {
  id: UserId;
  username: string;
  organization: MFOrganizationBasics;
  profile: MFUserProfile | undefined;
  disabled: boolean | undefined;
}

export interface MFOrganizationBasics {
  id: OrganizationId;
  displayName: string;
}

export interface MFUserProfile {
  fullName?: string | undefined;
  avatar?: string | undefined;
  bio?: string | undefined;
  mobile?: string | undefined;
  email?: string | undefined;
  position?: string | undefined;
}
