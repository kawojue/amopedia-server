import { Controller } from '@nestjs/common'
import { CenterService } from './center.service'

@Controller('center')
export class CenterController {
  constructor(private readonly centerService: CenterService) { }
}
