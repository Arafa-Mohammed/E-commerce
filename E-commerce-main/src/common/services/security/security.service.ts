import { BadRequestException, Injectable } from "@nestjs/common";
import crypto from "node:crypto";
import { compare , hash } from "bcrypt";
import { ConfigService } from "@nestjs/config";


@Injectable()
export class SecurityService {
    constructor( private readonly configService:ConfigService) {}
    generateHash = async ({
      plaintext,
      salt = Number(this.configService.get("SALT_ROUND")),
    }: {
      plaintext: string;
      salt?: number;
    }): Promise<string> => {
      return await hash(plaintext, salt);
    };
    compareHash = async ({
      plaintext,
      cipherText,
    }: {
      plaintext: string;
      cipherText: string;
    }): Promise<boolean> => {
      return await compare(plaintext, cipherText);
    };
  generateEncryption = async (
    plaintext: string,
  ): Promise<string> => {
    const iv = crypto.randomBytes(Number(this.configService.get<string>("ENC_IV_LENGTH")));
    const ENC_KEY = this.configService.get<string>("ENC_KEY") as string;

    const cipherIvVector = crypto.createCipheriv(
      "aes-256-cbc",
      Buffer.from(ENC_KEY, "hex"), 
      iv,
    );
    let cipherText = cipherIvVector.update(plaintext, "utf-8", "hex");
    cipherText += cipherIvVector.final("hex");
    return `${iv.toString("hex")}:${cipherText}`;
  };

  generateDecryption = async (
    cipherText: string,
  ): Promise<string> => {
    const ENC_KEY = this.configService.get<string>("ENC_KEY") as string;
    const [iv, encryption] = cipherText.split(":");

    if (!iv || !encryption) {
      throw new BadRequestException("Invalid encryption parts");
    }

    const ivLikeBinary = Buffer.from(iv, "hex");

    const deCipherIvVector = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(ENC_KEY, "hex"), 
      ivLikeBinary,
    );
    let plaintext = deCipherIvVector.update(encryption, "hex", "utf-8");
    plaintext += deCipherIvVector.final("utf-8");
    return plaintext;
  };
}
    /* generateEncryption = async (
      plaintext: string,
    ): Promise<string> => {
      const iv = crypto.randomBytes(Number(this.configService.get<string>("ENC_IV_LENGTH")));
      const ENC_KEY =this.configService.get<string>("ENC_KEY") as string
      const cipherIvVector = crypto.createCipheriv(
        "aes-256-cbc",
        this.configService.get<string>("ENC_KEY"),
        iv,
      );
      let cipherText = cipherIvVector.update(plaintext, "utf-8", "hex");
      cipherText += cipherIvVector.final("hex");
      console.log({ iv, cipherIvVector, cipherText, ivv: iv.toString("hex") });
      return `${iv.toString("hex")}:${cipherText}`;
    };
    generateDecryption = async (
      cipherText: string,
    ): Promise<string> => {
        const ENC_KEY =this.configService.get<string>("ENC_KEY") as string
      const [iv, encryption] = cipherText.split(":") || ([] as string[]);
      if (!iv || !encryption) {
        throw new BadRequestException("Invalid encryption parts");
      }
      const ivLikeBinary = Buffer.from(iv, "hex");
      console.log({ iv, ivLikeBinary, encryption });
      const deCipherIvVector = crypto.createDecipheriv(
        "aes-256-cbc",
        this.configService.get<string>("ENC_SECRET_KEY"),
        ivLikeBinary,
      );
      let plaintext = deCipherIvVector.update(encryption, "hex", "utf-8");
      plaintext += deCipherIvVector.final("utf-8");
      return plaintext;
    } */
