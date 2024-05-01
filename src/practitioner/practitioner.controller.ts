import { Controller } from '@nestjs/common'
import { PractitionerService } from './practitioner.service'

@Controller('practitioner')
export class PractitionerController {
  constructor(private readonly practitionerService: PractitionerService) { }
}
