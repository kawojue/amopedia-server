import { v4 as uuidv4 } from 'uuid';
import { validateFile } from 'utils/file';
import { Request, Response } from 'express';
import { AwsService } from 'lib/aws.service';
import { MiscService } from 'lib/misc.service';
import { StatusCodes } from 'enums/statusCodes';
import { AzureService } from 'lib/azure.service';
import { PlunkService } from 'lib/plunk.service';
import { PrismaService } from 'lib/prisma.service';
import { getIpAddress } from 'helpers/getIPAddress';
import { EmailDTO, LoginDTO } from './dto/login.dto';
import { ResponseService } from 'lib/response.service';
import { ChangePasswordDTO } from './dto/password.dto';
import { GenerateDicomTokenDTO } from './dto/dicom.dto';
import { EncryptionService } from 'lib/encryption.service';
import { genFilename, genPassword } from 'helpers/generator';
import { Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationSignupDTO, PractitionerSignupDTO } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly aws: AwsService,
    private readonly misc: MiscService,
    private readonly azure: AzureService,
    private readonly plunk: PlunkService,
    private readonly prisma: PrismaService,
    private readonly response: ResponseService,
    private readonly encryption: EncryptionService,
  ) {}

  async practitionerSignup(
    res: Response,
    {
      fullname,
      password,
      address,
      zip_code,
      city,
      email,
      country,
      state,
      phone,
      practiceNumber,
      affiliation,
    }: PractitionerSignupDTO,
  ) {
    try {
      const isExists = await this.prisma.practitioner.findFirst({
        where: {
          OR: [
            { email: { equals: email, mode: 'insensitive' } },
            { practiceNumber: { equals: practiceNumber, mode: 'insensitive' } },
          ],
        },
      });

      if (isExists) {
        return this.response.sendError(
          res,
          StatusCodes.Conflict,
          'Email or practice number already exist.',
        );
      }

      password = await this.encryption.hashAsync(password);

      await this.prisma.practitioner.create({
        data: {
          role: 'radiologist',
          type: 'system',
          status: 'PENDING',
          email,
          fullname,
          affiliation,
          password,
          practiceNumber,
          demographic: {
            create: { phone, city, state, country, address, zip_code },
          },
        },
      });

      // TODO: mailing

      this.response.sendSuccess(res, StatusCodes.Created, {
        message:
          "You will be notified when you're verified by our specialists.",
      });
    } catch (err) {
      this.misc.handleServerError(res, err);
    }
  }

  async organizationSignup(
    req: Request,
    res: Response,
    {
      organizationName,
      fullname,
      address,
      state,
      city,
      country,
      email,
      password,
      phone,
      zip_code,
    }: OrganizationSignupDTO,
  ) {
    try {
      const isExist = await this.prisma.center.findFirst({
        where: {
          OR: [
            { email: { equals: email, mode: 'insensitive' } },
            { centerName: { equals: organizationName, mode: 'insensitive' } },
          ],
        },
      });

      if (isExist) {
        return this.response.sendError(
          res,
          StatusCodes.Conflict,
          'Organization already exist',
        );
      }

      const id = uuidv4();

      password = await this.encryption.hashAsync(password);

      await this.prisma.$transaction([
        this.prisma.center.create({
          data: {
            id: id,
            status: 'PENDING',
            email,
            centerName: organizationName,
            demographic: {
              create: {
                city,
                address,
                state,
                ip: getIpAddress(req),
                country,
                zip_code,
                phone,
              },
            },
          },
        }),
        this.prisma.centerAdmin.create({
          data: {
            superAdmin: true,
            fullname,
            email,
            password,
            center: { connect: { id } },
            demographic: { create: { phone } },
            status: 'PENDING',
            role: 'centerAdmin',
          },
        }),
      ]);

      // Todo: mailing

      this.response.sendSuccess(res, StatusCodes.Created, {
        message:
          "You'll be notified when your organization is verified by the board",
      });
    } catch (err) {
      this.misc.handleServerError(res, err);
    }
  }

  async login(res: Response, { email, password }: LoginDTO) {
    try {
      let user = (await this.prisma.centerAdmin.findUnique({
        where: { email },
        include: { center: true },
      })) as any;

      if (!user) {
        user = await this.prisma.practitioner.findUnique({
          where: { email },
          include: { center: true },
        });
      }

      if (!user) {
        return this.response.sendError(
          res,
          StatusCodes.NotFound,
          'Invalid email or password',
        );
      }

      if (user?.center) {
        if (user.center.status === 'PENDING') {
          return this.response.sendError(
            res,
            StatusCodes.Unauthorized,
            'Your organization is pending verification',
          );
        }

        if (user.center.status === 'SUSPENDED') {
          return this.response.sendError(
            res,
            StatusCodes.Forbidden,
            'Your organization has been suspended',
          );
        }
      }

      if (user.status === 'SUSPENDED') {
        return this.response.sendError(
          res,
          StatusCodes.Unauthorized,
          'Your account has been suspended',
        );
      }

      if (user.status === 'PENDING') {
        return this.response.sendError(
          res,
          StatusCodes.Unauthorized,
          'Your account is pending verification',
        );
      }

      const isMatch = await this.encryption.compareAsync(
        password,
        user.password,
      );
      if (!isMatch) {
        return this.response.sendError(
          res,
          StatusCodes.Unauthorized,
          'Incorrect password',
        );
      }

      const data: ILogin = {
        id: user.id,
        role: user.role,
        email: user.email,
        status: user.status,
        avatar: user?.avatar,
        fullname: user.fullname,
        centerId: user?.centerId,
        modelName: user.role === 'centerAdmin' ? 'centerAdmin' : 'practitioner',
        route:
          user.role === 'centerAdmin'
            ? `/organization/dashboard`
            : `/practitioner/dashboard`,
      };

      const access_token = await this.misc.generateNewAccessToken({
        sub: data.id,
        role: data.role,
        status: data.status,
        centerId: data.centerId,
        modelName: data.modelName,
      });

      this.response.sendSuccess(res, StatusCodes.OK, {
        data,
        access_token,
        message: 'Login successful',
      });
    } catch (err) {
      this.misc.handleServerError(res, err);
    }
  }

  async resetPassword(res: Response, { email }: EmailDTO) {
    try {
      const select = {
        id: true,
        role: true,
        email: true,
        status: true,
        center: { select: { status: true } },
      };

      let user = (await this.prisma.centerAdmin.findUnique({
        where: { email },
        select,
      })) as any;

      if (!user) {
        user = await this.prisma.practitioner.findUnique({
          where: { email },
          select,
        });
      }

      if (!user) {
        return this.response.sendError(
          res,
          StatusCodes.NotFound,
          'Invalid email',
        );
      }

      if (user?.center) {
        if (user.center.status === 'PENDING') {
          return this.response.sendError(
            res,
            StatusCodes.Unauthorized,
            'Your organization is pending verification',
          );
        }

        if (user.center.status === 'SUSPENDED') {
          return this.response.sendError(
            res,
            StatusCodes.Forbidden,
            'Your organization has been suspended',
          );
        }
      }

      if (user.status === 'SUSPENDED') {
        return this.response.sendError(
          res,
          StatusCodes.Unauthorized,
          'Your account has been suspended',
        );
      }

      if (user.status === 'PENDING') {
        return this.response.sendError(
          res,
          StatusCodes.Unauthorized,
          'Your account is pending verification',
        );
      }

      const password = await genPassword();

      await (
        this.prisma[
          user.role === 'centerAdmin' ? 'centerAdmin' : 'practitioner'
        ] as any
      ).update({
        where: { id: user.id },
        data: {
          password: await this.encryption.hashAsync(password),
        },
      });

      res.on('finish', async () => {
        await this.plunk.sendPlunkEmail({
          to: user.email,
          subject: 'Password Reset',
          body: `<h4>New Password: </h4> ${password}`,
        });
      });

      this.response.sendSuccess(res, StatusCodes.OK, {
        message:
          'Your password has been reseted. Please check your email for the new password.',
      });
    } catch (err) {
      this.misc.handleServerError(res, err);
    }
  }

  async changePassword(
    res: Response,
    { sub, modelName }: ExpressUser,
    { currentPassword, newPassword }: ChangePasswordDTO,
  ) {
    try {
      const user = await this.prisma[modelName].findUnique({
        where: { id: sub },
      });

      const isPasswordCorrect = await this.encryption.compareAsync(
        currentPassword,
        user.password,
      );
      if (!isPasswordCorrect) {
        return this.response.sendError(
          res,
          StatusCodes.Unauthorized,
          'Incorrect password',
        );
      }

      await this.prisma[modelName].update({
        where: { id: sub },
        data: {
          password: await this.encryption.hashAsync(newPassword),
        },
      });

      this.response.sendSuccess(res, StatusCodes.OK, {
        message: 'Your password has been updated',
      });
    } catch (err) {
      this.misc.handleServerError(res, err);
    }
  }

  async updateAvatar(
    res: Response,
    file: Express.Multer.File,
    { sub, modelName }: ExpressUser,
  ) {
    try {
      const user = await this.prisma[modelName].findUnique({
        where: { id: sub },
      });

      if (!user) {
        return this.response.sendError(
          res,
          StatusCodes.NotFound,
          'Account not found',
        );
      }

      if (!file) {
        return this.response.sendError(
          res,
          StatusCodes.BadRequest,
          'No image was selected',
        );
      }

      const re = validateFile(file, 5 << 20, 'image/png', 'image/jpeg');

      if (re?.status) {
        return this.response.sendError(res, re.status, re.message);
      }

      const path = `profile-photos/${genFilename(re.file)}`;
      try {
        await this.azure.uploadBlob(re.file, path);

        const avatar = user.avatar;
        if (avatar?.path) {
          await this.azure.deleteBlob(avatar.path);
        }
      } catch (err) {
        throw err;
      }

      const url = this.azure.getBlobUrl(path);

      await this.prisma[modelName].update({
        where: { id: user.id },
        data: {
          avatar: {
            path,
            url,
            size: re.file.size,
            type: re.file.mimetype,
          },
        },
      });

      this.response.sendSuccess(res, StatusCodes.OK, { data: { url } });
    } catch (err) {
      this.misc.handleServerError(res, err, 'Error uploading profile photo');
    }
  }

  async downloadFile(res: Response, path: string) {
    try {
      const { data, contentLength } = await this.azure.downloadBlob(path);

      res.setHeader('Content-Length', contentLength);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${path.split('/').pop()}"`,
      );
      res.setHeader('Content-Type', 'application/octet-stream');

      res.send(data);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return this.response.sendError(
          res,
          StatusCodes.NotFound,
          'File not found',
        );
      } else {
        return this.response.sendError(
          res,
          StatusCodes.InternalServerError,
          'Internal server error',
        );
      }
    }
  }

  async generateDicomToken(
    res: Response,
    { sub, centerId, role }: ExpressUser,
    { studyId, mrn }: GenerateDicomTokenDTO,
  ) {
    const study = await this.prisma.patientStudy.findUnique({
      where: {
        centerId,
        patient: { mrn },
        study_id: studyId,
      },
    });

    if (!study) {
      return this.response.sendError(
        res,
        StatusCodes.NotFound,
        'Study not found',
      );
    }

    const token = await this.misc.generateNewDicomToken({
      mrn,
      studyId,
      centerId,
      sub,
      role,
    });

    this.response.sendSuccess(res, StatusCodes.OK, { token });
  }
}
