import { Item } from '@micropos/shared/src/domains/index';

export interface ActiveCheckoutItem extends Item {
  quantity: number;
  checked: boolean;
}
