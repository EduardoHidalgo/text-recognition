import { NextApiRequest, NextApiResponse, NextApiHandler } from "next";
import { createRouter } from "next-connect";
import { promises as fs } from "fs";
import vision from "@google-cloud/vision";
import multer from "multer";
import path from "path";

import { YugiohCard, YugiohDatabase } from "@/types/yugioh";

const router = createRouter<
  NextApiRequest & { files: Array<Express.Multer.File> },
  NextApiResponse<
    | {
        card: YugiohCard;
      }
    | { error: string }
  >
>();

router
  .use(multer().any() as unknown as NextApiHandler)
  .post(async (req, res) => {
    console.log(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    const client = new vision.ImageAnnotatorClient({
      keyFile,
    });

    const files = req.files;

    let detection: string | null = null;
    for (let f = 0; f < files.length; f++) {
      const file = files[f];

      const [result] = await client.textDetection(file.buffer);

      if (result.fullTextAnnotation && result.fullTextAnnotation.text)
        detection = result.fullTextAnnotation.text;
    }

    if (detection == null)
      return res.status(200).json({ error: "failure in text detection" });

    const values = detection.split("\n");

    const name = values[1];

    const cardNumber = values.find((v) =>
      /[A-Z]{2,4}\d{0,4}-[A-Z]{2,4}\d{2,4}/gm.test(v)
    );

    const cardId = values.find((v) => /\d{8}/gm.test(v));
    const id = cardId ? cardId.substring(0, 8) : "00000000";

    if (cardNumber) {
      const splitedCardNumber = cardNumber.split("-");
      const firstParfOfCardNumber = splitedCardNumber[0];

      let cardNumberReplaced = firstParfOfCardNumber.replace("O", "0");

      if (cardNumberReplaced.includes("ES"))
        cardNumberReplaced = cardNumberReplaced.replace("ES", "EN");

      if (cardNumberReplaced.includes("FR"))
        cardNumberReplaced = cardNumberReplaced.replace("FR", "EN");

      if (cardNumberReplaced.includes("JP"))
        cardNumberReplaced = cardNumberReplaced.replace("JP", "EN");

      const fixedCardNumber = cardNumberReplaced + "-" + splitedCardNumber[1];

      const searchs = { id, name, cardNumber, fixedCardNumber };

      console.log({ searchs });

      const jsonDirectory = path.join(process.cwd(), "public");
      const json = await fs.readFile(jsonDirectory + "/database.json", "utf8");

      const database = JSON.parse(json) as YugiohDatabase;

      const indexFound = database.data.findIndex((card) => {
        if (card.card_sets) {
          if (card.card_sets.some((cs) => cs.set_code === searchs.cardNumber)) {
            return true;
          }

          if (
            card.card_sets.some((cs) => cs.set_code === searchs.fixedCardNumber)
          ) {
            return true;
          }

          if (String(card.id) == searchs.id) {
            return true;
          }

          if (card.name.toUpperCase() == searchs.name.toUpperCase()) {
            return true;
          }
        }
        return false;
      });

      if (indexFound > 0) {
        const card = database.data[indexFound];

        return res.status(200).json({ card });
      } else {
        return res
          .status(200)
          .json({ error: "Invalid card number, unable to find this card." });
      }
    } else {
      return res.status(200).json({ error: "failed to detect card number" });
    }
  });

export default router.handler({
  onError: (err: any, req, res) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({ error: err.message });
  },
});

export const config = {
  api: {
    bodyParser: false, // Disallow body parsing, consume as stream
    externalResolver: true,
  },
};
