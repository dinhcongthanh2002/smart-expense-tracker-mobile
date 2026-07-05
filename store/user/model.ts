import type { CommonEntity } from "@/models/api.model";
import type { Gender } from "@/models/enums";

export interface AttachmentViewModel {
  id?: string;
  docType?: string;
  docTypeName?: string;
  fileUrl?: string;
  entityType?: string;
  description?: string;
  fileName?: string;
  fileSize?: number;
  filePath?: string;
  fileType?: string;
}

export interface UserProfileUpdateModel {
  name?: string;
  phoneNumber?: string;
  email?: string;
  userName?: string;
  birthdate?: string | null;
  gender?: Gender;
}

export interface UserViewModel extends CommonEntity {
  userName?: string;
  name?: string;
  phoneNumber?: string;
  gender?: Gender;
  genderName?: string;
  email?: string;
  birthdate?: string;
  lastActivityDate?: string;
  isLockedOut?: boolean;
  isActive?: boolean;
  activeDate?: string;
  isEmailVerified?: boolean;
  roleListCode?: string[];
  avatar?: AttachmentViewModel;
}
