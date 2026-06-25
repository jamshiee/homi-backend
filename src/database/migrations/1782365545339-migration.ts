import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1782365545339 implements MigrationInterface {
    name = 'Migration1782365545339'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."hotel_detail_hotel_category_enum" AS ENUM('luxury', 'premium', 'classic')`);
        await queryRunner.query(`ALTER TABLE "hotel_detail" ADD "hotel_category" "public"."hotel_detail_hotel_category_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hotel_detail" DROP COLUMN "hotel_category"`);
        await queryRunner.query(`DROP TYPE "public"."hotel_detail_hotel_category_enum"`);
    }

}
