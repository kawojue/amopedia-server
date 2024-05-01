import { Controller } from '@nestjs/common'
import { PractitionerService } from './practitioner.service'
import { ApiTags } from '@nestjs/swagger'

@ApiTags("Practitioner")
@Controller('practitioner')
export class PractitionerController {
  constructor(private readonly practitionerService: PractitionerService) { }
}
