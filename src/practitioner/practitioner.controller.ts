import { ApiTags } from '@nestjs/swagger'
import { Controller } from '@nestjs/common'
import { PractitionerService } from './practitioner.service'

@ApiTags("Practitioner")
@Controller('practitioner')
export class PractitionerController {
  constructor(private readonly practitionerService: PractitionerService) { }
}
