import type { CommonEntity } from "@/models/api.model";
import type { TransactionType } from "@/models/enums";
import type { UserViewModel } from "@/store/user/model";

export interface CategoryViewModel extends CommonEntity {
  userId?: string;
  user?: UserViewModel;
  name?: string;
  icon?: string;
  color?: string;
  type?: TransactionType;
  typeName?: string;
  isDefault?: boolean;
  parentId?: string;
}
