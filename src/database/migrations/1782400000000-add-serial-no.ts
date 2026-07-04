import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSerialNo1782400000000 implements MigrationInterface {
  name = 'AddSerialNo1782400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add nullable column first (existing rows get NULL)
    await queryRunner.query(
      `ALTER TABLE "property" ADD "serial_no" character varying(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "property" ADD CONSTRAINT "UQ_property_serial_no" UNIQUE ("serial_no")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "property" DROP CONSTRAINT "UQ_property_serial_no"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property" DROP COLUMN "serial_no"`,
    );
  }
}
