import { IsString, IsNotEmpty } from 'class-validator';

export class WalletDto {
  @IsString()
  @IsNotEmpty()
  address: string;
}
