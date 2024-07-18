-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PatientStatus" AS ENUM ('New', 'Archived');

-- CreateEnum
CREATE TYPE "StudyStatus" AS ENUM ('Opened', 'Closed', 'Assigned', 'Unassigned');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('Medium', 'Urgent', 'Routine', 'Extreme', 'Critical');

-- CreateEnum
CREATE TYPE "Modality" AS ENUM ('CR', 'CT', 'MR', 'NM', 'US', 'OT', 'XA', 'RF', 'DX', 'MG', 'PT', 'RG', 'OP', 'XC', 'SC', 'IVUS');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('Male', 'Female');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('Single', 'Married', 'Widowed', 'Divorced', 'Seperated');

-- CreateEnum
CREATE TYPE "Roles" AS ENUM ('admin', 'doctor', 'specialist', 'radiologist', 'centerAdmin');

-- CreateEnum
CREATE TYPE "PracType" AS ENUM ('center', 'system');

-- CreateTable
CREATE TABLE "Demographic" (
    "id" UUID NOT NULL,
    "ip" TEXT,
    "dob" TIMESTAMP(3),
    "gender" "Gender",
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "phone" TEXT,
    "zip_code" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Demographic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Adspec" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "fullname" TEXT NOT NULL,
    "superAdmin" BOOLEAN NOT NULL DEFAULT false,
    "password" TEXT NOT NULL,
    "role" "Roles" NOT NULL,
    "avatar" JSONB,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "demographicId" UUID NOT NULL,

    CONSTRAINT "Adspec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Center" (
    "id" UUID NOT NULL,
    "centerName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "demographicId" UUID NOT NULL,

    CONSTRAINT "Center_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CenterAdmin" (
    "id" UUID NOT NULL,
    "superAdmin" BOOLEAN NOT NULL DEFAULT false,
    "fullname" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" JSONB,
    "email" TEXT NOT NULL,
    "role" "Roles" NOT NULL DEFAULT 'centerAdmin',
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "centerId" UUID NOT NULL,
    "demographicId" UUID,

    CONSTRAINT "CenterAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Practitioner" (
    "id" UUID NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "fullname" TEXT NOT NULL,
    "avatar" JSONB,
    "type" "PracType" NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "affiliation" TEXT,
    "practiceNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" "Roles" NOT NULL,
    "centerId" UUID,
    "demographicId" UUID NOT NULL,

    CONSTRAINT "Practitioner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" UUID NOT NULL,
    "mrn" TEXT NOT NULL,
    "fullname" TEXT NOT NULL,
    "govtId" TEXT,
    "email" TEXT NOT NULL,
    "maritalStatus" "MaritalStatus",
    "status" "PatientStatus" NOT NULL DEFAULT 'New',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "centerId" UUID NOT NULL,
    "demographicId" UUID NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientStudy" (
    "id" UUID NOT NULL,
    "study_id" TEXT NOT NULL,
    "body_part" TEXT NOT NULL,
    "priority" "Priority" NOT NULL,
    "modality" "Modality" NOT NULL,
    "cpt_code" TEXT,
    "procedure" TEXT,
    "description" TEXT,
    "clinical_info" TEXT,
    "site" TEXT,
    "reporting_status" "StudyStatus",
    "access_code" TEXT,
    "paperwork" JSONB[],
    "dicoms" JSONB[],
    "status" "StudyStatus" NOT NULL DEFAULT 'Unassigned',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "centerId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "practitionerId" UUID,

    CONSTRAINT "PatientStudy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trash" (
    "id" UUID NOT NULL,
    "files" JSONB[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "centerId" UUID NOT NULL,

    CONSTRAINT "Trash_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Demographic_phone_idx" ON "Demographic"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Adspec_email_key" ON "Adspec"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Adspec_demographicId_key" ON "Adspec"("demographicId");

-- CreateIndex
CREATE UNIQUE INDEX "Center_centerName_key" ON "Center"("centerName");

-- CreateIndex
CREATE UNIQUE INDEX "Center_email_key" ON "Center"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Center_demographicId_key" ON "Center"("demographicId");

-- CreateIndex
CREATE UNIQUE INDEX "CenterAdmin_email_key" ON "CenterAdmin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CenterAdmin_demographicId_key" ON "CenterAdmin"("demographicId");

-- CreateIndex
CREATE UNIQUE INDEX "Practitioner_email_key" ON "Practitioner"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Practitioner_practiceNumber_key" ON "Practitioner"("practiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Practitioner_demographicId_key" ON "Practitioner"("demographicId");

-- CreateIndex
CREATE INDEX "Practitioner_fullname_email_idx" ON "Practitioner"("fullname", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_mrn_key" ON "Patient"("mrn");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_govtId_key" ON "Patient"("govtId");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_email_key" ON "Patient"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_demographicId_key" ON "Patient"("demographicId");

-- CreateIndex
CREATE INDEX "Patient_fullname_email_idx" ON "Patient"("fullname", "email");

-- CreateIndex
CREATE UNIQUE INDEX "PatientStudy_study_id_key" ON "PatientStudy"("study_id");

-- CreateIndex
CREATE UNIQUE INDEX "PatientStudy_access_code_key" ON "PatientStudy"("access_code");

-- CreateIndex
CREATE INDEX "PatientStudy_study_id_body_part_clinical_info_access_code_d_idx" ON "PatientStudy"("study_id", "body_part", "clinical_info", "access_code", "description");

-- AddForeignKey
ALTER TABLE "Adspec" ADD CONSTRAINT "Adspec_demographicId_fkey" FOREIGN KEY ("demographicId") REFERENCES "Demographic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Center" ADD CONSTRAINT "Center_demographicId_fkey" FOREIGN KEY ("demographicId") REFERENCES "Demographic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CenterAdmin" ADD CONSTRAINT "CenterAdmin_demographicId_fkey" FOREIGN KEY ("demographicId") REFERENCES "Demographic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CenterAdmin" ADD CONSTRAINT "CenterAdmin_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Practitioner" ADD CONSTRAINT "Practitioner_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Practitioner" ADD CONSTRAINT "Practitioner_demographicId_fkey" FOREIGN KEY ("demographicId") REFERENCES "Demographic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_demographicId_fkey" FOREIGN KEY ("demographicId") REFERENCES "Demographic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientStudy" ADD CONSTRAINT "PatientStudy_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "Practitioner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientStudy" ADD CONSTRAINT "PatientStudy_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientStudy" ADD CONSTRAINT "PatientStudy_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trash" ADD CONSTRAINT "Trash_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
